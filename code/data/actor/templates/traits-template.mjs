import { formatTaggedList, numberFormat, simplifyBonus } from "../../../utils/_module.mjs";
import FormulaField from "../../fields/formula-field.mjs";
import MappingField from "../../fields/mapping-field.mjs";
import ResistancesField from "../fields/resistances-field.mjs";

const { ArrayField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * @typedef {object} ConditionResistanceData
 * @property {Set<string>} value - Resistances regardless of source.
 * @property {Set<string>} nonmagical - Resistances to non-magical sources.
 * @property {string[]} custom - Special resistance information.
 */

/**
 * @typedef {ConditionResistanceData} DamageResistanceData
 * @property {Set<string>} nonmagical - Resistances to non-magical sources.
 */

/**
 * Data definition template for PC & NPC traits.
 *
 * @property {object} traits
 * @property {object} traits.condition
 * @property {ConditionResistanceData} traits.condition.immunities - Condition immunities.
 * @property {ConditionResistanceData} traits.condition.resistances - Condition resistances.
 * @property {ConditionResistanceData} traits.condition.vulnerabilities - Condition vulnerabilities.
 * @property {object} traits.damage
 * @property {DamageResistanceData} traits.damage.immunities - Damage immunities.
 * @property {DamageResistanceData} traits.damage.resistances - Damage resistances.
 * @property {DamageResistanceData} traits.damage.vulnerabilities - Damage vulnerabilities.
 * @property {object} traits.movement
 * @property {number} traits.movement.base - Base movement value made available to specific types as `@base`.
 * @property {string[]} traits.movement.custom - Special movement information.
 * @property {Set<string>} traits.movement.tags - Movement tags.
 * @property {Record<string, string>} traits.movement.types - Formulas for specific movement types.
 * @property {string} traits.movement.units - Units used to measure movement.
 * @property {object} traits.senses
 * @property {string[]} traits.senses.custom - Special sense information.
 * @property {Set<string>} traits.senses.tags - Sense tags.
 * @property {Record<string, string>} traits.senses.types - Formulas for specific sense types.
 * @property {string} traits.senses.units - Units used to measure senses.
 * @property {object} traits.size - Creature size.
 */
export default class TraitsTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			traits: new SchemaField({
				condition: new SchemaField({
					immunities: new ResistancesField({ nonmagical: false }, { label: "BF.Immunity.Label" }),
					resistances: new ResistancesField({ nonmagical: false }, { label: "BF.Resistance.Label" }),
					vulnerabilities: new ResistancesField({ nonmagical: false }, { label: "BF.Vulnerability.Label" })
				}),
				damage: new SchemaField({
					immunities: new ResistancesField({}, { label: "BF.Immunity.Label" }),
					resistances: new ResistancesField({}, { label: "BF.Resistance.Label" }),
					vulnerabilities: new ResistancesField({}, { label: "BF.Vulnerability.Label" })
				}),
				movement: new SchemaField({
					base: new NumberField({ nullable: false, initial: 30, min: 0, step: 0.1 }),
					custom: new ArrayField(new StringField()),
					tags: new SetField(new StringField()),
					types: new MappingField(new FormulaField({ deterministic: true }), {
						initial: { walk: "@base" }
					}),
					units: new StringField({ initial: "foot" })
				}),
				senses: new SchemaField({
					custom: new ArrayField(new StringField()),
					tags: new SetField(new StringField()),
					types: new MappingField(new FormulaField({ deterministic: true })),
					units: new StringField({ initial: "foot" })
				}),
				size: new StringField({ label: "BF.Size.Label" })
			}, {label: "BF.Trait.Label[other]"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare initial movement values.
	 */
	prepareBaseTraits() {
		this.traits.movement.multiplier ??= "1";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve final movement, senses, and resistances/immunities.
	 * @param {object} rollData
	 */
	prepareDerivedTraits(rollData) {
		const movement = this.traits.movement;
		rollData.base = movement.base;

		// Determine how movement should be changed by status effects
		const noMovement = new Set(["grappled", "paralyzed", "petrified", "restrained", "stunned", "unconscious"])
			.intersection(this.parent.statuses).size || (this.attributes?.exhaustion >= 5);
		const halfMovement = this.parent.statuses.has("prone") || (this.attributes.exhaustion >= 2);
		const multiplier = simplifyBonus(movement.multiplier, rollData);

		const modifierData = {
			type: "movement",
			armored: !!this.attributes?.ac?.equippedArmor,
			shielded: !!this.attributes?.ac?.equippedShield
		};

		// Calculate each special movement type using base speed
		const entries = new Map();
		for ( const [type, formula] of Object.entries(movement.types) ) {
			let speed;
			if ( (this.parent.statuses.has("prone") && (type !== "walk")) || noMovement ) speed = 0;
			else speed = simplifyBonus(formula, rollData);
			if ( speed > 0 ) speed += this.buildBonus(
				this.getModifiers({ ...modifierData, movementType: type }),
				{ deterministic: true, rollData }
			);
			movement.types[type] = speed * multiplier * (halfMovement ? 0.5 : 1);

			const label = CONFIG.BlackFlag.movementTypes.localized[type];
			if ( speed && label ) {
				if ( type === "walk" ) entries.set(type, numberFormat(speed, { unit: movement.units }));
				else entries.set(type, `${label.toLowerCase()} ${numberFormat(speed, { unit: movement.units })}`);
			}
		}

		// Prepare movement labels
		movement.labels = Object.entries(movement.types)
			.filter(([type, speed]) => speed > 0)
			.sort((lhs, rhs) => rhs[1] - lhs[1])
			.map(([type, speed]) => {
				const config = CONFIG.BlackFlag.movementTypes[type];
				const label = config ? game.i18n.localize(config.label) : type;
				return `${label} ${numberFormat(speed, { unit: movement.units })}`;
			});
		movement.labels.push(...movement.custom);
		movement.label = formatTaggedList({
			entries, extras: movement.custom, tags: movement.tags, tagDefinitions: CONFIG.BlackFlag.movementTags
		});

		// Calculate each special sense type
		const senses = this.traits.senses;
		const senseEntries = new Map();
		for ( const [type, formula] of Object.entries(senses.types) ) {
			const range = simplifyBonus(formula, rollData);
			senses.types[type] = range;
			const label = CONFIG.BlackFlag.senses.localized[type];
			if ( range && label ) senseEntries.set(type, `${label} ${numberFormat(range, { unit: senses.units })}`);
		}
		senses.label = formatTaggedList({
			entries: senseEntries, extras: senses.custom, tags: senses.tags, tagDefinitions: CONFIG.BlackFlag.senseTags
		});

		// Adjust resistances & immunities based on status effects
		if ( this.parent.statuses.has("petrified") ) {
			// TODO: Add option to control whether these are applied
			this.traits.condition.immunities.value.add("poisoned");
			this.traits.damage.resistances.value.push("all");
			this.traits.damage.immunities.value.add("poison");
		}

		// Clean up damage resistances, immunities, and vulnerabilities
		// If all damage is set for a section, remove all other types
		// Remove any resistances from non-magical sources that are also in all sources
		["resistances", "immunities", "vulnerabilities"].forEach(k => this.cleanLabelResistances(
			this.traits.condition[k], this.traits.damage[k]
		));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Clean and create labels for resistance, immunity, and vulnerability sets.
	 * @param {ConditionResistanceData} condition - Condition data.
	 * @param {DamageResistanceData} damage - Damage data.
	 */
	cleanLabelResistances(condition, damage) {
		if ( damage.value.has("all") ) {
			damage.value.clear();
			damage.nonmagical.clear();
			damage.value.add("all");
		} else if ( damage.nonmagical.has("all") ) {
			damage.nonmagical.clear();
			damage.nonmagical.add("all");
		} else {
			damage.value.forEach(v => damage.nonmagical.delete(v));
		}

		const makeDamageLabel = (source, formatter) => formatter.format(
			Array.from(source).map(t => t === "all" ?
				game.i18n.localize("BF.Resistance.AllDamage") :
				CONFIG.BlackFlag.damageTypes.localized[t]).filter(t => t)
		);
		const nonmagical = makeDamageLabel(damage.nonmagical, game.i18n.getListFormatter({ style: "long" }));
		damage.label = [
			makeDamageLabel(damage.value, game.i18n.getListFormatter({ type: "unit" })),
			nonmagical ? game.i18n.format("BF.Resistance.Nonmagical", { type: nonmagical }) : null
		].filter(t => t).join("; ");

		condition.label = game.i18n.getListFormatter({ type: "unit" })
			.format(Array.from(condition.value).map(t => CONFIG.BlackFlag.conditions.localized[t]).filter(t => t))
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preCreateSize(data, options, user) {
		if ( !foundry.utils.hasProperty(data, "prototypeToken.width")
			&& !foundry.utils.hasProperty(data, "prototypeToken.height")) {
			const size = CONFIG.BlackFlag.sizes[this.traits.size]?.scale;
			this.parent.updateSource({ "prototypeToken.width": size, "prototypeToken.height": size });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _preUpdateSize(changed, options, user) {
		const newSize = foundry.utils.getProperty(changed, "system.traits.size");
		if ( !newSize || (newSize === this.traits.size) ) return;

		if ( !foundry.utils.hasProperty(changed, "prototypeToken.width")
			&& !foundry.utils.hasProperty(changed, "prototypeToken.height") ) {
			const size = CONFIG.BlackFlag.sizes[newSize]?.scale;
			foundry.utils.setProperty(changed, "prototypeToken.width", size);
			foundry.utils.setProperty(changed, "prototypeToken.height", size);
		}
	}
}

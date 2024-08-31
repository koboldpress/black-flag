import { formatTaggedList, numberFormat, simplifyBonus } from "../../../utils/_module.mjs";
import { FormulaField, MappingField } from "../../fields/_module.mjs";

const { ArrayField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for PC & NPC traits.
 */
export default class TraitsTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			traits: new SchemaField({
				condition: new SchemaField({
					immunities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					}, {label: "BF.Immunity.Label"}),
					resistances: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					}, {label: "BF.Resistance.Label"}),
					vulnerabilities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					}, {label: "BF.Vulnerability.Label"})
				}),
				damage: new SchemaField({
					immunities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField()),
						bypasses: new SetField(new StringField())
					}, {label: "BF.Immunity.Label"}),
					resistances: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField()),
						bypasses: new SetField(new StringField())
					}, {label: "BF.Resistance.Label"}),
					vulnerabilities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					}, {label: "BF.Vulnerability.Label"})
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
					types: new MappingField(new FormulaField({ deterministic: true })),
					tags: new SetField(new StringField()),
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
		this.traits.movement.bonus ??= "";
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

		// Adjust resistances && immunities based on status effects
		if ( this.parent.statuses.has("petrified") ) {
			// TODO: Add option to control whether these are applied
			this.traits.condition.immunities.value.add("poisoned");
			this.traits.damage.resistances.custom.push("All Damage");
			this.traits.damage.immunities.value.add("poison");
		}
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

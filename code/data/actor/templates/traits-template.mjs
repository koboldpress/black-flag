import { convertAmount, defaultUnit, formatDistance, formatTaggedList, simplifyBonus } from "../../../utils/_module.mjs";
import FormulaField from "../../fields/formula-field.mjs";
import MappingField from "../../fields/mapping-field.mjs";

const { ArrayField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for PC & NPC traits.
 *
 * @property {object} traits
 * @property {object} traits.movement
 * @property {number} traits.movement.base - Base movement value made available to specific types as `@base`.
 * @property {string[]} traits.movement.custom - Special movement information.
 * @property {Set<string>} traits.movement.ignoredDifficultTerrain  Types of difficult terrain ignored.
 * @property {Set<string>} traits.movement.tags - Movement tags.
 * @property {Record<string, string>} traits.movement.types - Formulas for specific movement types.
 * @property {string} traits.movement.unit - Units used to measure movement.
 * @property {object} traits.senses
 * @property {string[]} traits.senses.custom - Special sense information.
 * @property {Set<string>} traits.senses.tags - Sense tags.
 * @property {Record<string, string>} traits.senses.types - Formulas for specific sense types.
 * @property {string} traits.senses.unit - Units used to measure senses.
 */
export default class TraitsTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			traits: new SchemaField({
				movement: new SchemaField({
					base: new NumberField({
						nullable: false, initial: 30, min: 0, step: 0.1,
						label: "BF.MOVEMENT.FIELDS.traits.movement.base.label", hint: "BF.MOVEMENT.FIELDS.traits.movement.base.hint"
					}),
					custom: new ArrayField(new StringField()),
					ignoredDifficultTerrain: new SetField(new StringField(), {
						label: "BF.MOVEMENT.FIELDS.traits.movement.ignoredDifficultTerrain.label"
					}),
					multiplier: new FormulaField({ deterministic: true, persisted: false }),
					tags: new SetField(new StringField()),
					types: new MappingField(new FormulaField({ deterministic: true }), {
						initial: { walk: "@base" }
					}),
					unit: new StringField({
						required: true,
						blank: false,
						initial: () => defaultUnit("distance"),
						label: "BF.MOVEMENT.FIELDS.traits.movement.unit.label"
					})
				}),
				senses: new SchemaField({
					custom: new ArrayField(new StringField()),
					tags: new SetField(new StringField()),
					types: new MappingField(new FormulaField({ deterministic: true })),
					unit: new StringField({ required: true, blank: false, initial: () => defaultUnit("distance") })
				})
			}, {label: "BF.Trait.Label[other]"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate movement & senses `units` to `unit`.
	 * Added in 2.0.068
	 * @param {object} source - Candidate source data to migrate.
	 */
	static _migrateMovementSenses(source) {
		this._migrateObjectUnits(source.traits?.movement);
		this._migrateObjectUnits(source.traits?.senses);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Data Shims             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply shims to movement & senses units.
	 */
	_shimMovementSenses() {
		this._shimObjectUnits("traits.movement");
		this._shimObjectUnits("traits.senses");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare initial movement values.
	 */
	prepareBaseTraits() {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve final movement and senses.
	 * @param {object} rollData
	 */
	prepareDerivedTraits(rollData) {
		const movement = this.traits.movement;
		const senses = this.traits.senses;
		rollData.base = movement.base;

		// Determine how movement should be changed by status effects
		const noMovement = this.hasConditionEffect("noMovement");
		const halfMovement = this.hasConditionEffect("halfMovement");
		const multiplier = simplifyBonus(movement.multiplier, rollData);

		const modifierData = {
			type: "movement",
			actor: this,
			armored: !!this.attributes?.ac?.equippedArmor,
			armor: this.attributes?.ac?.equippedArmor?.system,
			shielded: !!this.attributes?.ac?.equippedShield,
			shield: this.attributes?.ac?.equippedShield?.system
		};

		// Calculate each special movement type using base speed & convert to proper measurement system
		for ( const [type, formula] of Object.entries(movement.types) ) {
			let speed;
			if ( (this.parent.statuses.has("prone") && (type !== "walk")) || noMovement ) speed = 0;
			else speed = simplifyBonus(formula, rollData);
			if ( speed > 0 ) speed += this.buildBonus(
				this.getModifiers({ ...modifierData, movementType: type }),
				{ deterministic: true, rollData }
			);
			movement.types[type] = speed * multiplier * (halfMovement ? 0.5 : 1);
		}
		convertAmount(movement, "distance", { valueObjectKey: "types" });

		// Prepare movement labels
		const movementEntries = new Map();
		movement.labels = Object.entries(movement.types)
			.filter(([type, speed]) => speed > 0)
			.sort((lhs, rhs) => rhs[1] - lhs[1])
			.map(([type, speed]) => {
				const label = CONFIG.BlackFlag.movementTypes.localized[type];
				if ( type === "walk" ) movementEntries.set(type, formatDistance(speed, movement.unit));
				else movementEntries.set(type, `${label.toLowerCase()} ${formatDistance(speed, movement.unit)}`);
				return `${label} ${formatDistance(speed, movement.unit)}`;
			});
		movement.labels.push(...movement.custom);
		movement.label = formatTaggedList({
			entries: movementEntries, extras: movement.custom, tags: movement.tags,
			tagDefinitions: CONFIG.BlackFlag.movementTags
		});

		// Calculate each special sense type & convert to proper measurement system
		for ( const [type, formula] of Object.entries(senses.types) ) {
			senses.types[type] = simplifyBonus(formula, rollData);
		}
		convertAmount(senses, "distance", { valueObjectKey: "types" });

		// Prepare senses labels
		const senseEntries = new Map();
		for ( const [type, range] of Object.entries(senses.types) ) {
			const label = CONFIG.BlackFlag.senses.localized[type];
			if ( range && label ) senseEntries.set(type, `${label} ${formatDistance(range, senses.unit)}`);
		}
		senses.label = formatTaggedList({
			entries: senseEntries, extras: senses.custom, tags: senses.tags, tagDefinitions: CONFIG.BlackFlag.senseTags
		});
	}
}

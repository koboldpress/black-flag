import { formatTaggedList, numberFormat, simplifyBonus } from "../../../utils/_module.mjs";
import { FormulaField, MappingField } from "../../fields/_module.mjs";

const { ArrayField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for PC & NPC traits.
 */
export default class TraitsTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			traits: new SchemaField({
				movement: new SchemaField({
					base: new NumberField({
						nullable: false, initial: 30, min: 0, step: 0.1, label: "BF.Speed.Base.Label", hint: "BF.Speed.Base.Hint"
					}),
					types: new MappingField(new FormulaField({deterministic: true}), {
						initial: { walk: "@base" }
					}),
					tags: new SetField(new StringField())
					// TODO: Add alternate units
					// TODO: Overall unit multiplier
				}, {label: "BF.Speed.Label"}),
				senses: new SchemaField({
					types: new MappingField(new FormulaField({deterministic: true})),
					tags: new SetField(new StringField())
				}, {label: "BF.Senses.Label"}),
				size: new StringField({initial: "medium", label: "BF.Size.Label"}),
				condition: new SchemaField({
					resistances: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					}, {label: "BF.Resistance.Label"}),
					immunities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					}, {label: "BF.Immunity.Label"})
				}),
				damage: new SchemaField({
					resistances: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField()),
						bypasses: new SetField(new StringField())
					}, {label: "BF.Resistance.Label"}),
					immunities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField()),
						bypasses: new SetField(new StringField())
					}, {label: "BF.Immunity.Label"}),
					vulnerabilities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					}, {label: "BF.Vulnterability.Label"})
				})
			}, {label: "BF.Trait.Label[other]"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve final movement values and prepare the labels.
	 */
	prepareDerivedMovement() {
		const movement = this.traits.movement;
		const rollData = this.parent.getRollData({ deterministic: true });
		rollData.base = movement.base;

		// Determine how movement should be changed by status effects
		const noMovement = new Set(["grappled", "paralyzed", "petrified", "restrained", "stunned", "unconscious"])
			.intersection(this.parent.statuses).size || (this.attributes?.exhaustion >= 5);
		const halfMovement = this.parent.statuses.has("prone") || (this.attributes.exhaustion >= 2);

		// Calculate each special movement type using base speed
		const entries = [];
		for ( const [type, formula] of Object.entries(movement.types) ) {
			let speed;
			if ( (this.parent.statuses.has("prone") && (type !== "walk")) || noMovement ) speed = 0;
			else speed = simplifyBonus(formula, rollData) * (halfMovement ? 0.5 : 1);
			movement.types[type] = speed;

			const label = CONFIG.BlackFlag.movementTypes.localized[type];
			if ( speed && label ) {
				if ( type === "walk" ) entries.push(numberFormat(speed, { unit: "foot" }));
				else entries.push(`${label.toLowerCase()} ${numberFormat(speed, { unit: "foot" })}`);
			}
		}

		// Prepare movement label to display on character sheet
		movement.labels = Object.entries(movement.types)
			.filter(([type, speed]) => speed > 0)
			.sort((lhs, rhs) => rhs[1] - lhs[1])
			.map(([type, speed]) => {
				const config = CONFIG.BlackFlag.movementTypes[type];
				const label = config ? game.i18n.localize(config.label) : type;
				return `${label} ${numberFormat(speed, { unit: "foot" })}`;
			});

		// Prepare movement label to display on NPC sheet
		movement.label = formatTaggedList({ entries, tags: movement.tags, tagDefinitions: CONFIG.BlackFlag.movementTags });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve sense formulas and prepare the combined label.
	 */
	prepareDerivedSenses() {
		const senses = this.traits.senses;
		const rollData = this.parent.getRollData({ deterministic: true });

		// Calculate each special sense type
		const entries = [];
		for ( const [type, formula] of Object.entries(senses.types) ) {
			const range = simplifyBonus(formula, rollData);
			senses.types[type] = range;
			const label = CONFIG.BlackFlag.senses.localized[type];
			if ( range && label ) entries.push(`${label} ${numberFormat(range, { unit: "foot" })}`);
		}

		senses.label = formatTaggedList({ entries, tags: senses.tags, tagDefinitions: CONFIG.BlackFlag.senseTags });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedResistImmune() {
		if ( this.parent.statuses.has("petrified") ) {
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

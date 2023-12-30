import { numberFormat, simplifyBonus } from "../../../utils/_module.mjs";
import { FormulaField, MappingField } from "../../fields/_module.mjs";

const { ArrayField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for PC & NPC traits.
 */
export default class TraitsTemplate extends foundry.abstract.DataModel {

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
				size: new StringField({label: "BF.Size.Label"}),
				type: new SchemaField({
					value: new StringField(),
					tags: new ArrayField(new StringField())
				}),
				condition: new SchemaField({
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

	prepareDerivedMovement() {
		const movement = this.traits.movement;
		const rollData = this.parent.getRollData({ deterministic: true });
		rollData.base = movement.base;

		// Determine how movement should be changed by status effects
		const noMovement = new Set(["grappled", "paralyzed", "petrified", "restrained", "stunned", "unconscious"])
			.intersection(this.parent.statuses).size || (this.attributes?.exhaustion >= 5);
		const halfMovement = this.parent.statuses.has("prone") || (this.attributes.exhaustion >= 2);

		// Calculate each special movement type using base speed
		for ( const [type, formula] of Object.entries(movement.types) ) {
			if ( (this.parent.statuses.has("prone") && (type !== "walk")) || noMovement ) movement.types[type] = 0;
			else {
				const speed = simplifyBonus(formula, rollData);
				movement.types[type] = halfMovement ? speed * 0.5 : speed;
			}
		}

		// Prepare movement label to display on sheet
		const labels = Object.entries(movement.types)
			.filter(([type, speed]) => speed > 0)
			.sort((lhs, rhs) => rhs[1] - lhs[1])
			.map(([type, speed]) => {
				const config = CONFIG.BlackFlag.movementTypes[type];
				const label = config ? game.i18n.localize(config.label) : type;
				return `${label} ${numberFormat(speed, { unit: "foot" })}`;
			});
		movement.labels ??= {
			primary: labels.shift(),
			secondary: game.i18n.getListFormatter({ type: "unit" }).format(labels)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedSenses() {
		const senses = this.traits.senses;
		const rollData = this.parent.getRollData({ deterministic: true });

		// Calculate each special sense type
		for ( const [type, formula] of Object.entries(senses.types) ) {
			const speed = simplifyBonus(formula, rollData);
			senses.types[type] = speed;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedResistImmune() {
		if ( this.parent.statuses.has("petrified") ) {
			this.traits.condition.immunities.value.add("poisoned");
			this.traits.damage.resistances.custom.push("All Damage");
			this.traits.damage.immunities.value.add("poison");
		}
	}
}

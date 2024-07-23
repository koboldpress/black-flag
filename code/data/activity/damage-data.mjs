import DamageField from "../fields/damage-field.mjs";

const { ArrayField, BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the damage activity.
 *
 * @property {string} ability - Ability that can be added to damage using `@mod`.
 * @property {object} damage
 * @property {boolean} damage.allowCritical - Can critical damage be rolled?
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
 */
export class DamageData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField(),
			damage: new SchemaField(
				{
					allowCritical: new BooleanField(),
					parts: new ArrayField(new DamageField())
				},
				{ label: "BF.Damage.Label" }
			)
		};
	}
}

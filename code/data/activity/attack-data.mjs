import { buildRoll, simplifyBonus } from "../../utils/_module.mjs";
import DamageField from "../fields/damage-field.mjs";
import FormulaField from "../fields/formula-field.mjs";

const { ArrayField, BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the attack activity.
 */
export class AttackData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			type: new SchemaField({
				value: new StringField({ label: "BF.Weapon.Type.Label" }),
				classification: new StringField({ label: "BF.Attack.Classification.Label" })
			}),
			ability: new StringField(),
			attack: new SchemaField({
				bonus: new FormulaField({ label: "BF.Activity.Attack.Bonus.Label" }),
				flat: new BooleanField({ label: "BF.Activity.Attack.Flat.Label", hint: "BF.Activity.Attack.Flat.Hint" })
			}),
			damage: new SchemaField(
				{
					includeBaseDamage: new BooleanField({
						initial: true,
						label: "BF.Activity.Attack.IncludeBaseDamage.Label",
						hint: "BF.Activity.Attack.IncludeBaseDamage.Hint"
					}),
					parts: new ArrayField(new DamageField())
					// TODO: Add conditions support to damage parts
				},
				{ label: "BF.Damage.Label" }
			)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return a string describing the result if the default ability is selected for this activity.
	 * @type {string|null}
	 */
	get defaultAbility() {
		if (this.type.classification === "spell") return game.i18n.localize("BF.Spellcasting.Label");

		const item = this.parent.item.system;
		const labels = CONFIG.BlackFlag.abilities.localized;
		const itemType = ["melee", "ranged"].includes(item.type?.value);
		if (this.type.classification === "weapon" && (this._source.type.value || !itemType)) {
			if (this.type.value === "melee") return labels[CONFIG.BlackFlag.defaultAbilities.meleeAttack];
			if (this.type.value === "ranged") return labels[CONFIG.BlackFlag.defaultAbilities.rangedAttack];
		}

		const available = item.availableAbilities;
		if (available?.size)
			return Array.from(available)
				.map(a => labels[a])
				.join("/");

		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		const item = this.parent.item.system ?? {};
		const propertiesToSet = ["type.value", "type.classification"];
		for (const keyPath of propertiesToSet) {
			const activityProperty = foundry.utils.getProperty(this, keyPath);
			const itemProperty = foundry.utils.getProperty(item, keyPath);
			if (!activityProperty && itemProperty) foundry.utils.setProperty(this, keyPath, itemProperty);
		}
		this.type.value ??= "melee";
		this.type.classification ??= "weapon";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		const ability = this.parent.actor?.system.abilities[this.parent.attackAbility];
		const rollData = this.parent.item.getRollData({ deterministic: true });
		const { parts, data } = buildRoll(
			{
				mod: ability?.mod,
				prof: this.parent.item.system.proficiency?.flat,
				bonus: this.parent.actor?.system.buildBonus(this.parent.actor?.system.getModifiers(this.parent.modifierData), {
					rollData
				})
			},
			rollData
		);
		Object.defineProperty(this, "toHit", {
			value: simplifyBonus(parts.join(" + "), data),
			configurable: true,
			enumerable: false
		});
	}
}

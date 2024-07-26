import { buildRoll, simplifyBonus } from "../../utils/_module.mjs";
import DamageField from "../fields/damage-field.mjs";
import FormulaField from "../fields/formula-field.mjs";
import BaseActivity from "./base-activity.mjs";

const { ArrayField, BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the attack activity.
 *
 * @property {object} type
 * @property {string} type.value - Is this a melee or ranged attack?
 * @property {string} type.classification - Is this a weapon or spell attack?
 * @property {string} ability - Ability used with the attack if not automatically calculated.
 * @property {object} attack
 * @property {string} attack.bonus - Bonus added to the attack to hit.
 * @property {boolean} attack.flat - Should only the bonus be used for calculating to hit?
 * @property {object} damage
 * @property {boolean} damage.includeBaseDamage - Should a item's base damage be included with any other damage parts?
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
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
	 * Proficiency to include with the attack roll.
	 * @type {Proficiency|null}
	 */
	get attackProficiency() {
		const ability = this.parent.actor?.system.abilities?.[this.parent.attackAbility];
		if (ability?.proficient === true) return null;
		return this.parent.item.system.proficiency?.hasProficiency ? this.parent.item.system.proficiency ?? null : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Abilities that could potentially be used with this attack.
	 * @type {Set<string>}
	 */
	get availableAbilities() {
		if (this.parent.item.system.availableAbilities) return this.parent.item.system.availableAbilities;
		if (this.type.classification === "spell")
			return new Set(
				[
					this.parent.actor?.system.spellcasting?.ability,
					...Object.values(this.parent.actor?.system.spellcasting?.origins ?? {}).map(o => o.ability)
				].filter(a => a)
			);

		const melee = CONFIG.BlackFlag.defaultAbilities.meleeAttack;
		const ranged = CONFIG.BlackFlag.defaultAbilities.rangedAttack;
		if (this.parent.actor?.type === "npc") return new Set([melee, ranged]);
		return new Set([this.type.value === "ranged" ? ranged : melee]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return a string describing the result if the default ability is selected for this activity.
	 * @type {string|null}
	 */
	get defaultAbility() {
		if (this.type.classification === "spell") return game.i18n.localize("BF.Spellcasting.Label");

		const labels = CONFIG.BlackFlag.abilities.localized;
		const available = this.availableAbilities;
		if (available?.size)
			return Array.from(available)
				.map(a => labels[a])
				.join("/");

		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if (foundry.utils.getType(source.damage?.parts) === "Array") {
			source.damage.parts.forEach(p => BaseActivity._migrateCustomDamageFormula(p));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		this.parent.setProperty("system.type.value", "system.type.value");
		this.parent.setProperty("system.type.classification", "system.type.classification");
		this.type.value ??= "melee";
		this.type.classification ??= "weapon";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		const ability = this.parent.actor?.system.abilities?.[this.parent.attackAbility];
		const rollData = this.parent.item.getRollData({ deterministic: true });
		const { parts, data } = buildRoll(
			{
				mod: ability?.mod,
				prof: this.attackProficiency?.flat,
				bonus: this.parent.actor?.system.buildBonus?.(
					this.parent.actor?.system.getModifiers?.(this.parent.modifierData),
					{ rollData }
				),
				magic: this.parent.item.system.attackMagicalBonus
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

import DamageField from "../fields/damage-field.mjs";
import FormulaField from "../fields/formula-field.mjs";
import BaseActivity from "./base-activity.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the attack activity.
 *
 * @property {object} attack
 * @property {string} attack.ability - Ability used with the attack if not automatically calculated.
 * @property {string} attack.bonus - Bonus added to the attack to hit.
 * @property {object} attack.critical
 * @property {number} attack.critical.threshold - Minimum value on the challenge die to roll a critical hit.
 * @property {boolean} attack.flat - Should only the bonus be used for calculating to hit?
 * @property {object} attack.type
 * @property {string} attack.type.value - Is this a melee or ranged attack?
 * @property {string} attack.type.classification - Is this a weapon or spell attack?
 * @property {object} damage
 * @property {object} damage.critical
 * @property {string} damage.critical.bonus - Extra damage applied when a critical is rolled, added to the base damage
 *                                            or the first damage part.
 * @property {boolean} damage.includeBase - Should a item's base damage be included with any other damage parts?
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 */
export class AttackData extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.DAMAGE", "BF.ATTACK"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			attack: new SchemaField({
				ability: new StringField(),
				bonus: new FormulaField(),
				critical: new SchemaField({
					threshold: new NumberField()
				}),
				flat: new BooleanField(),
				type: new SchemaField({
					value: new StringField(),
					classification: new StringField()
				})
			}),
			damage: new SchemaField({
				critical: new SchemaField({
					bonus: new FormulaField()
				}),
				includeBase: new BooleanField({ initial: true }),
				parts: new ArrayField(new DamageField())
				// TODO: Add conditions support to damage parts
			}),
			effects: new ArrayField(new AppliedEffectField())
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
		const ability = this.parent.actor?.system.abilities?.[this.parent.ability];
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
		if (this.attack.type.classification === "spell")
			return new Set(
				[
					this.parent.actor?.system.spellcasting?.ability,
					...Object.values(this.parent.actor?.system.spellcasting?.origins ?? {}).map(o => o.ability)
				].filter(a => a)
			);

		const melee = CONFIG.BlackFlag.defaultAbilities.meleeAttack;
		const ranged = CONFIG.BlackFlag.defaultAbilities.rangedAttack;
		if (this.parent.actor?.type === "npc") return new Set([melee, ranged]);
		return new Set([this.attack.type.value === "ranged" ? ranged : melee]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return a string describing the result if the default ability is selected for this activity.
	 * @type {string|null}
	 */
	get defaultAbility() {
		if (this.attack.type.classification === "spell") return game.i18n.localize("BF.Spellcasting.Label");

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
		// Added in ???
		if (foundry.utils.getType(source.damage?.parts) === "Array") {
			source.damage.parts.forEach(p => BaseActivity._migrateCustomDamageFormula(p));
		}
		// Added in 0.10.042
		if ("ability" in source) foundry.utils.setProperty(source, "attack.ability", source.ability);
		if ("type" in source) {
			if ("value" in source.type) foundry.utils.setProperty(source, "attack.type.value", source.type.value);
			if ("classification" in source.type) {
				foundry.utils.setProperty(source, "attack.type.classification", source.type.classification);
			}
		}
		if ("damage" in source) {
			if ("includeBaseDamage" in source.damage) {
				foundry.utils.setProperty(source, "damage.includeBase", source.damage.includeBaseDamage);
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		this.applyShims();
		this.parent.setProperty("system.attack.type.value", "system.type.value");
		this.parent.setProperty("system.attack.type.classification", "system.type.classification");
		this.attack.type.value ??= "melee";
		this.attack.type.classification ??= "weapon";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		if (this.damage.includeBase && this.parent.item.system.damage?.base?.formula) {
			const basePart = this.parent.item.system.damage.base.clone();
			basePart.base = true;
			basePart.locked = true;
			this.damage.parts.unshift(basePart);
		}

		Object.defineProperty(this, "toHit", {
			value: this.parent.getAttackDetails().formula,
			configurable: true,
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Shims                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add shims for removed properties.
	 */
	applyShims() {
		Object.defineProperty(this, "ability", {
			get() {
				foundry.utils.logCompatibilityWarning(
					"The `ability` property on `AttackData` has been moved to `attack.ability`",
					{ since: "Black Flag 0.10.042", until: "Black Flag 0.10.047" }
				);
				return this.attack.ability;
			},
			configurable: true
		});
		Object.defineProperty(this, "type", {
			get() {
				foundry.utils.logCompatibilityWarning("The `type` properties on `AttackData` has been moved to `attack.type`", {
					since: "Black Flag 0.10.042",
					until: "Black Flag 0.10.047"
				});
				return this.attack.type;
			},
			configurable: true
		});
		Object.defineProperty(this.damage, "includeBaseDamage", {
			get() {
				foundry.utils.logCompatibilityWarning(
					"The `damage.includeBaseDamage` property on `AttackData` has been moved to `damage.includeBase`",
					{ since: "Black Flag 0.10.042", until: "Black Flag 0.10.047" }
				);
				return this.damage.includeBase;
			},
			configurable: true
		});
	}
}

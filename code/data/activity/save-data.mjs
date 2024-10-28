import { simplifyBonus } from "../../utils/_module.mjs";
import ActivityDataModel from "../abstract/activity-data-model.mjs";
import { DamageField, FormulaField } from "../fields/_module.mjs";
import BaseActivity from "./base-activity.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the save activity.
 *
 * @property {object} damage
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 * @property {object} save
 * @property {string} save.ability - Abilities required when rolling a saving throw.
 * @property {object} save.dc
 * @property {string} save.dc.ability - Ability used to calculate the DC if not automatically calculated.
 * @property {string} save.dc.formula - DC formula if manually set.
 */
export class SaveData extends ActivityDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.SAVE", "BF.DAMAGE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			damage: new SchemaField({ parts: new ArrayField(new DamageField()) }),
			effects: new ArrayField(new AppliedEffectField()),
			save: new SchemaField({
				ability: new SetField(new StringField()),
				dc: new SchemaField({
					ability: new StringField(),
					formula: new FormulaField({ deterministic: true })
				})
			})
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
		if (this.isSpell) return game.i18n.localize("BF.Spellcasting.Label");
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

		// Added in 0.10.046
		if (!("save" in source)) {
			if ("ability" in source) foundry.utils.setProperty(source, "save.ability", source.ability);
			if ("dc" in source) {
				if ("value" in source.dc) foundry.utils.setProperty(source, "save.dc.ability", source.dc.ability);
				if ("formula" in source.dc) foundry.utils.setProperty(source, "save.dc.formula", source.dc.formula);
			}
		}

		// Added in 0.10.049
		if (foundry.utils.getType(source.save?.ability) === "string") {
			if (source.save.ability) source.save.ability = [source.save.ability];
			else source.save.ability = [];
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		this.applyShims();
		if (!this.isSpell && !this.save.dc.ability) this.save.dc.ability = "custom";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		const rollData = this.getRollData({ deterministic: true });
		if (this.save.dc.ability === "custom") this.save.dc.final = simplifyBonus(this.save.dc.formula, rollData);
		else if (this.actor?.system.spellcasting?.dc && !this.save.dc.ability) {
			if (this.isSpell && this.item.system.associatedClass) {
				this.save.dc.final = this.actor.system.spellcasting.origins[this.item.system.associatedClass.identifier]?.dc;
			} else {
				this.save.dc.final = this.actor.system.spellcasting.dc;
			}
		} else this.save.dc.final = rollData.abilities?.[this.parent.dcAbility]?.dc;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Shims                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add shims for removed properties.
	 */
	applyShims() {
		Object.defineProperty(this, "dc", {
			get() {
				foundry.utils.logCompatibilityWarning("The `dc` properties on `SaveData` has been moved to `save.dc`", {
					since: "Black Flag 0.10.046",
					until: "Black Flag 0.10.051"
				});
				return this.save.dc;
			},
			configurable: true
		});
	}
}

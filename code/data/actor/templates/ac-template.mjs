import { FormulaField } from "../../fields/_module.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for armor class.
 */
export default class ACTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			attributes: new SchemaField({
				ac: new SchemaField({
					baseFormulas: new SetField(new StringField(), {
						initial: ["unarmored", "armored"]
					}, { label: "BF.ArmorClass.Formula.DefaultLabel[other]" }),
					customLabel: new StringField({label: "BF.ArmorClass.CustomLabel"}),
					formulas: new ArrayField(new SchemaField({
						label: new StringField(),
						formula: new FormulaField({deterministic: true}),
						armored: new BooleanField({nullable: true, initial: null}),
						shielded: new BooleanField({nullable: true, initial: null})
					}), { label: "BF.ArmorClass.Formula.Label[other]" }),
					flat: new NumberField({
						min: 0, integer: true, label: "BF.ArmorClass.Flat.Label", hint: "BF.ArmorClass.Flat.Hint"
					}),
					override: new NumberField({
						min: 0, integer: true, label: "BF.ArmorClass.Override.Label", hint: "BF.ArmorClass.Override.Hint"
					})
				}, {label: "BF.ArmorClass.Label"})
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseArmorFormulas() {
		const ac = this.attributes.ac;
		for ( const baseFormula of ac.baseFormulas ) {
			const data = CONFIG.BlackFlag.armorFormulas[baseFormula];
			if ( data ) ac.formulas.push(foundry.utils.mergeObject(data, {
				id: baseFormula
			}, {inplace: false}));
		}
		ac.cover = 0;
		Object.defineProperty(ac, "defaultLabel", {
			get() {
				const label = [];
				if ( this.currentFormula?.id === "armored" ) label.push(this.equippedArmor.name);
				else if ( this.currentFormula?.label ) label.push(game.i18n.localize(this.currentFormula.label));
				if ( this.equippedShield ) label.push(this.equippedShield.name);
				return game.i18n.getListFormatter({ style: "short", type: "unit" }).format(label);
			},
			configurable: true
		});
		Object.defineProperty(ac, "label", {
			get() {
				return this.customLabel || this.defaultLabel;
			},
			configurable: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate final AC values. Must be called after ability modifiers are prepared.
	 */
	computeArmorClass() {
		const ac = this.attributes.ac;

		// If armor is equipped, prepare clamped abilities
		ac.clamped = Object.entries(this.abilities).reduce((obj, [k, v]) => {
			obj[k] = Math.clamp(
				v.mod,
				ac.equippedArmor?.system.modifier.min ?? -Infinity,
				ac.equippedArmor?.system.modifier.max ?? Infinity
			);
			return obj;
		}, {});

		ac.armor = ac.equippedArmor?.system.armor.value ?? 0;
		ac.flat ??= 10;

		const rollData = this.parent.getRollData({deterministic: true});
		rollData.attributes.ac = ac;
		const acData = { type: "armor-class", armored: !!ac.equippedArmor, shielded: !!ac.equippedShield };

		// Filter formulas to only ones that match current armor settings
		const validFormulas = ac.formulas.filter(formula => {
			if ( (typeof formula.armored === "boolean") && (formula.armored !== !!acData.armored) ) return false;
			if ( (typeof formula.shielded === "boolean") && (formula.shielded !== !!acData.shielded) ) return false;
			return true;
		});

		// Iterate of all armor class formulas, calculating their final values
		ac.base = -Infinity;
		for ( const [index, config] of validFormulas.entries() ) {
			try {
				const replaced = Roll.replaceFormulaData(config.formula, rollData);
				const result = Roll.safeEval(replaced);
				if ( result > ac.base ) {
					ac.base = result;
					ac.currentFormula = config;
				}
			} catch(error) {
				this.parent.notifications.set(`ac-formula-error-${index}`, {
					level: "error", category: "armor-class", section: "main",
					message: game.i18n.format("BF.ArmorClass.Formula.Error", {formula: config.formula, error: error.message})
				});
			}
		}
		if ( !Number.isFinite(ac.base) ) {
			ac.base = ac.flat;
			ac.currentFormula = null;
		}

		ac.shield = ac.equippedShield?.system.armor.value ?? 0;

		ac.modifiers = this.getModifiers(acData);
		ac.bonus = this.buildBonus(ac.modifiers, { deterministic: true, rollData });

		if ( ac.override ) ac.value = ac.override;
		else ac.value = ac.base + ac.shield + ac.bonus + ac.cover;
	}
}

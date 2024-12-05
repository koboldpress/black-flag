import ResistancesField from "../fields/resistances-field.mjs";

const { SchemaField } = foundry.data.fields;

/**
 * @typedef {object} ConditionResistanceData
 * @property {Set<string>} value - Resistances regardless of source.
 * @property {Set<string>} nonmagical - Resistances to non-magical sources.
 * @property {string[]} custom - Special resistance information.
 */

/**
 * @typedef {ConditionResistanceData} DamageResistanceData
 * @property {Set<string>} nonmagical - Resistances to non-magical sources.
 */

/**
 * Data definition template for condition & damage resistances, immunities, and vulnerabilities.
 *
 * @property {object} traits
 * @property {object} traits.condition
 * @property {ConditionResistanceData} traits.condition.immunities - Condition immunities.
 * @property {ConditionResistanceData} traits.condition.resistances - Condition resistances.
 * @property {ConditionResistanceData} traits.condition.vulnerabilities - Condition vulnerabilities.
 * @property {object} traits.damage
 * @property {DamageResistanceData} traits.damage.immunities - Damage immunities.
 * @property {DamageResistanceData} traits.damage.resistances - Damage resistances.
 * @property {DamageResistanceData} traits.damage.vulnerabilities - Damage vulnerabilities.
 */
export default class ResistancesTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			traits: new SchemaField({
				condition: new SchemaField({
					immunities: new ResistancesField({ nonmagical: false }, { label: "BF.Immunity.Label" }),
					resistances: new ResistancesField({ nonmagical: false }, { label: "BF.Resistance.Label" }),
					vulnerabilities: new ResistancesField({ nonmagical: false }, { label: "BF.Vulnerability.Label" })
				}),
				damage: new SchemaField({
					immunities: new ResistancesField({}, { label: "BF.Immunity.Label" }),
					resistances: new ResistancesField({}, { label: "BF.Resistance.Label" }),
					vulnerabilities: new ResistancesField({}, { label: "BF.Vulnerability.Label" })
				})
			}, { label: "BF.Trait.Label[other]" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve final movement, senses, and resistances/immunities.
	 * @param {object} rollData
	 */
	prepareDerivedResistances(rollData) {
		// Adjust resistances & immunities based on status effects
		if ( this.hasConditionEffect("petrification") ) {
			this.traits.condition.immunities.value.add("poisoned");
			this.traits.damage.resistances.value.push("all");
			this.traits.damage.immunities.value.add("poison");
		}

		// Clean up damage resistances, immunities, and vulnerabilities
		// If all damage is set for a section, remove all other types
		// Remove any resistances from non-magical sources that are also in all sources
		["resistances", "immunities", "vulnerabilities"].forEach(k => this.cleanLabelResistances(
			this.traits.condition[k], this.traits.damage[k]
		));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Clean and create labels for resistance, immunity, and vulnerability sets.
	 * @param {ConditionResistanceData} condition - Condition data.
	 * @param {DamageResistanceData} damage - Damage data.
	 */
	cleanLabelResistances(condition, damage) {
		if ( damage.value.has("all") ) {
			damage.value.clear();
			damage.nonmagical.clear();
			damage.value.add("all");
		} else if ( damage.nonmagical.has("all") ) {
			damage.nonmagical.clear();
			damage.nonmagical.add("all");
		} else {
			damage.value.forEach(v => damage.nonmagical.delete(v));
		}

		const makeDamageLabel = (source, formatter) => formatter.format(
			Array.from(source).map(t => t === "all" ?
				game.i18n.localize("BF.Resistance.AllDamage") :
				CONFIG.BlackFlag.damageTypes.localized[t]).filter(t => t)
		);
		const nonmagical = makeDamageLabel(damage.nonmagical, game.i18n.getListFormatter({ style: "long" }));
		damage.label = [
			makeDamageLabel(damage.value, game.i18n.getListFormatter({ type: "unit" })),
			nonmagical ? game.i18n.format("BF.Resistance.Nonmagical", { type: nonmagical }) : null
		].filter(t => t).join("; ");

		condition.label = game.i18n.getListFormatter({ type: "unit" })
			.format(Array.from(condition.value).map(t => CONFIG.BlackFlag.conditions.localized[t]).filter(t => t))
	}
}

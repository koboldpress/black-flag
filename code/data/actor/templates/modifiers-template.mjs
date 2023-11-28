import { filter, simplifyBonus } from "../../../utils/_module.mjs";
import ModifierField from "../../fields/modifier-field.mjs";

/**
 * Template for actors with modifiers including a number of helper methods.
 */
export default class ModifiersTemplate extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			modifiers: new ModifierField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseModifiers() {
		this.modifiers.forEach(modifier => Object.defineProperty(modifier, "source", {
			value: "manual",
			enumerable: true,
			writable: false
		}));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedModifiers() {
		this.modifiers.forEach((modifier, index) => Object.defineProperty(modifier, "index", {
			value: index,
			enumerable: false,
			writable: false
		}));
		// TODO: Attribute each non-manual modifier to a source (e.g. effect or advancement)
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a bonus formula or value from the provided modifiers.
	 * @param {object[]} modifiers - Modifiers from which to build the bonus.
	 * @param {object} [options={}]
	 * @param {boolean} [options.deterministic=false] - Should only deterministic modifiers be included?
	 * @param {object} [options.rollData={}] - Roll data to use when simplifying.
	 * @returns {string|number}
	 */
	buildBonus(modifiers, { deterministic=false, rollData={} }={}) {
		if ( deterministic ) return modifiers.reduce((t, m) => t + simplifyBonus(m.formula, rollData), 0);
		return modifiers.filter(m => m.formula).map(m => m.formula).join(" + ");
		// TODO: Should formula data be replaced?
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a minimum roll value from the provided modifiers.
	 * @param {object[]} modifiers - Modifiers from which to build the minimum.
	 * @param {object} [options={}]
	 * @param {object} [options.rollData={}] - Roll data to use when simplifying.
	 * @returns {number|null}
	 */
	buildMinimum(modifiers, { rollData={} }={}) {
		const minimum = modifiers.reduce((min, mod) => {
			const value = simplifyBonus(mod.formula, rollData);
			return value > min ? value : min;
		}, -Infinity);
		return Number.isFinite(minimum) ? minimum : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Modifiers              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add a new modifier.
	 * @param {object} data
	 */
	async addModifier(data) {
		const modifierCollection = this.toObject().modifiers;
		modifierCollection.push(data);
		await this.parent.update({"system.modifiers": modifierCollection});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Delete a modifier.
	 * @param {number} index
	 */
	async deleteModifier(index) {
		const modifierCollection = this.toObject().modifiers;
		modifierCollection.splice(index, 1);
		await this.parent.update({"system.modifiers": modifierCollection});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get a list of modifiers that match the provided data.
	 * @param {object|object[]} data - Description of modifiers to find.
	 * @param {string} [type="bonus"] - Modifier type to find.
	 * @returns {object[]}
	 */
	getModifiers(data, type="bonus") {
		if ( foundry.utils.getType(data) !== "Array" ) data = [data];
		return this.modifiers.filter(modifier => {
			if ( modifier.type !== type ) return false;
			return data.some(d => filter.performCheck(d, modifier.filter));
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update a modifier.
	 * @param {number} index
	 * @param {object} updates
	 * @param {DocumentModificationContext} options
	 */
	async updateModifier(index, updates, options) {
		const modifierCollection = this.toObject().modifiers;
		foundry.utils.mergeObject(modifierCollection[index], updates);
		await this.parent.update({"system.modifiers": modifierCollection}, options);
	}
}

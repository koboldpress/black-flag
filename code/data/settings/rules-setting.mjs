const { BooleanField } = foundry.data.fields;

/**
 * A data model that contains various optional rules that can be enabled.
 */
export default class RulesSetting extends foundry.abstract.DataModel {
	/** @override */
	static defineSchema() {
		return {
			firearms: new BooleanField({ label: "BF.Settings.Rules.Firearms.Label", hint: "BF.Settings.Rules.Firearms.Hint" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mapping of rules and the modules that require them.
	 * @type {Map<string, Package[]>}
	 */
	static #requiredRules = new Map();

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Rules that are required.
	 * @type {Record<string, boolean>}
	 */
	get required() {
		return Object.fromEntries(Object.keys(this.schema.fields).map(k => [k, !!RulesSetting.#requiredRules.get(k)]));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Register a rule as required by a package.
	 * @param {string} rule - Name of required rule.
	 * @param {Module|System|World} manifest - Manifest of the package requiring the rule.
	 */
	static addRequiredRule(rule, manifest) {
		if (!RulesSetting.#requiredRules.has(rule)) RulesSetting.#requiredRules.set(rule, []);
		RulesSetting.#requiredRules.get(rule).push(manifest);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of package names that require a certain rule.
	 * @param {string} rule - Name of required rule.
	 * @returns {string[]|void}
	 */
	requiredSources(rule) {
		return RulesSetting.#requiredRules.get(rule)?.map(p => p.title);
	}
}

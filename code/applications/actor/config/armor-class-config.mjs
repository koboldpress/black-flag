import { filteredKeys } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

export default class ArmorClassConfig extends BaseConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "armor-class"],
			template: "systems/black-flag/templates/actor/config/armor-class-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n.localize("BF.ArmorClass.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.armorFormulas = Object.entries(CONFIG.BlackFlag.armorFormulas).map(([id, config]) => ({
			id, ...config, checked: this.document.system.attributes.ac.baseFormulas.has(id)
		}));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareModifiers() {
		return [
			{
				category: "armor-class", type: "bonus", label: "BF.ArmorClass.Label",
				modifiers: this.getModifiers([{k: "type", v: "armor-class"}], [], f => f.type === "bonus")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: "armor-class" }] };
		return data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		const data = foundry.utils.expandObject(formData);

		if ( data.formulas ) {
			data["system.attributes.ac.baseFormulas"] = filteredKeys(data.formulas);
			delete data.formulas;
			formData = foundry.utils.flattenObject(data);
		}
		super._updateObject(event, formData);
	}
}

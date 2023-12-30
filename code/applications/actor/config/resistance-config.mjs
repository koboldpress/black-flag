import { filteredKeys } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

export default class ResistanceConfig extends BaseConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "resistance"],
			template: "systems/black-flag/templates/actor/config/resistance-config.hbs",
			width: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n.localize("");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		const traits = this.document.system.traits;
		context.damageTypes = Object.entries(CONFIG.BlackFlag.damageTypes.localized).reduce((obj, [key, label]) => {
			obj[key] = {
				label,
				resistant: traits.damage.resistances.value.has(key),
				immune: traits.damage.immunities.value.has(key),
				vulnerable: traits.damage.vulnerabilities.value.has(key)
			};
			return obj;
		}, {});
		context.conditions = Object.entries(CONFIG.BlackFlag.conditions.localized).reduce((obj, [key, label]) => {
			obj[key] = {
				label,
				immune: traits.condition.immunities.value.has(key)
			};
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);
		foundry.utils.setProperty(updates, "condition.immunities.value", filteredKeys(updates.ci.value));
		foundry.utils.setProperty(updates, "damage.resistances.value", filteredKeys(updates.dr.value));
		foundry.utils.setProperty(updates, "damage.immunities.value", filteredKeys(updates.di.value));
		foundry.utils.setProperty(updates, "damage.vulnerabilities.value", filteredKeys(updates.dv.value));
		delete updates.ci;
		delete updates.dr;
		delete updates.di;
		delete updates.dv;
		this.document.update({ "system.traits": updates });
	}
}

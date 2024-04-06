import { filteredKeys } from "../../utils/object.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for sizes.
 */
export default class SizeConfig extends AdvancementConfig {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "size"],
			template: "systems/black-flag/templates/advancement/size-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.sizes = Object.entries(CONFIG.BlackFlag.sizes).reduce((obj, [key, config]) => {
			obj[key] = {
				label: config.label,
				selected: this.advancement.configuration.options.has(key)
			};
			return obj;
		}, {});
		context.showLevelSelector = false;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareConfigurationUpdate(configuration) {
		configuration.options = filteredKeys(configuration.options);
		return configuration;
	}
}

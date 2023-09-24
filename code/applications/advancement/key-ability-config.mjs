import { filteredKeys } from "../../utils/object.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for key ability.
 */
export default class KeyAbilityConfig extends AdvancementConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "key-ability"],
			template: "systems/black-flag/templates/advancement/key-ability-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.abilities = Object.entries(CONFIG.BlackFlag.abilities).reduce((obj, [key, config]) => {
			obj[key] = {
				label: config.labels.full,
				keySelected: this.advancement.configuration.options.has(key),
				secondarySelected: this.advancement.configuration.secondary === key
			};
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareConfigurationUpdate(configuration) {
		configuration.options = filteredKeys(configuration.options);
		return configuration;
	}
}

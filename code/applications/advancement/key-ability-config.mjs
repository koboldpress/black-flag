import { filteredKeys } from "../../utils/object.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for key ability.
 */
export default class KeyAbilityConfig extends AdvancementConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "key-ability"],
			template: "systems/black-flag/templates/advancement/key-ability-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options) {
		const context = super.getData(options);
		context.abilities = Object.entries(CONFIG.BlackFlag.abilities).reduce((obj, [key, config]) => {
			obj[key] = {
				label: config.labels.full,
				keySelected: this.advancement.configuration.options.has(key)
			};
			return obj;
		}, {});
		context.showClassRestriction = false;
		context.showLevelSelector = false;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareConfigurationUpdate(configuration) {
		configuration.options = filteredKeys(configuration.options);
		return configuration;
	}
}

import { filteredKeys } from "../../utils/object.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for sizes.
 */
export default class SizeConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["size", "form-list"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		size: {
			template: "systems/black-flag/templates/advancement/size-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
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
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareConfigurationUpdate(configuration) {
		configuration.options = filteredKeys(configuration.options);
		return configuration;
	}
}

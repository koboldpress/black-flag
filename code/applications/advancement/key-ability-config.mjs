import { filteredKeys } from "../../utils/object.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for key ability.
 */
export default class KeyAbilityConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["key-ability", "form-list"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		keyAbility: {
			template: "systems/black-flag/templates/advancement/key-ability-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
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
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareConfigurationUpdate(configuration) {
		configuration.options = filteredKeys(configuration.options);
		return configuration;
	}
}

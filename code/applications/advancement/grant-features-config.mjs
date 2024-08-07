import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for feature grants.
 */
export default class GrantFeaturesConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grant-features", "form-list"],
		dropKeyPath: "pool",
		position: {
			width: 420
		}
	};

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		items: {
			template: "systems/black-flag/templates/advancement/grant-features-config-items.hbs",
			templates: ["systems/black-flag/templates/advancement/parts/features-list.hbs"]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Drag & Drop            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_validateDroppedItem(event, item) {
		super._validateDroppedItem(event, item);
		this.advancement._validateItemType(item);
	}
}

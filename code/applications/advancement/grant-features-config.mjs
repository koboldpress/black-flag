import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for feature grants.
 */
export default class GrantFeaturesConfig extends AdvancementConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "grant-features"],
			dragDrop: [{ dropSelector: ".drop-target" }],
			dropKeyPath: "pool",
			template: "systems/black-flag/templates/advancement/grant-features-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_validateDroppedItem(event, item) {
		super._validateDroppedItem(event, item);
		this.advancement._validateItemType(item);
	}
}

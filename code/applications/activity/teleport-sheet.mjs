import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Teleport activities.
 */
export default class TeleportSheet extends ActivitySheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["teleport-activity"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/teleport-effect.hbs",
			templates: ["systems/black-flag/templates/activity/parts/teleport-settings.hbs"]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getTabs() {
		const tabs = super._getTabs();
		tabs.effect.label = "BF.TELEPORT.SECTIONS.Teleport";
		tabs.effect.icon = "fa-solid fa-person-walking-dashed-line-arrow-right";
		return tabs;
	}
}

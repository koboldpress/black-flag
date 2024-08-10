import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Utility activities.
 */
export default class UtilitySheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["utility-activity"]
	};

	/* -------------------------------------------- */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/utility-effect.hbs",
			templates: ["systems/black-flag/templates/activity/parts/activity-effects.hbs"]
		}
	};
}

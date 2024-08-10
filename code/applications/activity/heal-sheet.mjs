import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Healing activities.
 */
export default class HealSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["heal-activity"]
	};

	/* -------------------------------------------- */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/heal-effect.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-effects.hbs",
				"systems/black-flag/templates/activity/parts/damage-part.hbs",
				"systems/black-flag/templates/activity/parts/heal-healing.hbs"
			]
		}
	};
}

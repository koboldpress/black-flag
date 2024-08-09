import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Utility activities.
 */
export default class UtilitySheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["utility-activity"]
	};
}

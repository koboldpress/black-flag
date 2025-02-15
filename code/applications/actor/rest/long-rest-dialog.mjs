import BaseRestDialog from "./base-rest-dialog.mjs";

/**
 * Dialog for performing a long rest.
 */
export default class LongRestDialog extends BaseRestDialog {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["long-rest"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		content: {
			template: "systems/black-flag/templates/actor/rest/long-rest.hbs"
		}
	};
}

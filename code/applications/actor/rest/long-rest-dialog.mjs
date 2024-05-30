import BaseRestDialog from "./base-rest-dialog.mjs";

export default class LongRestDialog extends BaseRestDialog {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/actor/rest/long-rest.hbs"
		});
	}
}

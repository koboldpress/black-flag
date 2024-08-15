import PseudoDocumentSelection from "../pseudo-document-selection.mjs";

/**
 * Presents a list of activity types to create when clicking the new activity button.
 */
export default class ActivitySelection extends PseudoDocumentSelection {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: "BF.ACTIVITY.Selection.Title",
			type: "Activity",
			errorMessage: "BF.ACTIVITY.Selection.Error"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get id() {
		return `item-${this.item.id}-activity-selection`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData() {
		const context = super.getData();
		context.types = {};
		for (const [name, config] of Object.entries(CONFIG.Activity.types)) {
			if (name === CONST.BASE_DOCUMENT_TYPE) continue;
			const activity = config.documentClass;
			context.types[name] = {
				label: game.i18n.localize(activity.metadata.title),
				icon: activity.metadata.icon,
				hint: game.i18n.localize(activity.metadata.hint)
			};
		}
		context.types = BlackFlag.utils.sortObjectEntries(context.types, { sortKey: "label" });
		context.buttonLabel = game.i18n.localize("BF.ACTIVITY.Core.Action.Create");
		return context;
	}
}

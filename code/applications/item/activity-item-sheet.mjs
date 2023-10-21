import ActivitySelection from "../activity/activity-selection.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";

export default class ActivityItemSheet extends BaseItemSheet {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);

		const contextOptions = this._getAdvancementContextMenuOptions();
		/**
		 * A hook event that fires when the context menu for the activities list is constructed.
		 * @function blackFlag.getItemActivityContext
		 * @memberof hookEvents
		 * @param {jQuery} html - The HTML element to which the context options are attached.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getItemActivityContext", jQuery, contextOptions);
		if ( contextOptions ) new ContextMenu(jQuery, "[data-activity-id]", contextOptions);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for activity entries.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 * @protected
	 */
	_getAdvancementContextMenuOptions() {
		return [
			{
				name: "BF.Activity.Core.Action.Edit",
				icon: "<i class='fas fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onActivityAction(li[0], "edit")
			},
			{
				name: "BF.Activity.Core.Action.Duplicate",
				icon: "<i class='fas fa-copy fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onActivityAction(li[0], "duplicate")
			},
			{
				name: "BF.Activity.Core.Action.Delete",
				icon: "<i class='fas fa-trash fa-fw' style='color: rgb(255, 65, 65);'></i>",
				condition: li => this.isEditable,
				callback: li => this._onActivityAction(li[0], "delete")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_onAction(event) {
		const { action, subAction } = event.currentTarget.dataset;
		if ( action !== "activity" ) return super._onAction(event);
		this._onActivityAction(event.currentTarget, subAction);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the activity actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 */
	_onActivityAction(target, action) {
		const id = target.closest("[data-activity-id]")?.dataset.activityId;
		const activity = this.item.system.activities.get(id);
		if ( ["edit", "delete", "duplicate"].includes(action) && !activity ) return;
		switch (action) {
			case "add": return ActivitySelection.createDialog(this.item);
			case "edit": return activity.sheet.render(true);
			case "delete": return this.item.deleteEmbeddedDocuments("Activity", [id]);
			case "duplicate":
				const data = activity.toObject();
				delete data._id;
				return this.item.createEmbeddedDocuments("Activity", [data]);
			default:
				return log(`Invalid activity action type clicked ${action}.`, { level: "warn" });
		}
	}
}

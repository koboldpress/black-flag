import ActivitySelection from "../activity/activity-selection.mjs";

/**
 * Custom element for displaying the activities on an item sheet.
 */
export default class ActivitiesElement extends HTMLElement {

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this.#onActivityAction(event.currentTarget, event.currentTarget.dataset.action);
			});
		}

		const contextOptions = this.#getAdvancementContextMenuOptions();
		/**
		 * A hook event that fires when the context menu for the activities list is constructed.
		 * @function blackFlag.getItemActivityContext
		 * @memberof hookEvents
		 * @param {ActivitiesElement} html - The HTML element to which the context options are attached.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getItemActivityContext", this, contextOptions);
		if ( contextOptions ) ContextMenu.create(this.#app, this, "[data-activity-id]", contextOptions);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reference to the application that contains this component.
	 * @type {Application}
	 */
	#app;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activities collection stored on the item.
	 * @type {Collection<Activity>}
	 */
	get activities() {
		return this.item.system.activities;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item to which these activities belong.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.#app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for activity entries.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 */
	#getAdvancementContextMenuOptions() {
		return [
			{
				name: "BF.Activity.Core.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => this.item.testUserPermission(game.user, "EDIT"),
				callback: li => this.#onActivityAction(li[0], "edit")
			},
			{
				name: "BF.Activity.Core.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => this.item.testUserPermission(game.user, "EDIT"),
				callback: li => this.#onActivityAction(li[0], "duplicate")
			},
			{
				name: "BF.Activity.Core.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => this.item.testUserPermission(game.user, "EDIT"),
				callback: li => this.#onActivityAction(li[0], "delete"),
				group: "destructive"
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the activity actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 */
	#onActivityAction(target, action) {
		const id = target.closest("[data-activity-id]")?.dataset.activityId;
		const activity = this.activities.get(id);
		if ( ["edit", "delete", "duplicate"].includes(action) && !activity ) return;
		switch ( action ) {
			case "add": return ActivitySelection.createDialog(this.item);
			case "edit": return activity.sheet.render(true);
			case "delete": return activity.deleteDialog();
			case "duplicate":
				const data = activity.toObject();
				delete data._id;
				return this.item.createEmbeddedDocuments("Activity", [data]);
			default:
				return log(`Invalid activity action type clicked ${action}.`, { level: "warn" });
		}
	}
}

import AdvancementSelection from "../advancement/advancement-selection.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";

export default class AdvancementItemSheet extends BaseItemSheet {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.advancement = this.getAdvancement();
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare advancement items for display on sheet.
	 * @returns {object[]}
	 */
	getAdvancement() {
		const advancement = {};

		const needingConfiguration = this.item.system.advancement.filter(a => !a.levels.length);
		if ( needingConfiguration.length ) {
			advancement.unconfigured = {
				items: needingConfiguration.map(a => ({
					id: a.id,
					order: a.constructor.order,
					title: a.title,
					icon: a.icon
				}))
			};
		}

		for ( const level of this.item.system.advancement.levels ) {
			const levels = { character: level, class: level };
			const items = this.item.system.advancement.byLevel(level).map(a => ({
				id: a.id,
				order: a.sortingValueForLevel(levels),
				title: a.titleForLevel(levels),
				icon: a.icon,
				summary: a.summaryForLevel(levels)
			}));
			if ( !items.length ) continue;
			advancement[level] = { items: items.sort((a, b) => a.order.localeCompare(b.order)) };
		}

		return advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);

		const contextOptions = this._getAdvancementContextMenuOptions();
		/**
		 * A hook event that fires when the context menu for the advancements list is constructed.
		 * @function blackFlag.getItemAdvancementContext
		 * @memberof hookEvents
		 * @param {jQuery} html - The HTML element to which the context options are attached.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getItemAdvancementContext", jQuery, contextOptions);
		if ( contextOptions ) new ContextMenu(jQuery, "[data-advancement-id]", contextOptions);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for advancement entries.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 * @protected
	 */
	_getAdvancementContextMenuOptions() {
		return [
			{
				name: "BF.Advancement.Core.Action.Edit",
				icon: "<i class='fas fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAdvancementAction(li[0], "edit")
			},
			{
				name: "BF.Advancement.Core.Action.Duplicate",
				icon: "<i class='fas fa-copy fa-fw'></i>",
				condition: li => {
					const id = li[0].closest("[data-advancement-id]")?.dataset.advancementId;
					const advancement = this.item.system.advancement.get(id);
					return this.isEditable && advancement?.constructor.availableForItem(this.item);
				},
				callback: li => this._onAdvancementAction(li[0], "duplicate")
			},
			{
				name: "BF.Advancement.Core.Action.Delete",
				icon: "<i class='fas fa-trash fa-fw' style='color: rgb(255, 65, 65);'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAdvancementAction(li[0], "delete")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_onAction(event) {
		const { action, subAction } = event.currentTarget.dataset;
		if ( action !== "advancement" ) return super._onAction(event);
		this._onAdvancementAction(event.currentTarget, subAction);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the advancement actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 */
	_onAdvancementAction(target, action) {
		const id = target.closest("[data-advancement-id]")?.dataset.advancementId;
		const advancement = this.item.system.advancement.get(id);
		if ( ["edit", "delete", "duplicate"].includes(action) && !advancement ) return;
		switch (action) {
			case "add": return AdvancementSelection.createDialog(this.item);
			case "edit": return new advancement.constructor.metadata.apps.config(advancement).render(true);
			case "delete": return advancement.deleteDialog();
			case "duplicate":
				const data = advancement.toObject();
				delete data._id;
				return this.item.createEmbeddedDocuments("Advancement", [data]);
			default:
				return log(`Invalid advancement action type clicked ${action}.`, { level: "warn" });
		}
	}
}

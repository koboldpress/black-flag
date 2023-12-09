import { log } from "../../utils/_module.mjs";
import AdvancementSelection from "../advancement/advancement-selection.mjs";
import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying the advancement on an item sheet.
 */
export default class AdvancementElement extends AppAssociatedElement {

	connectedCallback() {
		super.connectedCallback();

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this.#onAction(event.currentTarget, event.currentTarget.dataset.action);
			});
		}

		const contextOptions = this.#getContextMenuOptions();
		/**
		 * A hook event that fires when the context menu for the advancements list is constructed.
		 * @function blackFlag.getItemAdvancementContext
		 * @memberof hookEvents
		 * @param {AdvancementElement} html - The HTML element to which the context options are attached.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getItemAdvancementContext", this, contextOptions);
		if ( contextOptions ) ContextMenu.create(this.app, this, "[data-advancement-id]", contextOptions);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Advancement collection stored on the item.
	 * @type {AdvancementCollection}
	 */
	get advancement() {
		return this.item.system.advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does the user have permission to edit the item?
	 * @type {boolean}
	 */
	get isEditable() {
		return this.item.testUserPermission(game.user, "EDIT");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item represented by the app.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the provided advancement collection for display.
	 * @param {AdvancementCollection} advancement
	 * @returns {object}
	 */
	static prepareContext(advancement) {
		const context = {};

		const needingConfiguration = advancement.filter(a => !a.levels.length);
		if ( needingConfiguration.length ) {
			context.unconfigured = {
				items: needingConfiguration.map(a => ({
					id: a.id,
					order: a.constructor.order,
					title: a.title,
					icon: a.icon,
					classRestriction: a.level.classRestriction
				}))
			};
		}

		for ( const level of advancement.levels ) {
			const levels = { character: level, class: level };
			const items = advancement.byLevel(level).map(a => ({
				id: a.id,
				order: a.sortingValueForLevel(levels),
				title: a.titleForLevel(levels),
				icon: a.icon,
				classRestriction: a.level.classRestriction,
				summary: a.summaryForLevel(levels)
			}));
			if ( !items.length ) continue;
			context[level] = { items: items.sort((a, b) => a.order.localeCompare(b.order)) };
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for advancement entries.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 */
	#getContextMenuOptions() {
		return [
			{
				name: "BF.Advancement.Core.Action.Edit",
				icon: "<i class='fas fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "edit")
			},
			{
				name: "BF.Advancement.Core.Action.Duplicate",
				icon: "<i class='fas fa-copy fa-fw'></i>",
				condition: li => {
					const id = li[0].closest("[data-advancement-id]")?.dataset.advancementId;
					const advancement = this.advancement.get(id);
					return this.isEditable && advancement?.constructor.availableForItem(this.item);
				},
				callback: li => this.#onAction(li[0], "duplicate")
			},
			{
				name: "BF.Advancement.Core.Action.Delete",
				icon: "<i class='fas fa-trash fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "delete"),
				group: "destructive"
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 */
	#onAction(target, action) {
		const id = target.closest("[data-advancement-id]")?.dataset.advancementId;
		const advancement = this.advancement.get(id);
		if ( ["edit", "delete", "duplicate"].includes(action) && !advancement ) return;
		switch ( action ) {
			case "add": return AdvancementSelection.createDialog(this.item);
			case "edit": return advancement.sheet.render(true);
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

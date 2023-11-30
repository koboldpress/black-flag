import { Trait } from "../../utils/_module.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";

export default class NPCSheet extends BaseActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "npc"],
			dragDrop: [{dragSelector: "[data-item-id]"}],
			width: 460,
			height: "auto",
			tabs: [
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: "main", initial: "main"}
			],
			scrollY: [".window-content"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.labels = {
			sizeAndType: `${game.i18n.localize(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${
				context.system.traits.type.label}`
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareItems(context) {
		await this._prepareItemSections(context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove the title from the app's header bar.
	 * @param {HTMLElement} element - Element of the app's window.
	 * @protected
	 */
	_removeTitle(element) {
		const title = element.querySelector(".window-header .window-title");
		const uuid = title.querySelector("a");
		title.innerHTML = `<span></span>${uuid?.outerHTML ?? ""}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _renderOuter() {
		const jQuery = await super._renderOuter();
		this._removeTitle(jQuery[0]);
		return jQuery;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_replaceHTML(element, html) {
		super._replaceHTML(element, html);
		this._removeTitle(element[0]);
	}
}

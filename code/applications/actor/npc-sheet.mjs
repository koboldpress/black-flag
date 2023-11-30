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
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareItems(context) {
		await this._prepareItemSections(context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareTraits(context) {
		context.traits = [];
		const { traits, proficiencies } = context.system;
		const none = game.i18n.localize("None");

		// Senses

		// Size
		const size = CONFIG.BlackFlag.sizes[traits.size];
		if ( size || this.modes.editing ) {
			context.traits.push({
				key: "size",
				classes: "single",
				label: "BF.Size.Label",
				value: size ? game.i18n.localize(size.label) : none
			});
		}

		// Creature Type
		// const type = CONFIG.BlackFlag.creatureTypes[traits.type.value];
		// if ( type || this.modes.editing ) {
		// 	const tagFormatter = game.i18n.getListFormatter({ type: "unit" });
		// 	context.traits.push({
		// 		key: "type",
		// 		classes: "single",
		// 		label: "BF.CreatureType.Label",
		// 		value: type ? `${game.i18n.localize(type.label)}${traits.type.tags.size ? ` (${
		// 			tagFormatter.format(traits.type.tags)
		// 		})` : ""}` : none
		// 	});
		// }

		// Languages
		// TODO: Add language tags
		context.traits.push({
			key: "languages",
			label: "BF.Language.Label[other]",
			value: Trait.localizedList(proficiencies.languages.value, [], { style: "short", trait: "languages" }) || none
		});

		// TODO: Resistances, Immunities, & Vulnerabilities
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _renderOuter() {
		const jQuery = await super._renderOuter();
		const title = jQuery[0].querySelector(".window-header .window-title");
		const uuid = title.querySelector("a");
		title.innerHTML = `<span></span>${uuid?.outerHTML ?? ""}`;
		return jQuery;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_replaceHTML(element, html) {
		super._replaceHTML(element, html);
		const title = element[0].querySelector(".window-header .window-title");
		const uuid = title.querySelector("a");
		title.innerHTML = `<span></span>${uuid?.outerHTML ?? ""}`;
	}
}

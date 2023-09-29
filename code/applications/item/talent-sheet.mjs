import BlackFlagActiveEffect from "../../documents/active-effect.mjs";
import AdvancementItemSheet from "./advancement-item-sheet.mjs";

export default class TalentSheet extends AdvancementItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "feature", "item", "sheet"],
			template: "systems/black-flag/templates/item/talent.hbs",
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "details"}],
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.effects = BlackFlagActiveEffect.prepareSheetSections(context.item.effects);

		const makeLabels = obj => Object.fromEntries(Object.entries(obj)
			.map(([k, d]) => [k, game.i18n.localize(`${d.localization}[one]`)])
			.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]))
		);
		context.talentCategories = makeLabels(CONFIG.BlackFlag.talentCategories);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll('[data-action="effect"]') ) {
			element.addEventListener("click", BlackFlagActiveEffect.onEffectAction.bind(this));
		}
	}
}

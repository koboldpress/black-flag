import { numberFormat } from "../../utils/_module.mjs";
import AdvancementFlow from "./advancement-flow.mjs";
import ChooseFeaturesDialog from "./choose-features-dialog.mjs";

/**
 * Inline application that presents a ability & talent choices.
 */
export default class ImprovementFlow extends AdvancementFlow {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/improvement-flow.hbs",
			submitOnChange: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		if ( !this.advancement.value.ability ) {
			context.abilities = Object.entries(CONFIG.BlackFlag.abilities.localized).reduce((obj, [key, label]) => {
				const ability = this.actor.system.abilities[key];
				if ( ability.value < ability.max ) {
					obj[key] = `${label}: ${numberFormat(ability.value)} → ${numberFormat(ability.value + 1)}`;
				}
				return obj;
			}, {});
			context.selectAbility = true;
		}
		context.selectTalent = foundry.utils.isEmpty(this.advancement.value.talent);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll('[data-action="remove-choice"]') ) {
			element.addEventListener("click", e => {
				const key = e.target.closest("[data-key]").dataset.key;
				this.advancement.reverse(this.levels, { key });
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		if ( event.submitter?.dataset.action === "select-choice" ) {
			let choice;
			try {
				const promise = new Promise((resolve, reject) => {
					(new ChooseFeaturesDialog(this, { resolve, reject }, { type: "talent" })).render(true);
				});
				choice = await promise;
			} catch(err) {
				return;
			}
			this.advancement.apply(this.levels, { talent: choice });
		} else {
			this.advancement.apply(this.levels, formData);
		}
	}
}


import { formatNumber } from "../../utils/_module.mjs";
import AdvancementFlow from "./advancement-flow-v2.mjs";
import ChooseFeaturesDialog from "./choose-features-dialog.mjs";

const { StringField } = foundry.data.fields;

/**
 * Inline application that presents a ability & talent choices.
 */
export default class ImprovementFlow extends AdvancementFlow {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			removeChoice: ImprovementFlow.#removeChoice
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		if (context.needsConfiguration) {
			context.actions.push({
				field: new StringField(),
				name: "ability",
				options: [
					{ value: "", label: game.i18n.localize("BF.Advancement.Improvement.Notification.Ability"), rule: true },
					...CONFIG.BlackFlag.abilities.localizedOptions
						.filter(({ value }) => this.actor.system.abilities[value].value < this.actor.system.abilities[value].max)
						.map(({ value, label }) => ({
							value,
							label: `${label}: ${formatNumber(this.actor.system.abilities[value].value)} → ${formatNumber(
								this.actor.system.abilities[value].value + 1
							)}`
						}))
				]
			});
			if (foundry.utils.isEmpty(this.advancement.value.talent))
				context.actions.push({
					type: "submit",
					classes: "light-button",
					action: "selectChoice",
					label: game.i18n.localize("BF.Advancement.Improvement.Action.Choose")
				});
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing an improvement choice.
	 * @this {ImprovementFlow}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #removeChoice(event, target) {
		const key = target.closest("[data-key]").dataset.key;
		this.advancement.reverse(this.levels, { key });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _handleForm(event, formData) {
		if (event.submitter?.dataset.action === "selectChoice") {
			let choice;
			try {
				const promise = new Promise((resolve, reject) =>
					this.actor.sheet._renderChild(
						new ChooseFeaturesDialog(this, { details: { type: "talent" }, resolve, reject })
					)
				);
				choice = await promise;
			} catch (err) {
				return;
			}
			this.advancement.apply(this.levels, { talent: choice });
		} else {
			this.advancement.apply(this.levels, formData.object);
		}
	}
}

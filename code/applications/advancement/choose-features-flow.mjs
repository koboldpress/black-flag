import AdvancementFlow from "./advancement-flow-v2.mjs";
import ChooseFeaturesDialog from "./choose-features-dialog.mjs";

/**
 * Inline application that presents a list of feature choices.
 */
export default class ChooseFeaturesFlow extends AdvancementFlow {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			removeChoice: ChooseFeaturesFlow.#removeChoice
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		content: {
			classes: ["advancement-summary"],
			template: "systems/black-flag/templates/advancement/choose-features-flow-content.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		if (context.needsConfiguration)
			context.actions.push({
				type: "submit",
				classes: "light-button",
				action: "selectChoice",
				label: game.i18n.localize("BF.Advancement.ChooseFeatures.Action.Choose")
			});

		const level = this.advancement.relavantLevel(this.levels);
		const replacementAvailable =
			this.advancement.configuration.choices[level]?.replacement && !this.advancement.value.replaced?.[level];
		if (replacementAvailable)
			context.actions.push({
				type: "submit",
				classes: "link-button",
				action: "replaceChoice",
				label: `
				<i class="fa-solid fa-shuffle" inert></i>
				${game.i18n.localize("BF.Advancement.ChooseFeatures.Action.Replace")}
			`
			});

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContentContext(context, options) {
		context = await super._prepareContentContext(context, options);
		context.chosen = [];
		for (const data of this.advancement.value.added?.[this.advancement.relavantLevel(this.levels)] ?? []) {
			const doc = data.document ?? (await fromUuid(data.uuid));
			context.chosen.push({
				anchor: doc.toAnchor().outerHTML,
				id: doc.id,
				replaced: !data.document,
				showDelete: (context.editable || context.needsConfiguration) && !!data.document
			});
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing an improvement choice.
	 * @this {ChooseFeaturesFlow}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #removeChoice(event, target) {
		const id = target.closest("[data-id]").dataset.id;
		this.advancement.reverse(this.levels, { id });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _handleForm(event, formData) {
		const isReplacement = event.submitter?.dataset.action === "replaceChoice";
		if (event.submitter?.dataset.action === "selectChoice" || isReplacement) {
			let choice;
			let replaces;
			try {
				({ choice, replaces } = await new Promise((resolve, reject) => {
					this.actor.sheet._renderChild(
						new ChooseFeaturesDialog(this, {
							details: {
								isReplacement,
								level: this.advancement.relavantLevel(this.levels)
							},
							resolve,
							reject
						})
					);
				}));
			} catch (err) {
				return;
			}
			return this.advancement.apply(this.levels, { choices: [choice], replaces });
		}
	}
}

import AdvancementFlow from "./advancement-flow.mjs";
import ChooseFeaturesDialog from "./choose-features-dialog.mjs";

/**
 * Inline application that presents a list of feature choices.
 */
export default class ChooseFeaturesFlow extends AdvancementFlow {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/choose-features-flow.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData() {
		const context = await super.getData();
		const level = this.advancement.relavantLevel(this.levels);
		const config = this.advancement.configuration.choices[level];
		context.chosen = [];
		for (const data of this.advancement.value.added?.[level] ?? []) {
			const doc = data.document ?? (await fromUuid(data.uuid));
			context.chosen.push({
				anchor: doc.toAnchor().outerHTML,
				id: doc.id,
				replaced: !data.document,
				showDelete: (context.modes?.editing || context.needsConfiguration) && !!data.document
			});
		}
		context.replacementAvailable = config?.replacement && !this.advancement.value.replaced?.[level];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll('[data-action="remove-choice"]')) {
			element.addEventListener("click", e => {
				const id = e.target.closest("[data-id]").dataset.id;
				this.advancement.reverse(this.levels, id);
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _updateObject(event, formData) {
		const isReplacement = event.submitter?.dataset.action === "replace-choice";
		if (event.submitter?.dataset.action === "select-choice" || isReplacement) {
			let choice;
			let replaces;
			try {
				({ choice, replaces } = await new Promise((resolve, reject) => {
					new ChooseFeaturesDialog(this, {
						isReplacement,
						level: this.advancement.relavantLevel(this.levels),
						resolve,
						reject
					}).render(true);
				}));
			} catch (err) {
				return;
			}
			return this.advancement.apply(this.levels, { choices: [choice], replaces });
		}
	}
}

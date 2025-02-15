import BFApplication from "../api/application.mjs";

/**
 * Dialog that presents a list of features from which to choose.
 */
export default class ChooseFeaturesDialog extends BFApplication {
	constructor(advancementFlow, { resolve, reject, ...options } = {}) {
		options.details ??= {};
		options.details.flow = advancementFlow;
		super(options);
		this.#responses = { resolve, reject };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			choose: ChooseFeaturesDialog.#chooseFeature
		},
		classes: ["choose-features-dialog", "form-list"],
		details: {
			flow: null,
			level: null,
			isReplacement: false,
			type: null
		},
		dragDropHandlers: {
			drop: ChooseFeaturesDialog.#onDrop
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		options: {
			template: "systems/black-flag/templates/advancement/choose-features-dialog.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Advancement for which this choice is being made.
	 * @type {Advancement}
	 */
	get advancement() {
		return this.options.details.flow.advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Functions to call when a choice is made.
	 * @type {{resolve: Function, reject: Function}}
	 */
	#responses;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		const configType = this.options.details.type ?? this.advancement.configuration.type;
		const config = this.advancement.configuration;
		let type;
		if (configType === "feature") {
			const category = CONFIG.BlackFlag.featureCategories[config.restriction?.category];
			const subtype = category?.types?.[config.restriction?.type];
			if (subtype) type = subtype.localization;
			else if (category) type = category.localization;
			if (type) type = `${type}[one]`;
		}
		if (!type) type = CONFIG.Item.typeLabels[configType];
		return game.i18n.format(`BF.ConceptSelection.${this.options.details.isReplacement ? "Replace" : ""}Title`, {
			type: game.i18n.localize(type)
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.advancement = this.advancement;
		context.allowDrops = this.advancement.configuration.allowDrops;
		context.choices = await Promise.all((await this.advancement.choices()).map(c => this.getChoiceData(c)));
		if (context.allowDrops)
			context.dropLabel = game.i18n.format("BF.Advancement.ChooseFeatures.Drop", {
				type: game.i18n.localize(`BF.Item.Type.${this.advancement.configuration.type.capitalize()}[one]`).toLowerCase()
			});
		if (this.options.details.isReplacement) {
			context.replacements = [];
			for (const level of Array.fromRange(this.options.details.level - 1, 1)) {
				const data = this.advancement.value.added[level];
				if (!data?.length) continue;
				const replaced = Object.values(this.advancement.value.replaced ?? {}).filter(r => r.level === level);
				for (const added of data) {
					if (!added.document || replaced.find(r => r.original === added.id)) continue;
					context.replacements.push({ value: added.document.id, label: added.document.name });
				}
			}
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data for an individual choice in the list.
	 * @param {BlackFlagItem} doc - Document of the option being presented.
	 * @returns {object}
	 */
	async getChoiceData(doc) {
		const optionContext = { document: doc, system: doc.system };
		optionContext.enriched = {
			description: await TextEditor.enrichHTML(doc.system.description.value, { secrets: false, async: true })
		};
		if (doc.system.restriction) {
			optionContext.prerequisite = doc.system.createPrerequisiteLabel(this.advancement.actor);
			optionContext.invalid = doc.system.validatePrerequisites(this.advancement.actor) !== true;
		}
		return optionContext;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle choosing a featuring using the button.
	 * @this {ChooseFeaturesDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #chooseFeature(event, target) {
		this.handleChoice(target.closest("[data-uuid]").dataset.uuid);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle choosing a specific option.
	 * @param {string} uuid - UUID of the choice made.
	 */
	async handleChoice(uuid) {
		let replaces;
		if (this.options.details.isReplacement) replaces = this.element[0].querySelector('[name="replaces"]').value;
		this.close({ response: { choice: uuid, replaces } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async close(options = {}) {
		await super.close(options);
		if (options.response) this.#responses.resolve(options.response);
		else this.#responses.reject();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle dropping an entry onto the app.
	 * @this {ChooseFeaturesDialog}
	 * @param {Event} event - Triggering event.
	 * @param {DragDrop} dragDrop - The drag event manager.
	 * @returns {Promise}
	 */
	static async #onDrop(event, dragDrop) {
		const data = TextEditor.getDragEventData(event);
		if (data?.type !== "Item") return false;
		const item = await Item.implementation.fromDropData(data);

		try {
			this.advancement._validateItemType(item, { flow: true });
		} catch (err) {
			ui.notifications.error(err.message);
			return;
		} finally {
			dragDrop.finishDragEvent(event);
		}

		if (this.advancement.selectionLimitReached(item)) {
			return ui.notifications.error(game.i18n.localize("BF.Advancement.ChooseFeatures.Warning.PreviouslyChosen"));
		}

		this.handleChoice(item.uuid);
	}
}

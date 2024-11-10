/**
 * Dialog that presents a list of features from which to choose.
 */
export default class ChooseFeaturesDialog extends FormApplication {
	constructor(advancementFlow, { resolve, reject, ...options } = {}) {
		super(advancementFlow, options);
		this.responses = { resolve, reject };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Functions to call when a choice is made.
	 * @type {{resolve: Function, reject: Function}}
	 */
	responses;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "choose-features-dialog"],
			dragDrop: [{ dropSelector: ".drop-target" }],
			template: "systems/black-flag/templates/advancement/choose-features-dialog.hbs",
			width: "auto",
			height: "auto",
			isReplacement: false,
			level: null
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Advancement for which this choice is being made.
	 * @type {Advancement}
	 */
	get advancement() {
		return this.object.advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		const configType = this.options.type ?? this.advancement.configuration.type;
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
		return game.i18n.format(`BF.ConceptSelection.${this.options.isReplacement ? "Replace" : ""}Title`, {
			type: game.i18n.localize(type)
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.advancement = this.advancement;
		context.allowDrops = this.advancement.configuration.allowDrops;
		context.choices = await Promise.all((await this.advancement.choices()).map(c => this.getChoiceData(c)));
		if (context.allowDrops)
			context.dropLabel = game.i18n.format("BF.Advancement.ChooseFeatures.Drop", {
				type: game.i18n.localize(`BF.Item.Type.${this.advancement.configuration.type.capitalize()}[one]`).toLowerCase()
			});
		if (this.options.isReplacement) {
			context.replacements = [];
			for (const level of Array.fromRange(this.options.level - 1, 1)) {
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
	 * @param {BlackFlagItem} document - Document of the option being presented.
	 * @returns {object}
	 */
	async getChoiceData(document) {
		const optionContext = { document, system: document.system };
		optionContext.enriched = {
			description: await TextEditor.enrichHTML(document.system.description.value, { secrets: false, async: true })
		};
		if (document.system.restriction) {
			optionContext.prerequisite = document.system.createPrerequisiteLabel(this.advancement.actor);
			optionContext.invalid = document.system.validatePrerequisites(this.advancement.actor) !== true;
		}
		return optionContext;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("button.choose")) {
			element.addEventListener("click", event => {
				event.preventDefault();
				this.handleChoice(event.target.closest("[data-uuid]").dataset.uuid);
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle choosing a specific option.
	 * @param {string} uuid - UUID of the choice made.
	 */
	async handleChoice(uuid) {
		let replaces;
		if (this.options.isReplacement) replaces = this.element[0].querySelector('[name="replaces"]').value;
		this.close({ response: { choice: uuid, replaces } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async close(options = {}) {
		await super.close(options);
		if (options.response) this.responses.resolve(options.response);
		else this.responses.reject();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		if (data?.type !== "Item") return false;
		const item = await Item.implementation.fromDropData(data);

		try {
			this.advancement._validateItemType(item, { flow: true });
		} catch (err) {
			return ui.notifications.error(err.message);
		}

		if (this.advancement.selectionLimitReached(item)) {
			return ui.notifications.error(game.i18n.localize("BF.Advancement.ChooseFeatures.Warning.PreviouslyChosen"));
		}

		this.handleChoice(item.uuid);
	}
}

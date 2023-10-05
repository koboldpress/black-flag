import { log } from "../../utils/_module.mjs";

/**
 * Dialog that presents a list of features from which to choose.
 */
export default class ChooseFeaturesDialog extends FormApplication {
	constructor(advancementFlow, responses, options={}) {
		super(options);
		this.advancementFlow = advancementFlow;
		this.responses = responses;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Choose features flow for which this choice is being made.
	 * @type {ChooseFeaturesFlow}
	 */
	advancementFlow;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Functions to call when a choice is made.
	 * @type {{resolve: Function, reject: Function}}
	 */
	responses;

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "choose-features-dialog"],
			dragDrop: [{ dropSelector: ".drop-target" }],
			template: "systems/black-flag/templates/advancement/choose-features-dialog.hbs",
			width: "auto",
			height: "auto"
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
		return this.advancementFlow.advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		const config = this.advancement.configuration;
		let type;
		if ( config.type === "feature" ) {
			const category = CONFIG.BlackFlag.featureCategories[config.restriction.category];
			const subtype = category?.types?.[config.restriction.type];
			if ( subtype ) type = subtype.localization;
			else if ( category ) type = category.localization;
			if ( type ) type = `${type}[one]`;
		}
		if ( !type ) type = CONFIG.Item.typeLabels[config.type];
		return game.i18n.format("BF.ConceptSelection.Title", { type: game.i18n.localize(type) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.advancement = this.advancement;
		context.allowDrops = this.advancement.configuration.allowDrops;
		context.choices = (await Promise.all(
			Object.values(this.advancement.configuration.pool)
				.filter(c => !this.advancement.itemChosen(c.uuid))
				.map(c => this.getChoiceData(c.uuid))
		)).filter(c => c);
		context.dropLabel = game.i18n.format("BF.Advancement.ChooseFeatures.Drop", {
			type: game.i18n.localize(`BF.Item.Type.${this.advancement.configuration.type.capitalize()}[one]`).toLowerCase()
		});
		// TODO: Filter out any choices made a previous levels
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data for an individual choice in the list.
	 * @param {string} uuid - UUID of the option being presented.
	 * @returns {object}
	 */
	async getChoiceData(uuid) {
		const document = await fromUuid(uuid);
		if ( !document ) {
			log(`Choice document could not be found: ${uuid}`, { level: "warn" });
			return null;
		}
		const optionContext = { document, system: document.system };
		optionContext.enriched = {
			description: await TextEditor.enrichHTML(document.system.description.value, {secrets: false, async: true})
		};
		return optionContext;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll("button.choose") ) {
			element.addEventListener("click", event => {
				event.preventDefault();
				this.close({ choosen: event.target.closest("[data-uuid]").dataset.uuid });
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async close(options={}) {
		await super.close(options);
		if ( options.choosen ) this.responses.resolve(options.choosen);
		else this.responses.reject();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		if ( data?.type !== "Item" ) return false;
		const item = await Item.implementation.fromDropData(data);

		try {
			this.advancement._validateItemType(item);
		} catch(err) {
			return ui.notifications.error(err.message);
		}

		if ( this.advancement.itemChosen(item.uuid) ) {
			return ui.notifications.warning(game.i18n.localize("BF.Advancement.ChooseFeatures.Warning.PreviouslyChosen"));
		}

		this.close({ choosen: item.uuid });
	}
}

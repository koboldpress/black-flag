/**
 * Dialog that presents a list of class, subclass, lineage, heritage, or background options for the player to choose.
 */
export default class ConceptSelectionDialog extends FormApplication {
	constructor(actor, type, options={}) {
		super(options);
		this.options.classes.push(type);
		this.actor = actor;
		this.type = type;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor to which the item will be applied.
	 * @type {BlackFlagActor}
	 */
	actor;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Type of item to be selected by this dialog.
	 * @type {string}
	 */
	type;

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "concept-selection-dialog"],
			width: "auto",
			height: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get template() {
		return `systems/black-flag/templates/actor/concept-selection-dialog-${this.type === "class" ? "class" : "other"}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		return game.i18n.format("BF.ConceptSelection.Title", {
			type: game.i18n.localize(CONFIG.Item.typeLabels[this.type])
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.choices = await Promise.all(
			Object.values(CONFIG.BlackFlag.registration.list(this.type) ?? {}).map(o => this.getOptionData(o))
		);
		context.typeName = game.i18n.localize(CONFIG.Item.typeLabels[this.type]).toLowerCase();
		context.typeNamePlural = game.i18n.localize(CONFIG.Item.typeLabelsPlural[this.type]).toLowerCase();
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async getOptionData(option) {
		const document = await fromUuid(option.sources[option.sources.length - 1]);
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
			element.addEventListener("click", this._onChoose.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle choosing an option.
	 * @param {ClickEvent} event - Triggering click event.
	 */
	async _onChoose(event) {
		event.preventDefault();
		const uuid = event.target.closest("[data-uuid]").dataset.uuid;
		const document = await fromUuid(uuid);
		if ( this.type === "class" ) await this.actor.system.levelUp(document);
		else await this.actor.system.setConcept(document);
		this.close();
	}
}

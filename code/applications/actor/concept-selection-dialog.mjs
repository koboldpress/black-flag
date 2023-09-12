/**
 * Dialog that presents a list of class, subclass, lineage, heritage, or background options for the player to choose.
 */
export default class ConceptSelectionDialog extends FormApplication {
	constructor(actor, type, options) {
		// TODO: Set width & height appropriate depending on type

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
			height: 800,
			width: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get template() {
		return `systems/black-flag/templates/actor/concept-selection-dialog-${this.type === "class" ? "class" : "other"}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.options = [];
		context.options = await Promise.all(
			Object.values(CONFIG.BlackFlag.registration.list(this.type) ?? {}).map(o => this.getOptionData(o))
		);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async getOptionData(option) {
		const document = await fromUuid(option.sources[0]);
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
		this.actor.setConcept(this.type, document);
		this.close();
	}
}

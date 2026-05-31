import BFFormDialog from "../../api/form-dialog.mjs";

/**
 * Dialog for performing rests on actors.
 * @abstract
 */
export default class BaseRestDialog extends BFFormDialog {
	constructor(options = {}) {
		super(options);
		this.#config = options.config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["rest", "form-list"],
		config: null,
		document: null,
		form: {
			handler: BaseRestDialog.#handleFormSubmission
		},
		position: {
			width: 380
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor that is performing the rest.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.options.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The rest configuration.
	 * @type {RestConfiguration}
	 */
	#config;

	get config() {
		return this.#config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Was the rest button pressed?
	 * @type {boolean}
	 */
	#rested = false;

	get rested() {
		return this.#rested;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Result of the rest operation.
	 * @type {object}
	 */
	result = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return _loc(CONFIG.BlackFlag.rest.types[this.config.type]?.label);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const restConfig = CONFIG.BlackFlag.rest.types[this.config.type];
		const context = {
			...(await super._prepareContext(options)),
			actor: this.actor,
			config: this.config,
			fields: [],
			hd: this.actor.system.attributes?.hd,
			hp: this.actor.system.attributes?.hp,
			note: restConfig?.hint ? _loc(restConfig.hint) : ""
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle submission of the dialog using the form buttons.
	 * @this {BaseRestDialog}
	 * @param {Event|SubmitEvent} event - The form submission event.
	 * @param {HTMLFormElement} form - The submitted form.
	 * @param {FormDataExtended} formData - Data from the dialog.
	 */
	static async #handleFormSubmission(event, form, formData) {
		foundry.utils.mergeObject(this.config, formData.object);
		this.#rested = true;
		await this.close();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor that displays the appropriate rest dialog and returns user choices when complete.
	 * @param {BlackFlagActor} actor - Actor that is taking the rest.
	 * @param {RestConfiguration} config - Configuration information for the rest.
	 * @param {object} [options={}] - Additional options for the application.
	 * @param {ApplicationV2} [options.sheet] - The sheet to render this dialog a child of.
	 * @returns {Promise<RestConfiguration>}
	 */
	static async rest(actor, config, { sheet } = {}) {
		return new Promise((resolve, reject) => {
			const app = new this({
				config,
				buttons: [
					{
						default: true,
						icon: "fa-solid fa-bed",
						label: _loc("BF.Rest.Action.Rest.Label"),
						name: "rest",
						type: "submit"
					}
				],
				document: actor
			});
			app.addEventListener("close", () => (app.rested ? resolve(app.config) : reject()), { once: true });
			if (sheet) sheet._renderChild(app);
			else app.render({ force: true });
		});
	}
}

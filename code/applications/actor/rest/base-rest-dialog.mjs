/**
 * Dialog for performing rests on actors.
 *
 * @param {BlackFlagActor} actor - Actor that is taking the rest.
 * @param {DialogData} data
 * @param {RestConfiguration} data.config - Configuration information for the rest.
 * @param {DialogOptions} options - Dialog rendering options.
 * @abstract
 */
export default class BaseRestDialog extends Dialog {
	constructor(actor, data, options) {
		super(data, options);
		this.actor = actor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor that is performing the rest.
	 * @type {BlackFlagActor}
	 */
	actor;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Result of the rest operation.
	 * @type {object}
	 */
	result = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["everyday-heroes", "dialog", "rest"],
			width: 350
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor that displays the appropriate rest dialog and returns user choices when complete.
	 * @param {BlackFlagActor} actor - Actor that is taking the rest.
	 * @param {RestConfiguration} config - Configuration information for the rest.
	 * @returns {Promise}
	 */
	static async rest(actor, config) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		return new Promise((resolve, reject) => {
			const dialog = new this(actor, {
				config,
				title: game.i18n.localize(restConfig.label),
				content: game.i18n.localize(restConfig.hint),
				buttons: {
					rest: {
						icon: '<i class="fas fa-bed"></i>',
						label: game.i18n.localize("BF.Rest.Action.Rest.Label"),
						callback: jQuery => {
							resolve(dialog.result);
						}
					},
					cancel: {
						icon: '<i class="fas fa-times"></i>',
						label: game.i18n.localize("Cancel"),
						callback: reject
					}
				},
				default: "rest",
				close: reject
			});
			dialog.render(true);
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options = {}) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.config = this.data.config;
		context.result = this.result;
		context.hd = this.actor.system.attributes.hd;
		context.hp = this.actor.system.attributes.hp;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	submit(button, event) {
		event.preventDefault();
		super.submit(button, event);
	}
}

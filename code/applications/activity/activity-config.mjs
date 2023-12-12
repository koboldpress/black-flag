import { log } from "../../utils/_module.mjs";

/**
 * Base configuration application for activities that can be extended by other types to implement custom
 * editing interfaces.
 *
 * @param {Activity} activity - The activity item being edited.
 * @param {object} [options={}] - Additional options passed to FormApplication.
 */
export default class ActivityConfig extends FormApplication {
	constructor(activity, options={}) {
		super(activity, options);
		this.#activityId = activity.id;
		this.item = activity.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "activity-config"],
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "details"}],
			template: "systems/black-flag/templates/activities/activity-config.hbs",
			width: 500,
			height: "auto",
			submitOnChange: true,
			closeOnSubmit: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ID of the activity being created or edited.
	 * @type {string}
	 */
	#activityId;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The activity being created or edited.
	 * @type {Activity}
	 */
	get activity() {
		return this.item.getEmbeddedDocument("Activity", this.#activityId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Parent item to which this activity belongs.
	 * @type {BlackFlagItem}
	 */
	item;

	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		const type = game.i18n.localize(this.activity.constructor.metadata.title);
		return `${game.i18n.format("BF.Activity.Config.Title", { item: this.item.name })}: ${type}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async close(options={}) {
		await super.close(options);
		delete this.activity.apps[this.appId];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const source = this.activity.toObject();
		const context = foundry.utils.mergeObject(await super.getData(options), {
			activity: this.activity,
			system: this.activity.system,
			source,
			default: {
				title: game.i18n.localize(this.activity.constructor.metadata.title),
				icon: this.activity.constructor.metadata.icon
			},
			enriched: await TextEditor.enrichHTML(source.description ?? "", {
				secrets: true, rollData: this.item.getRollData(), async: true, relativeTo: this.item
			}),
			showBaseDamage: Object.hasOwn(this.item.system, "damage")
		});
		context.CONFIG = CONFIG.BlackFlag;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	render(force=false, options={}) {
		this.activity.apps[this.appId] = this;
		return super.render(force, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", this._onAction.bind(this));
		}

		for ( const element of html.querySelectorAll("img[data-edit]") ) {
			element.addEventListener("click", this._onEditIcon.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a sheet action.
	 * @param {ClickEvent} event - The click event.
	 * @returns {Promise}
	 */
	_onAction(event) {
		const { action, subAction } = event.currentTarget.dataset;
		return log(`Unrecognized action: ${action}/${subAction}`, { level: "warn" });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle changing a Activity's icon.
	 * @param {ClickEvent} event - The click event.
	 * @returns {Promise}
	 */
	_onEditIcon(event) {
		const attr = event.currentTarget.dataset.edit;
		const current = foundry.utils.getProperty(this.activity, attr);
		const fp = new FilePicker({
			current,
			type: "image",
			redirectToRoot: [this.activity.constructor.metadata.icon],
			callback: path => {
				event.currentTarget.src = path;
				if ( this.options.submitOnChange ) return this._onSubmit(event);
			},
			top: this.position.top + 40,
			left: this.position.left + 10
		});
		return fp.browse();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);

		// TODO: Find a way to move this behavior into DamageListElement & ConsumptionElement
		if ( foundry.utils.hasProperty(updates, "system.damage.parts") ) {
			updates.system.damage.parts = Object.entries(updates.system.damage.parts).reduce((arr, [k, v]) => {
				arr[k] = v;
				return arr;
			}, []);
		}
		if ( foundry.utils.hasProperty(updates, "consumption.targets") ) {
			updates.consumption.targets = Object.entries(updates.consumption.targets).reduce((arr, [k, v]) => {
				arr[k] = v;
				return arr;
			}, []);
		}

		await this.activity.update(updates);
	}
}

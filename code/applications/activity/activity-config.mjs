/**
 * Base configuration application for activities that can be extended by other types to implement custom
 * editing interfaces.
 *
 * @param {Activity} activity - The activity item being edited.
 * @param {object} [options={}] - Additional options passed to FormApplication.
 */
export default class ActivityConfig extends FormApplication {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "activity-config"],
			template: "systems/black-flag/templates/activities/activity-config.hbs",
			width: 500,
			height: "auto",
			submitOnChange: true,
			closeOnSubmit: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The activity being created or edited.
	 * @type {Activity}
	 */
	get activity() {
		return this.object;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item to which the activity belongs.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.activity.item;
	}

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

	getData(options) {
		const context = foundry.utils.mergeObject(super.getData(options), {
			CONFIG: CONFIG.BlackFlag,
			activity: this.activity,
			system: this.activity.system,
			source: this.activity.toObject(),
			default: {
				title: game.i18n.localize(this.activity.constructor.metadata.title),
				icon: this.activity.constructor.metadata.icon
			}
		});
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

		for ( const element of html.querySelectorAll("img[data-edit]") ) {
			element.addEventListener("click", this._onEditIcon.bind(this));
		}
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
		await this.activity.update(formData);
	}
}

/**
 * Application to handled configuring the activation of an activity.
 */
export default class ActivityActivationDialog extends Dialog {
	constructor(activity, config={}, data={}, options={}) {
		super(data, options);
		this.options.classes.push("black-flag", "activity-activation");
		this.activity = activity;
		this.config = config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			submitOnChange: true,
			jQuery: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The activity being activated.
	 * @type {Activity}
	 */
	activity;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration data for the activation.
	 * @type {ActivityActivationConfiguration}
	 */
	config;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the activity activation dialog.
	 * @param {Activity} activity - Activity to activate.
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activation.
	 * @returns {Promise<object|null>} - Form data object with the results of the activation.
	 * @throws error if activity couldn't be activated.
	 */
	static async create(activity, config) {
		if ( !activity.item.isOwned ) throw new Error("Cannot activate an activity that is not owned.");

		return new Promise((resolve, reject) => {
			const dialog = new this(activity, config, {
				title: `${activity.item.name}: ${game.i18n.localize("BF.Activity.Activation.Title")}`,
				content: null,
				buttons: {
					use: {
						icon: `<i class="fa-solid fa-${activity.isSpell ? "magic" : "fist-raised"}"></i>`,
						label: game.i18n.localize(activity.activationLabel),
						callback: html => {
							const formData = new FormDataExtended(html.querySelector("form"));
							foundry.utils.mergeObject(config, formData.object);
							resolve(formData.object);
						}
					}
					// TODO: Support custom buttons?
				},
				close: () => reject(null),
				default: "use"
			}, { jQuery: false });
			dialog.render(true);
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options={}) {
		const context = await super.getData(options);

		// TODO: Determine what scaling is allowed based on whether it is a spell and what the max scale is set to
		// If spell, use (base ring + max scaling) or (max spell ring), whichever is lower
		// Otherwise, simply use the max scaling value
		//
		// For spells, prepare a list of what rings are available for casting and how many slots they have

		// TODO: Calculate resource consumption based on initial configuration

		const data = foundry.utils.mergeObject(foundry.utils.deepClone(this.config), {
			activity: this.activity,
			spell: {
				rings: this._prepareSpellSlotOptions()
			}
		}, { inplace: false });

		context.content = await renderTemplate(
			"systems/black-flag/templates/activities/activity-activation-dialog.hbs", data
		);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create possible spells slots that can be used to cast a spell.
	 * @returns {object[]}
	 */
	_prepareSpellSlotOptions() {
		// TODO: Adjust this when slots can also be consumed as resources
		const minimumRing = this.activity?.item?.system.ring?.base ?? 1;
		const spellcasting = this.activity.actor.system.spellcasting;
		const options = Object.entries(CONFIG.BlackFlag.spellRings()).reduce((obj, [level, label]) => {
			level = Number(level);
			if ( (level < minimumRing) || (level > spellcasting.maxRing) ) return obj;
			// TODO: Allow this to work with other spellcasting type
			const data = spellcasting.rings[`ring-${level}`] ?? { max: 0 };
			obj[level] = {
				label // TODO: Format with slots available out of total
			};
			return obj;
		}, {});
		return options;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const [html] = jQuery;

		for ( const field of html.querySelectorAll("input, select, textarea") ) {
			field.addEventListener("change", this._onChangeInput.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle re-rendering the form when inputs are changed.
	 * @param {Event} event - The initial change event.
	 * @protected
	 */
	async _onChangeInput(event) {
		const form = event.target.form ?? event.target.closest("form");
		const formData = new FormDataExtended(form);
		foundry.utils.mergeObject(this.config, formData.object);
		this.render();
	}
}

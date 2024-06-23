import { numberFormat, simplifyBonus } from "../../utils/_module.mjs";
import BlackFlagDialog from "../dialog.mjs";

/**
 * Application to handled configuring the activation of an activity.
 */
export default class ActivityActivationDialog extends BlackFlagDialog {
	constructor(activity, config = {}, data = {}, options = {}) {
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
		if (!activity.item.isOwned) throw new Error("Cannot activate an activity that is not owned.");

		return new Promise((resolve, reject) => {
			const dialog = new this(
				activity,
				config,
				{
					title: `${activity.item.name}: ${game.i18n.localize("BF.Activity.Activation.Title")}`,
					content: null,
					buttons: {
						use: {
							cssClass: "light-button",
							icon: `<i class="fa-solid fa-${activity.isSpell ? "magic" : "fist-raised"}"></i>`,
							label: game.i18n.localize(activity.activationLabel),
							callback: html => {
								const formData = this._getFormData(html.querySelector("form"));
								foundry.utils.mergeObject(config, formData);
								resolve(formData);
							}
						}
						// TODO: Support custom buttons?
					},
					close: () => reject(null),
					default: "use"
				},
				{ jQuery: false }
			);
			dialog.render(true);
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options = {}) {
		const context = await super.getData(options);

		// TODO: Calculate resource consumption based on initial configuration

		const data = foundry.utils.mergeObject(
			foundry.utils.deepClone(this.config),
			{
				activity: this.activity,
				resources: this._prepareResourceOptions(),
				spell: {
					circles: this._prepareSpellSlotOptions()
				}
			},
			{ inplace: false }
		);
		this._prepareScaling(data);
		data.show = {
			actionConsumption: this.activity.activation.type === "legendary",
			scaling: data.scalingData.max,
			scalingRange: data.scalingData.max <= 20,
			spellConsumption: this.activity.requiresSpellSlot,
			spellCircleSelection: this.activity.isSpell && !foundry.utils.isEmpty(data.spell.circles),
			resourceConsumption: !foundry.utils.isEmpty(data.resources)
		};
		data.show.anyConsumption =
			data.show.actionConsumption ||
			(data.show.spellConsumption && !data.show.spellCircleSelection) ||
			data.show.resourceConsumption;

		context.content = await renderTemplate(
			"systems/black-flag/templates/activities/activity-activation-dialog.hbs",
			data
		);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create possible resources that will be consumed by this item.
	 * @returns {object}
	 */
	_prepareResourceOptions() {
		const types = {};
		for (const target of this.activity.consumption.targets) {
			const isArray = foundry.utils.getType(this.config.consume?.resources) === "Array";
			types[target.type] = {
				label: game.i18n.localize(CONFIG.BlackFlag.consumptionTypes[target.type]?.prompt ?? target.type),
				selected:
					(isArray && this.config.consume.resources.includes(target.type)) ||
					(!isArray && this.config.consume?.resources !== false && this.config.consume !== false)
			};
		}
		return types;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create scaling range and value.
	 * @param {object} context - Context data being prepared.
	 */
	_prepareScaling(context) {
		context.scalingData ??= {};
		const scale = this.activity.consumption.scale;
		if (context.scaling !== false && scale.allowed && !this.activity.isSpell) {
			context.scalingData.max = scale.max
				? simplifyBonus(scale.max, this.activity.item.getRollData({ deterministic: true }))
				: Infinity;
			context.scalingData.value = Math.clamp((context.scaling ?? 0) + 1, 1, context.scalingData.max);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create possible spells slots that can be used to cast a spell.
	 * @returns {object[]}
	 */
	_prepareSpellSlotOptions() {
		const spellcasting = this.activity.actor.system.spellcasting;
		if (!spellcasting?.circles) return [];
		// TODO: Adjust this when slots can also be consumed as resources
		const minimumCircle = this.activity?.item?.system.circle?.base ?? 1;
		const options = Object.entries(CONFIG.BlackFlag.spellCircles()).reduce((obj, [level, label]) => {
			level = Number(level);
			if (level < minimumCircle || level > spellcasting.maxCircle) return obj;
			// TODO: Allow this to work with other spellcasting type
			const data = spellcasting.circles[`circle-${level}`] ?? { max: 0 };
			obj[level] = {
				label: game.i18n.format("BF.Consumption.Type.SpellSlots.Available", {
					slot: label,
					available: numberFormat(data.value)
				})
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

		for (const field of html.querySelectorAll("input, select, textarea, multi-select, multi-checkbox")) {
			field.addEventListener("change", this._onChangeInput.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve the data from the dialog's form, adjusting scaling as necessary.
	 * @param {HTMLFormElement} form - The dialog's form element.
	 * @returns {object}
	 */
	static _getFormData(form) {
		const formData = new FormDataExtended(form);
		const data = formData.object;
		if ("adjustedScaling" in data) {
			data.scaling = data.adjustedScaling - 1;
			delete data.adjustedScaling;
		}
		return data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle re-rendering the form when inputs are changed.
	 * @param {Event} event - The initial change event.
	 * @protected
	 */
	async _onChangeInput(event) {
		const formData = this.constructor._getFormData(event.target.form ?? event.target.closest("form"));
		formData["consume.resources"] ??= false;
		foundry.utils.mergeObject(this.config, formData);
		this.render();
	}
}

import { filteredKeys, numberFormat, simplifyBonus } from "../../utils/_module.mjs";
import BFFormDialog from "../api/form-dialog.mjs";

const { BooleanField, NumberField, StringField } = foundry.data.fields;

/**
 * Application to handled configuring the activation of an activity.
 */
export default class ActivityActivationDialog extends BFFormDialog {
	constructor(options = {}) {
		super(options);

		this.#activityId = options.activity.id;
		this.#item = options.activity.item;
		this.#config = options.config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["activity-activation"],
		actions: {
			use: ActivityActivationDialog.#onUse
		},
		activity: null,
		button: {
			icon: null,
			label: null
		},
		config: null,
		display: {
			all: true
		},
		form: {
			handler: ActivityActivationDialog.#onSubmitForm,
			submitOnChange: true
		},
		position: {
			width: 460
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		scaling: {
			template: "systems/black-flag/templates/activity/activity-activation-scaling.hbs"
		},
		consumption: {
			template: "systems/black-flag/templates/activity/activity-activation-consumption.hbs"
		},
		creation: {
			template: "systems/black-flag/templates/activity/activity-activation-creation.hbs"
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * ID of the activity being activated.
	 * @type {Activity}
	 */
	#activityId;

	/**
	 * Activity being activated.
	 * @type {Activity}
	 */
	get activity() {
		return this.item.system.activities.get(this.#activityId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor using this activity.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.item.actor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activity activation configuration data.
	 * @type {ActivityActivationConfiguration}
	 */
	#config;

	get config() {
		return this.#config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item that contains the activity.
	 * @type {BlackFlagItem}
	 */
	#item;

	get item() {
		return this.#item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return `${this.item.name}: ${this.activity.name}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Was the use button clicked?
	 * @type {boolean}
	 */
	#used = false;

	get used() {
		return this.#used;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		if ("scaling" in this.config) this.#item = this.#item.clone({ "flags.black-flag.scaling": this.config.scaling });
		return {
			...(await super._prepareContext(options)),
			activity: this.activity,
			linkedActivity: this.config.cause ? this.activity.getLinkedActivity(this.config.cause.activity) : null
		};
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "consumption":
				return this._prepareConsumptionContext(context, options);
			case "creation":
				return this._prepareCreationContext(context, options);
			case "footer":
				return this._prepareFooterContext(context, options);
			case "scaling":
				return this._prepareScalingContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the consumption section.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareConsumptionContext(context, options) {
		context.fields = [];
		context.notes = [];

		if (this.activity.spellSlotConsumption && this._shouldDisplay("consume.spellSlot") && !this.config.cause)
			context.fields.push({
				field: new BooleanField({ label: game.i18n.localize("BF.CONSUMPTION.Type.SpellSlots.PromptDecrease") }),
				name: "consume.spellSlot",
				value: this.config.consume?.spellSlot
			});

		if (this.activity.activation.type === "legendary" && this._shouldDisplay("consume.action"))
			context.fields.push({
				field: new BooleanField({
					label: game.i18n.format("BF.CONSUMPTION.Type.PromptGeneric", { type: this.activity.activation.label })
					// TODO: Display legendary action count as hint
				}),
				name: "consume.action",
				value: this.config.consume?.action
			});

		if (this._shouldDisplay("consume.resources")) {
			const addResources = (targets, keyPath) => {
				const consume = foundry.utils.getProperty(this.config, keyPath);
				const isArray = foundry.utils.getType(consume) === "Array";
				for (const [index, target] of targets.entries()) {
					const value =
						(isArray && consume.includes(index)) || (!isArray && consume !== false && this.config.consume !== false);
					const { label, hint, notes, warn } = target.getConsumptionLabels(this.config, value);
					if (notes?.length) context.notes.push(...notes);
					context.fields.push({
						field: new BooleanField({ label, hint }),
						name: `${keyPath}.${index}`,
						value,
						warn: value ? warn : false
					});
				}
			};
			addResources(this.activity.consumption.targets, "consume.resources");
			if (context.linkedActivity) addResources(context.linkedActivity.consumption.targets, "cause.resources");
		}

		context.hasConsumption = context.fields.length;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the creation section.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareCreationContext(context, options) {
		context.hasCreation = false;
		if (this.activity.target?.template?.type && this._shouldDisplay("create.measuredTemplate")) {
			context.hasCreation = true;
			context.template = {
				field: new BooleanField({ label: game.i18n.localize("BF.TARGET.Action.PlaceTemplate") }),
				name: "create.measuredTemplate",
				value: this.config.create?.measuredTemplate
			};
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the footer.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareFooterContext(context, options) {
		context.buttons = [
			{
				action: "use",
				cssClass: "heavy-button",
				icon: this.options.button.icon ?? `fa-solid fa-${this.activity.isSpell ? "magic" : "fist-raised"}`,
				label: this.options.button.label ?? this.activity.activationLabel,
				type: "button"
			}
		];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the scaling section.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareScalingContext(context, options) {
		context.hasScaling = true;
		context.notes = [];
		if (!this._shouldDisplay("scaling")) {
			context.hasScaling = false;
			return context;
		}

		const scale = (context.linkedActivity ?? this.activity).consumption.scale;
		const rollData = (context.linkedActivity ?? this.activity).getRollData({ deterministic: true });

		if (this.activity.spellSlotScaling && context.linkedActivity && this.config.scaling !== false) {
			const max = simplifyBonus(scale.max, rollData);
			const minimumCircle = context.linkedActivity.system.spell?.circle ?? this.item.system.circle.base ?? 1;
			const maximumCircle = scale.allowed ? (scale.max ? minimumCircle + max - 1 : Infinity) : minimumCircle;
			const spellSlotOptions = Object.entries(CONFIG.BlackFlag.spellCircles())
				.map(([circle, label]) => {
					if (Number(circle) < minimumCircle || Number(circle) > maximumCircle) return null;
					return { value: `circle-${circle}`, label };
				})
				.filter(_ => _);
			context.spellSlots = {
				field: new StringField({ label: game.i18n.localize("BF.Spell.Circle.Label") }),
				name: "spell.slot",
				value: this.config.spell?.slot,
				options: spellSlotOptions
			};
		} else if (this.activity.spellSlotScaling && this.config.scaling !== false) {
			const spellcasting = this.actor.system.spellcasting;
			const minimumCircle = this.item.system.circle.base ?? 1;
			const maximumCircle = spellcasting.maxCircle;

			const consumeSlot = this.config.consume === true || this.config.consume?.spellSlot;
			let spellSlotValue =
				spellcasting.slots[this.config.spell?.slot]?.value || !consumeSlot ? this.config.spell.slot : null;
			if (!consumeSlot) spellSlotValue = this.config.spell?.slot;
			const spellSlotOptions = Object.entries(spellcasting.slots)
				.map(([value, slot]) => {
					if (
						slot.circle < minimumCircle ||
						(!slot.max && slot.type !== "leveled") ||
						(slot.type === "leveled" && slot.circle > maximumCircle)
					)
						return null;
					const label = game.i18n.format("BF.CONSUMPTION.Type.SpellSlots.Available", {
						slot: slot.label,
						available: numberFormat(slot.value)
					});
					const disabled = slot.value === 0 && consumeSlot;
					if (!disabled && !spellSlotValue) spellSlotValue = value;
					return { value, label, disabled, selected: spellSlotValue === value };
				})
				.filter(_ => _);

			context.spellSlots = {
				field: new StringField({ label: game.i18n.localize("BF.Spell.Circle.Label") }),
				name: "spell.slot",
				value: spellSlotValue,
				options: spellSlotOptions
			};

			if (!spellSlotOptions.some(o => !o.disabled))
				context.notes.push({
					type: "warn",
					message: game.i18n.format("BF.ACTIVATION.Warning.NoSlotsLeft", {
						name: this.item.name
					})
				});
		} else if (scale.allowed && this.config.scaling !== false) {
			const max = scale.max ? simplifyBonus(scale.max, rollData) : Infinity;
			context.scaling = {
				field: new NumberField({
					min: 1,
					max: Math.max(1, max),
					label: game.i18n.localize("BF.Consumption.Scaling.Value")
				}),
				name: "scalingValue",
				// Config stores the scaling increase, but scaling value (increase + 1) is easier to understand in the UI
				value: Math.clamp((this.config.scaling ?? 0) + 1, 1, max),
				max,
				showRange: max <= 20
			};
		} else {
			context.hasScaling = false;
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether a particular element should be displayed based on the `display` options.
	 * @param {string} section - Key path describing the section to be displayed.
	 * @returns {boolean}
	 */
	_shouldDisplay(section) {
		const display = this.options.display;
		if (foundry.utils.hasProperty(display, section)) return foundry.utils.getProperty(display, section);
		const [group] = section.split(".");
		if (group !== section && group in display) return display[group];
		return this.options.display.all ?? true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle form submission.
	 * @this {ActivityActivationDialog}
	 * @param {SubmitEvent} event - Triggering submit event.
	 * @param {HTMLFormElement} form - The form that was submitted.
	 * @param {FormDataExtended} formData - Data from the submitted form.
	 */
	static async #onSubmitForm(event, form, formData) {
		const submitData = this._prepareSubmitData(event, formData);
		await this._processSubmitData(event, submitData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking the use button.
	 * @this {ActivityActivationDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #onUse(event, target) {
		const formData = new FormDataExtended(this.element.querySelector("form"));
		const submitData = this._prepareSubmitData(event, formData);
		foundry.utils.mergeObject(this.#config, submitData);
		this.#used = true;
		this.close();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any pre-processing of the form data to prepare it for updating.
	 * @param {SubmitEvent} event - Triggering submit event.
	 * @param {FormDataExtended} formData - Data from the submitted form.
	 * @returns {object}
	 */
	_prepareSubmitData(event, formData) {
		const submitData = foundry.utils.expandObject(formData.object);
		if (foundry.utils.hasProperty(submitData, "spell.slot")) {
			const circle = this.actor.system.spellcasting?.slots?.[submitData.spell.slot]?.circle ?? 0;
			submitData.scaling = Math.max(0, circle - this.item.system.circle.base);
		} else if ("scalingValue" in submitData) {
			submitData.scaling = submitData.scalingValue - 1;
			delete submitData.scalingValue;
		}
		for (const key of ["consume", "cause"]) {
			if (foundry.utils.getType(submitData[key]?.resources) === "Object") {
				submitData[key].resources = filteredKeys(submitData[key].resources).map(i => Number(i));
			}
		}
		return submitData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle updating the usage configuration based on processed submit data.
	 * @param {SubmitEvent} event - Triggering submit event.
	 * @param {object} submitData - Prepared object for updating.
	 */
	async _processSubmitData(event, submitData) {
		foundry.utils.mergeObject(this.#config, submitData);
		this.render();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the activity activation dialog.
	 * @param {Activity} activity - Activity to activate.
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activation.
	 * @param {object} options - Additional options for the application.
	 * @returns {Promise<ActivityActivationConfiguration>} - Final configuration object if activated.
	 * @throws error if activity couldn't be activated.
	 */
	static async create(activity, config, options) {
		if (!activity.item.isOwned) throw new Error("Cannot activate an activity that is not owned.");

		return new Promise((resolve, reject) => {
			const dialog = new this({ activity, config, ...options });
			dialog.addEventListener("close", event => {
				if (dialog.used) resolve(dialog.config);
				else reject();
			});
			dialog.render({ force: true });
		});
	}
}

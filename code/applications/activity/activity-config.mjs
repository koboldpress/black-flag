import PseudoDocumentSheet from "../pseudo-document-sheet.mjs";

/**
 * Base configuration application for activities that can be extended by other types to implement custom
 * editing interfaces.
 */
export default class ActivityConfig extends PseudoDocumentSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "activity-config"],
			tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "details" }],
			template: "systems/black-flag/templates/activities/activity-config.hbs",
			width: 540,
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
		return this.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		const type = game.i18n.localize(this.activity.metadata.title);
		return `${game.i18n.format("BF.Activity.Config.Title", { item: this.item.name })}: ${type}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const source = this.activity.toObject();
		const activationOptions = CONFIG.BlackFlag.activationOptions({ chosen: source.activation.type });
		const defaultActivation = activationOptions.get(this.item.system.casting?.type)?.label;

		const context = foundry.utils.mergeObject(
			super.getData(options),
			{
				activity: this.activity,
				system: this.activity.system,
				source,
				default: {
					title: game.i18n.localize(this.activity.constructor.metadata.title),
					icon: this.activity.constructor.metadata.icon
				},
				description: source.description,
				enriched: await TextEditor.enrichHTML(source.description ?? "", {
					relativeTo: this.activity,
					rollData: this.item.getRollData(),
					secrets: true,
					async: true
				}),
				labels: {
					defaultActivation: defaultActivation
						? game.i18n.format("BF.Default.Specific", {
								default: defaultActivation.toLowerCase()
							})
						: null
				},
				activation: {
					options: activationOptions,
					scalar: activationOptions.get(this.activity.activation.type)?.scalar ?? false
				},
				duration: {
					data: this.activity.duration.override ? source.duration : this.activity._inferredSource.duration,
					options: CONFIG.BlackFlag.durationOptions({
						chosen: this.activity.duration.units,
						isSpell: this.activity.isSpell
					})
				},
				range: {
					data: this.activity.target.override ? source.range : this.activity._inferredSource.range
				},
				target: {
					data: this.activity.target.override ? source.target : this.activity._inferredSource.target
				},
				showBaseDamage: Object.hasOwn(this.item.system, "damage")
			},
			{ inplace: false }
		);
		context.CONFIG = CONFIG.BlackFlag;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("[data-action]")) {
			element.addEventListener("click", this._onAction.bind(this));
		}

		for (const element of html.querySelectorAll("img[data-edit]")) {
			element.addEventListener("click", this._onEditIcon.bind(this));
		}

		if (this.activity.duration.canOverride && !this.activity.duration.override) {
			for (const element of html.querySelectorAll(".duration :is(input, select)")) {
				if (element.name === "duration.override") continue;
				element.disabled = true;
			}
		}

		if (this.activity.target.canOverride && !this.activity.target.override) {
			for (const element of html.querySelectorAll(".targeting :is(input, select)")) {
				if (element.name === "target.override") continue;
				element.disabled = true;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a sheet action.
	 * @param {ClickEvent} event - The click event.
	 */
	_onAction(event) {}

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
				if (this.options.submitOnChange) return this._onSubmit(event);
			},
			top: this.position.top + 40,
			left: this.position.left + 10
		});
		return fp.browse();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);

		// TODO: Find a way to move this behavior into DamageListElement & ConsumptionElement
		if (foundry.utils.hasProperty(updates, "system.damage.parts")) {
			updates.system.damage.parts = Object.entries(updates.system.damage.parts ?? {}).reduce((arr, [k, v]) => {
				arr[k] = v;
				return arr;
			}, []);
		}
		if (foundry.utils.hasProperty(updates, "consumption.targets")) {
			updates.consumption.targets = Object.entries(updates.consumption.targets ?? {}).reduce((arr, [k, v]) => {
				arr[k] = v;
				return arr;
			}, []);
		}

		await this.activity.update(updates);
	}
}

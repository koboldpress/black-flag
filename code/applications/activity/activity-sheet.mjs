import PseudoDocumentSheet from "../api/pseudo-document-sheet.mjs";

/**
 * Base sheet for activities.
 */
export default class ActivitySheet extends PseudoDocumentSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["activity"],
		window: {
			icon: "fa-solid fa-gauge"
		},
		actions: {
			addEffect: ActivitySheet.#addEffect,
			deleteEffect: ActivitySheet.#deleteEffect
		},
		position: {
			width: 600
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		tabs: {
			template: "templates/generic/tab-navigation.hbs"
		},
		identity: {
			template: "systems/black-flag/templates/activity/activity-identity.hbs",
			templates: ["systems/black-flag/templates/activity/parts/activity-identity.hbs"]
		},
		activation: {
			template: "systems/black-flag/templates/activity/activity-activation.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-time.hbs",
				"systems/black-flag/templates/activity/parts/activity-targeting.hbs",
				"systems/black-flag/templates/activity/parts/activity-consumption.hbs",
				"systems/black-flag/templates/activity/parts/activity-consumption-part.hbs",
				"systems/black-flag/templates/shared/parts/activity-affects.hbs",
				"systems/black-flag/templates/shared/parts/activity-range.hbs",
				"systems/black-flag/templates/shared/parts/activity-template.hbs",
				"systems/black-flag/templates/shared/uses-config.hbs"
			]
		},
		effect: {
			template: "systems/black-flag/templates/activity/activity-effect.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Key paths to the parts of the submit data stored in arrays that will need special handling on submission.
	 * @type {string[]}
	 */
	static CLEAN_ARRAYS = ["consumption.targets", "damage.parts", "system.effects"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		sheet: "identity",
		activation: "time"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The activity being created or edited.
	 * @type {Activity}
	 */
	get activity() {
		return this.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return this.activity.name;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		return {
			...(await super._prepareContext(options)),
			activity: this.activity,
			fields: this.activity.schema.fields,
			inferred: this.activity._inferredSource,
			source: this.activity.toObject(),
			system: this.activity.system,
			tabs: this._getTabs()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _preparePartContext(partId, context) {
		switch (partId) {
			case "activation":
				return this._prepareActivationContext(context);
			case "effect":
				return this._prepareEffectContext(context);
			case "identity":
				return this._prepareIdentityContext(context);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the activation tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareActivationContext(context) {
		context.tab = context.tabs.activation;

		context.data = {};
		context.disabled = {};
		for (const field of ["duration", "range", "target"]) {
			context.data[field] = this.activity[field].override ? context.source[field] : context.inferred[field];
			context.disabled[field] = this.activity[field].canOverride && !this.activity[field].override;
		}

		const activationOptions = CONFIG.BlackFlag.activationOptions({ chosen: context.source.activation.type });
		const defaultActivation = activationOptions.get(this.item.system.casting?.type)?.label;

		context.activation = {
			options: activationOptions,
			scalar: activationOptions.get(this.activity.activation.type)?.scalar ?? false
		};
		context.durationOptions = CONFIG.BlackFlag.durationOptions({
			chosen: this.activity.duration.units,
			isSpell: this.activity.isSpell
		});
		context.labels = {
			defaultActivation: defaultActivation
				? game.i18n.format("BF.Default.Specific", {
						default: defaultActivation.toLowerCase()
					})
				: null
		};
		context.showBaseDamage = Object.hasOwn(this.item.system, "damage");

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare a specific applied effect if present in the activity data.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {object} effect - Applied effect context being prepared.
	 * @returns {object}
	 * @protected
	 */
	_prepareAppliedEffectContext(context, effect) {
		return effect;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the effect tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareEffectContext(context) {
		context.tab = context.tabs.effect;

		if (context.activity.system.effects) {
			const appliedEffects = new Set(context.activity.system.effects?.map(e => e._id) ?? []);
			context.allEffects = this.item.effects.map(effect => ({
				value: effect.id,
				label: effect.name,
				selected: appliedEffects.has(effect.id)
			}));
			context.appliedEffects = context.activity.system.effects.map((data, index) => {
				const effect = {
					data,
					effect: data.effect,
					fields: this.activity.system.schema.fields.effects.element.fields,
					link: data.effect.toAnchor().outerHTML,
					prefix: `system.effects.${index}.`,
					source: context.source.system.effects[index] ?? data,
					additionalSettings: null
				};
				return this._prepareAppliedEffectContext(context, effect);
			});
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the identity tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareIdentityContext(context) {
		context.tab = context.tabs.identity;
		context.description = await TextEditor.enrichHTML(context.source.description ?? "", {
			relativeTo: this.activity,
			rollData: this.item.getRollData(),
			secrets: true
		});
		context.placeholder = {
			name: game.i18n.localize(this.activity.metadata.title),
			img: this.activity.metadata.icon
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the tab information for the sheet.
	 * @returns {Record<string, Partial<ApplicationTab>>}
	 * @protected
	 */
	_getTabs() {
		return this._markTabs({
			identity: {
				id: "identity",
				group: "sheet",
				icon: "fa-solid fa-tag",
				label: "BF.ACTIVITY.SECTION.Identity"
			},
			activation: {
				id: "activation",
				group: "sheet",
				icon: "fa-solid fa-clapperboard",
				label: "BF.ACTIVITY.SECTION.Activation",
				tabs: {
					time: {
						id: "time",
						group: "activation",
						icon: "fa-solid fa-clock",
						label: "BF.ACTIVITY.SECTION.Time"
					},
					consumption: {
						id: "consumption",
						group: "activation",
						icon: "fa-solid fa-boxes-stacked",
						label: "BF.ACTIVITY.SECTION.Consumption"
					},
					targeting: {
						id: "activation-targeting",
						group: "activation",
						icon: "fa-solid fa-bullseye",
						label: "BF.ACTIVITY.SECTION.Target"
					}
				}
			},
			effect: {
				id: "effect",
				group: "sheet",
				icon: "fa-solid fa-sun",
				label: "BF.ACTIVITY.SECTION.Effect"
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Helper to mark the tabs data structure with the appropriate CSS class if it is active.
	 * @param {Record<string, Partial<ApplicationTab>>} tabs - Tabs definition to modify.
	 * @returns {Record<string, Partial<ApplicationTab>>}
	 * @internal
	 */
	_markTabs(tabs) {
		for (const v of Object.values(tabs)) {
			v.active = this.tabGroups[v.group] === v.id;
			v.cssClass = v.active ? "active" : "";
			if ("tabs" in v) this._markTabs(v.tabs);
		}
		return tabs;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle creating a new active effect and adding it to the applied effects list.
	 * @this {ActivitySheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #addEffect(event, target) {
		if (!this.activity.system.effects) return;
		const effectData = this._addEffectData();
		const [created] = await this.item.createEmbeddedDocuments("ActiveEffect", [effectData]);
		this.activity.update({ "system.effects": [...this.activity.toObject().system.effects, { _id: created.id }] });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The data for a newly created applied effect.
	 * @returns {object}
	 * @protected
	 */
	_addEffectData() {
		return {
			name: this.item.name,
			img: this.item.img,
			origin: this.item.uuid,
			transfer: false
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle deleting an active effect and removing it from the applied effects list.
	 * @this {ActivitySheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #deleteEffect(event, target) {
		if (!this.activity.system.effects) return;
		const effectId = target.closest("[data-effect-id]")?.dataset.effectId;
		const result = await this.item.effects.get(effectId)?.deleteDialog();
		if (result instanceof ActiveEffect) {
			const effects = this.activity.toObject().system.effects.filter(e => e._id !== effectId);
			this.activity.update({ "system.effects": effects });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		for (const keyPath of this.constructor.CLEAN_ARRAYS) {
			const data = foundry.utils.getProperty(submitData, keyPath);
			if (data) foundry.utils.setProperty(submitData, keyPath, Object.values(data));
		}
		if (foundry.utils.hasProperty(submitData, "appliedEffects")) {
			const effects = submitData.effects ?? this.activity.toObject().system.effects;
			submitData.system ??= {};
			submitData.system.effects = effects.filter(e => submitData.appliedEffects.includes(e._id));
			for (const _id of submitData.appliedEffects) {
				if (submitData.system.effects.find(e => e._id === _id)) continue;
				submitData.system.effects.push({ _id });
			}
		}
		return submitData;
	}
}

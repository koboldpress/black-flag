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
			systemFields: this.activity.system.schema.fields,
			tabs: this._getTabs()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = { ...(await super._preparePartContext(partId, context, options)) };
		switch (partId) {
			case "activation":
				return this._prepareActivationContext(context, options);
			case "effect":
				return this._prepareEffectContext(context, options);
			case "identity":
				return this._prepareIdentityContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the activation tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareActivationContext(context, options) {
		context.tab = context.tabs.activation;

		context.data = {};
		context.disabled = {};
		for (const field of ["activation", "duration", "range", "target"]) {
			context.data[field] = this.activity[field].override ? context.source[field] : context.inferred[field];
			context.disabled[field] = this.activity[field].canOverride && !this.activity[field].override;
		}

		const activationOptions = CONFIG.BlackFlag.activationOptions({ chosen: context.data.activation.type });
		const defaultActivation = activationOptions.get(this.item.system.casting?.type)?.label;
		context.activation = {
			options: activationOptions.formOptions(),
			scalar: activationOptions.get(context.data.activation.type)?.scalar ?? false
		};
		if (defaultActivation)
			context.activation.options.unshift(
				{ value: "", label: game.i18n.format("BF.Default.Specific", { default: defaultActivation.toLowerCase() }) },
				{ rule: true }
			);

		context.consumptionTypeOptions = Array.from(this.activity.validConsumptionTypes).map(value => ({
			value,
			label: game.i18n.localize(CONFIG.BlackFlag.consumptionTypes[value].label)
		}));

		context.durationOptions = CONFIG.BlackFlag.durationOptions({
			chosen: this.activity.duration.units,
			isSpell: this.activity.isSpell
		});

		context.rangeOptions = [
			{ value: "", label: "" },
			{ rule: true },
			...CONFIG.BlackFlag.rangeTypes.localizedOptions,
			...CONFIG.BlackFlag.distanceUnits.localizedOptions.map(o => ({
				...o,
				group: game.i18n.localize("BF.Distance.Label")
			}))
		];

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
	 * Prepare a specific damage part if present in the activity data.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {object} part - Damage part context being prepared.
	 * @returns {object}
	 * @protected
	 */
	_prepareDamagePartContext(context, part) {
		return part;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the effect tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareEffectContext(context, options) {
		context.tab = context.tabs.effect;

		if (context.activity.system.effects) {
			const appliedEffects = new Set(context.activity.system.effects?.map(e => e?._id) ?? []);
			context.allEffects = this.item.effects.map(effect => ({
				value: effect.id,
				label: effect.name,
				selected: appliedEffects.has(effect.id)
			}));
			context.appliedEffects = context.activity.system.effects
				.map((data, index) => {
					if (!data.effect) return null;
					const effect = {
						data,
						collapsed: this.expandedSections.get(`effect.${data._id}`) ? "" : "collapsed",
						effect: data.effect,
						fields: this.activity.system.schema.fields.effects.element.fields,
						link: data.effect.toAnchor().outerHTML,
						prefix: `system.effects.${index}.`,
						source: context.source.system.effects[index] ?? data,
						additionalSettings: null
					};
					return this._prepareAppliedEffectContext(context, effect);
				})
				.filter(_ => _);
		}

		context.denominationOptions = [
			{ value: "", label: "" },
			...CONFIG.BlackFlag.dieSteps.map(value => ({ value, label: `d${value}` }))
		];
		const damageTypes = Object.entries(CONFIG.BlackFlag.damageTypes.localized).map(([value, label]) => ({
			value,
			label
		}));
		if (context.activity.system.damage?.parts) {
			const scalingOptions = [
				{ value: "", label: game.i18n.localize("BF.DAMAGE.Scaling.Mode.None") },
				...Object.entries(CONFIG.BlackFlag.damageScalingModes).map(([value, config]) => ({
					value,
					label: game.i18n.localize(config.label)
				}))
			];
			let indexOffset = 0;
			context.damageParts = context.activity.system.damage.parts.map((data, index) => {
				if (data.base) indexOffset--;
				const part = {
					data,
					fields: this.activity.system.schema.fields.damage.fields.parts.element.fields,
					index: index + indexOffset,
					prefix: `$.${index + indexOffset}.`,
					source: context.source.system.damage.parts[index + indexOffset] ?? data,
					canScale: this.activity.canScaleDamage,
					scalingOptions,
					typeOptions: [
						{ value: "", label: "" },
						...damageTypes,
						{ rule: true },
						{ value: "max", label: game.i18n.localize("BF.DAMAGE.Type.Max") },
						{ value: "variable", label: game.i18n.localize("BF.DAMAGE.Type.Variable") }
					],
					variableTypeOptions: damageTypes.map(({ value, label }) => ({
						value,
						label,
						selected: data.additionalTypes.has(value)
					}))
				};
				return this._prepareDamagePartContext(context, part);
			});
		}
		context.showBaseDamage = Object.hasOwn(this.item.system, "damage");

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the identity tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareIdentityContext(context, options) {
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
	/*           Form Submission           */
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

import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Dialog for configuring an individual ability.
 */
export default class AbilityConfig extends BaseConfigSheet {
	constructor(options) {
		super(options);
		this.selectedId = this.options.selectedId ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["ability", "form-list"],
		position: {
			width: 450
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		selector: {
			template: "systems/black-flag/templates/actor/config/id-selector.hbs"
		},
		config: {
			classes: ["contents"],
			template: "systems/black-flag/templates/actor/config/ability-config.hbs"
		},
		modifiers: {
			classes: ["contents"],
			template: "systems/black-flag/templates/actor/config/modifier-section.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ability being modified by this app.
	 * @type {string|null}
	 */
	selectedId;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.Ability.Label[other]") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "config":
				return this._prepareConfigContext(context, options);
			case "selector":
				return this._prepareSelectorContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the config section.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareConfigContext(context, options) {
		context.ability = this.selectedId
			? {
					data:
						context.system.source.abilities[this.selectedId] ?? context.system.data.abilities[this.selectedId] ?? {},
					fields: context.system.fields.abilities.model.fields,
					id: this.selectedId
				}
			: null;
		context.canSetValue = !!game.settings.get("black-flag", "abilitySelectionManual");
		context.proficiencyOptions = [
			{ value: 0, label: game.i18n.localize("BF.Proficiency.Level.None") },
			{ value: 1, label: game.i18n.localize("BF.Proficiency.Level.Proficient") }
		];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the ID selector section.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareSelectorContext(context, options) {
		context.options = [{ label: "", value: "" }, ...CONFIG.BlackFlag.abilities.localizedOptions];
		context.selected = this.selectedId;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareModifiers() {
		let checkModifiers;
		let saveModifiers;
		let global;
		if (this.selectedId) {
			checkModifiers = this.getModifiers([
				{ k: "type", v: "ability-check" },
				{ k: "ability", v: this.selectedId }
			]);
			saveModifiers = this.getModifiers([
				{ k: "type", v: "ability-save" },
				{ k: "ability", v: this.selectedId }
			]);
			global = false;
		} else {
			const filter = modifier => !modifier.filter.some(f => f.k === "ability");
			checkModifiers = this.getModifiers([{ k: "type", v: "ability-check" }], [], filter);
			saveModifiers = this.getModifiers([{ k: "type", v: "ability-save" }], [], filter);
			global = true;
		}
		return [
			{
				category: "check",
				type: "bonus",
				label: "BF.CHECK.Label[one]",
				global,
				showProficiency: true,
				modifiers: checkModifiers.filter(m => m.type === "bonus")
			},
			{
				category: "check",
				type: "min",
				label: "BF.CHECK.Label[one]",
				showProficiency: true,
				modifiers: checkModifiers.filter(m => m.type === "min")
			},
			{
				category: "check",
				type: "note",
				label: "BF.CHECK.Label[one]",
				modifiers: checkModifiers.filter(m => m.type === "note")
			},
			{
				category: "save",
				type: "bonus",
				label: "BF.SavingThrow.LabelShort[one]",
				showProficiency: true,
				modifiers: saveModifiers.filter(m => m.type === "bonus")
			},
			{
				category: "save",
				type: "min",
				label: "BF.SavingThrow.LabelShort[one]",
				showProficiency: true,
				modifiers: saveModifiers.filter(m => m.type === "min")
			},
			{
				category: "save",
				type: "note",
				label: "BF.SavingThrow.LabelShort[one]",
				modifiers: saveModifiers.filter(m => m.type === "note")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		if (event.target.name === "selectedId") {
			this.selectedId = event.target.value;
			this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: `ability-${category}` }] };
		if (this.selectedId) data.filter.push({ k: "ability", v: this.selectedId });
		return data;
	}
}

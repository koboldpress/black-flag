import BaseSelectorConfigSheet from "../api/base-selector-config-sheet.mjs";

/**
 * Dialog for configuring an individual ability.
 */
export default class AbilityConfig extends BaseSelectorConfigSheet {
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
		...super.PARTS,
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

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.Ability.Label[other]") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "config":
				return this._prepareConfigContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareSelectorContext(context, options) {
		context = await super._prepareSelectorContext(context, options);
		context.options = [...context.options, ...CONFIG.BlackFlag.abilities.localizedOptions];
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
	async _prepareConfigContext(context, options) {
		context.ability = this.selectedId
			? {
					data:
						context.system.source.abilities[this.selectedId] ?? context.system.data.abilities[this.selectedId] ?? {},
					fields: context.system.fields.abilities.model.fields,
					id: this.selectedId,
					keyPath: `system.abilities.${this.selectedId}`
				}
			: null;
		context.canSetValue = !!game.settings.get("black-flag", "abilitySelectionManual") || game.user.isGM;
		context.proficiencyOptions = context.proficiencyOptions.filter(o => [0, 1].includes(o.value));
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

	/** @override */
	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: `ability-${category}` }] };
		if (this.selectedId) data.filter.push({ k: "ability", v: this.selectedId });
		return data;
	}
}

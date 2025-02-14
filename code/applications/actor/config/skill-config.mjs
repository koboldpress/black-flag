import BaseSelectorConfigSheet from "../api/base-selector-config-sheet.mjs";

/**
 * Dialog for configuring skill proficiencies.
 */
export default class SkillConfig extends BaseSelectorConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["skill", "form-list"],
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
			template: "systems/black-flag/templates/actor/config/skill-config.hbs"
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
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.Skill.Label[other]") });
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
		context.options = [...context.options, ...CONFIG.BlackFlag.skills.localizedOptions];
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
		context.skill = this.selectedId
			? {
					data:
						context.system.source.proficiencies.skills[this.selectedId] ??
						context.system.data.proficiencies.skills[this.selectedId] ??
						{},
					fields: context.system.fields.proficiencies.fields.skills.model.fields,
					id: this.selectedId,
					keyPath: `system.proficiencies.skills.${this.selectedId}`
				}
			: null;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareModifiers() {
		let checkModifiers;
		let passiveModifiers;
		let global;
		if (this.selectedId) {
			checkModifiers = this.getModifiers([
				{ k: "type", v: "skill-check" },
				{ k: "skill", v: this.selectedId }
			]);
			passiveModifiers = this.getModifiers([
				{ k: "type", v: "skill-passive" },
				{ k: "skill", v: this.selectedId }
			]);
			global = false;
		} else {
			const filter = modifier => !modifier.filter.some(f => f.k === "skill");
			checkModifiers = this.getModifiers([{ k: "type", v: "skill-check" }], [], filter);
			passiveModifiers = this.getModifiers([{ k: "type", v: "skill-passive" }], [], filter);
			global = true;
		}
		return [
			{
				category: "check",
				type: "bonus",
				label: "BF.CHECK.Label[one]",
				global,
				showProficiency: global,
				modifiers: checkModifiers.filter(m => m.type === "bonus")
			},
			{
				category: "passive",
				type: "bonus",
				label: "BF.Skill.Passive.LabelGeneric",
				global,
				showProficiency: global,
				modifiers: passiveModifiers
			},
			{
				category: "check",
				type: "min",
				label: "BF.CHECK.Label[one]",
				global,
				showProficiency: global,
				modifiers: checkModifiers.filter(m => m.type === "min")
			},
			{
				category: "check",
				type: "note",
				label: "BF.CHECK.Label[one]",
				global,
				modifiers: checkModifiers.filter(m => m.type === "note")
			}
		];
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Action Handlers                          */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @override */
	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: `skill-${category}` }] };
		if (this.selectedId) data.filter.push({ k: "skill", v: this.selectedId });
		return data;
	}
}

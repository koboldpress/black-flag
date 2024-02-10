import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for spellcasting.
 */
export default class SpellcastingConfig extends AdvancementConfig {
	constructor(...args) {
		super(...args);

		this.formulaEditors = Object.keys(this.constructor.FORMULAS).reduce((set, name) => {
			if ( this.advancement.configuration[name].displayFormula ) set.add(name);
			return set;
		}, new Set());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "spellcasting"],
			template: "systems/black-flag/templates/advancement/spellcasting-config.hbs",
			width: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Formulas that can be configured.
	 * TODO: Fetch this information from the data model itself
	 */
	static FORMULAS = Object.freeze({
		cantrips: { label: "BF.Spellcasting.CantripsKnown.Label", hint: "BF.Spellcasting.CantripsKnown.Hint" },
		rituals: { label: "BF.Spellcasting.RitualsKnown.Label", hint: "BF.Spellcasting.RitualsKnown.Hint" },
		spells: { label: "BF.Spellcasting.SpellsKnown.Label", hint: "BF.Spellcasting.SpellsKnown.Hint" }
	});

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Formula editors that should currently be displayed.
	 * @type {Set<string>}
	 */
	formulaEditors;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);

		context.displayType = Object.keys(CONFIG.BlackFlag.spellcastingTypes).length > 1;
		context.progressionOptions = CONFIG.BlackFlag.spellcastingTypes[context.configuration.type]?.progression;
		context.formulas = Object.entries(this.constructor.FORMULAS).reduce((obj, [name, localization]) => {
			const config = this.advancement.configuration[name];
			obj[name] = {
				...localization,
				displayFormula: this.formulaEditors.has(name),
				formula: config.formula,
				scaleValue: config.scaleValue
			};
			return obj;
		}, {});
		if ( context.configuration.spells.mode !== "limited" ) delete context.formulas.spells;
		context.showClassRestriction = false;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		// Activate formula buttons
		for ( const element of html.querySelectorAll('[data-action="formula"]') ) {
			element.addEventListener("click", this._onFormulaAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle formula actions.
	 * @param {ClickEvent} event - Triggering click event.
	 */
	_onFormulaAction(event) {
		const { subAction } = event.currentTarget.dataset;
		const name = event.target.closest("[data-name]").dataset.name;
		switch (subAction) {
			case "customize":
			case "use-formula":
				this.formulaEditors.add(name);
				this.render();
				break;
			case "use-scale-value":
				this._createScaleValue(name);
				break;
			case "view-scale-value":
				this.advancement.configuration[name].scaleValue.sheet.render(true);
				break;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a scale value for a specific formula and add a reference to the formula.
	 * @param {string} name - Formula name for which this scale value should be created.
	 */
	async _createScaleValue(name) {
		const title = game.i18n.localize(this.constructor.FORMULAS[name].label);
		const scaleData = { type: "scaleValue", title, identifier: title.slugify(), "configuration.type": "number" };
		const reference = `@scale.ID.${scaleData.identifier}`;
		const config = this.advancement.configuration[name];
		const newFormula = config.formula ? `${reference} + ${config.formula}` : reference;
		await this.advancement.update({[`configuration.${name}.formula`]: newFormula});
		await this.item.createEmbeddedDocuments("Advancement", [scaleData], { renderSheet: true });
		this.render();
	}
}

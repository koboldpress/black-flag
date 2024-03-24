import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for spellcasting.
 */
export default class SpellcastingConfig extends AdvancementConfig {

	/** @inheritDoc */
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
	static KNOWN = Object.freeze({
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

	/** @inheritDoc */
	getData(options) {
		const context = super.getData(options);

		context.defaultAbility = game.i18n.format("BF.Default.Specific", {
			default: game.i18n.localize("BF.Advancement.KeyAbility.Title").toLowerCase()
		});
		context.displayType = Object.keys(CONFIG.BlackFlag.spellcastingTypes).length > 1;
		context.progressionOptions = CONFIG.BlackFlag.spellcastingTypes[context.configuration.type]?.progression;
		context.known = Object.entries(this.constructor.KNOWN).reduce((obj, [name, localization]) => {
			const config = this.advancement.configuration[name];
			obj[name] = {
				...localization,
				anchor: config.scaleValue?.toAnchor().outerHTML,
				scaleValue: config.scaleValue
			};
			return obj;
		}, {});
		if ( context.configuration.spells.mode !== "limited" ) delete context.known.spells;
		context.showClassRestriction = false;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		// Activate formula buttons
		for ( const element of html.querySelectorAll('[data-action="known"]') ) {
			element.addEventListener("click", this._onKnownAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle known scale value actions.
	 * @param {ClickEvent} event - Triggering click event.
	 */
	async _onKnownAction(event) {
		const { subAction } = event.currentTarget.dataset;
		const name = event.target.closest("[data-name]").dataset.name;
		switch ( subAction ) {
			case "create":
				if ( this.advancement.configuration[name].scaleValue ) return;
				const title = game.i18n.localize(this.constructor.KNOWN[name].label);
				const scaleData = { type: "scaleValue", title, identifier: `${name}-known`, configuration: { type: "number" } };
				const [scale] = await this.item.createEmbeddedDocuments("Advancement", [scaleData], { renderSheet: true });
				await this.advancement.update({[`configuration.${name}.scale`]: scale.id});
				break;
			case "delete":
				await this.advancement.configuration[name].scaleValue?.deleteDialog();
				break;
		}
		this.render();
	}
}

import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for spellcasting.
 */
export default class SpellcastingConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["spellcasting", "form-list"],
		actions: {
			addScale: SpellcastingConfig.#onAddScale,
			openScale: SpellcastingConfig.#onOpenScale
		},
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		details: {
			template: "systems/black-flag/templates/advancement/spellcasting-config-details.hbs"
		},
		learning: {
			template: "systems/black-flag/templates/advancement/spellcasting-config-learning.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Formulas that can be configured.
	 * TODO: Fetch this information from the data model itself
	 */
	static KNOWN = Object.freeze({
		cantrips: { label: "BF.Spellcasting.FIELDS.cantrips.label", hint: "BF.Spellcasting.FIELDS.cantrips.hint" },
		rituals: { label: "BF.Spellcasting.FIELDS.rituals.label", hint: "BF.Spellcasting.FIELDS.rituals.hint" },
		spells: { label: "BF.Spellcasting.FIELDS.spells.label", hint: "BF.Spellcasting.FIELDS.spells.hint" }
	});

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		await super._preparePartContext(partId, context, options);
		context.showClassRestriction = false;
		if (partId === "details") return await this._prepareDetailsContext(context, options);
		if (partId === "learning") return await this._prepareLearningContext(context, options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the config section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareDetailsContext(context, options) {
		const typeConfig = CONFIG.BlackFlag.spellcastingTypes[this.advancement.configuration.type];
		context.displayType = Object.keys(CONFIG.BlackFlag.spellcastingTypes).length > 1;
		context.progressionOptions = typeConfig?.progression;
		context.slots = {
			scaleValue: this.advancement.configuration.slots.scaleValue,
			display: this.advancement.configuration.type === "pact"
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the scale section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareLearningContext(context, options) {
		const typeConfig = CONFIG.BlackFlag.spellcastingTypes[this.advancement.configuration.type];
		if (this.advancement.configuration.spells.mode) {
			context.known = Object.entries(this.constructor.KNOWN).reduce((obj, [name, localization]) => {
				const config = this.advancement.configuration[name];
				const anchor = config.scaleValue?.toAnchor();
				if (anchor) anchor.dataset.action = "openScale";
				obj[name] = {
					...localization,
					anchor: anchor?.outerHTML,
					scaleValue: config.scaleValue
				};
				return obj;
			}, {});
			if (this.advancement.configuration.spells.mode !== "limited") delete context.known.spells;
		}

		context.learningModes =
			!typeConfig || typeConfig.learningModes === false
				? null
				: Object.entries(CONFIG.BlackFlag.spellLearningModes).reduce((obj, [k, v]) => {
						if (!typeConfig.learningModes || typeConfig.learningModes.has(k)) obj[k] = v;
						return obj;
					}, {});

		const schools = this.advancement.configuration.spells.schools;
		if (schools.size)
			context.schoolLabel = game.i18n.getListFormatter({ type: "unit" }).format(
				Array.from(schools)
					.map(s => CONFIG.BlackFlag.spellSchools.localized[s])
					.filter(s => s)
			);
		else context.schoolLabel = game.i18n.localize("BF.Spellcasting.Learning.Schools.NoRestriction");

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding a spellcasting value.
	 * @this {AdvancementConfig}
	 * @param {Event} event - The originating click event.
	 * @param {HTMLElement} target - The button that was clicked.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 */
	static async #onAddScale(event, target) {
		const name = target.closest("[data-name]").dataset.name;
		if (this.advancement.configuration[name].scaleValue) return;
		const title = game.i18n.localize(
			name === "slots" ? "BF.Spellcasting.FIELDS.slots.label" : this.constructor.KNOWN[name].label
		);
		const scaleData = { type: "spellcastingValue", title, identifier: `${name}-known` };
		const [scale] = await this.item.createEmbeddedDocuments("Advancement", [scaleData]);
		await this.advancement.update({ [`configuration.${name}.scale`]: scale.id });
		scale.sheet.render({ force: true });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle opening a spellcasting value sheet.
	 * @this {AdvancementConfig}
	 * @param {Event} event - The originating click event.
	 * @param {HTMLElement} target - The button that was clicked.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 */
	static async #onOpenScale(event, target) {
		const advancement = await fromUuid(target.dataset.uuid);
		advancement?.sheet.render({ force: true });
	}
}

import { filteredKeys } from "../../utils/object.mjs";
import * as Trait from "../../utils/trait.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for traits.
 */
export default class TraitConfig extends AdvancementConfig {
	constructor(...args) {
		super(...args);
		this.selected = this.config.choices.length && !this.config.grants.size ? 0 : -1;
		this.trait = this.types.first() ?? "skills";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["trait"],
		columns: 2,
		actions: {
			addChoice: TraitConfig.#onAddChoice,
			deleteChoice: TraitConfig.#onDeleteChoice
		},
		position: {
			width: 650
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/trait-config-details.hbs"
		},
		guaranteed: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/trait-config-guaranteed.hbs"
		},
		choices: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/trait-config-choices.hbs"
		},
		options: {
			classes: ["right-column"],
			template: "systems/black-flag/templates/advancement/trait-config-options.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Shortcut to the configuration data on the advancement.
	 * @type {TraitConfigurationData}
	 */
	get config() {
		return this.advancement.configuration;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Index of the selected configuration, `-1` means `grants` array, any other number is equal
	 * to an index in `choices` array.
	 * @type {number}
	 */
	selected;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Trait type to display in the selector interface.
	 * @type {string}
	 */
	trait;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of trait types for the current selected configuration.
	 * @type {Set<string>}
	 */
	get types() {
		const pool = this.selected === -1 ? this.config.grants : this.config.choices[this.selected].pool;
		return new Set(Array.from(pool).map(k => k.split(":").shift()));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		await super._preparePartContext(partId, context, options);

		context.choices = this.config.choices.map((choice, index) => ({
			label: Trait.choiceLabel(choice, { only: true }).capitalize() || "—",
			data: choice,
			selected: this.selected === index
		}));
		context.grants = {
			label: Trait.localizedList(this.config.grants) || "—",
			data: this.config.grants,
			selected: this.selected === -1
		};
		context.selectedIndex = this.selected;

		if (partId === "config") return await this._prepareConfigContext(context, options);
		if (partId === "guaranteed") return await this._prepareGuaranteedContext(context, options);
		if (partId === "choices") return await this._prepareChoicesContext(context, options);
		if (partId === "options") return await this._prepareOptionsContext(context, options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the config section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareConfigContext(context, options) {
		const traitConfig = CONFIG.BlackFlag.traits[this.advancement.bestGuessTrait()];
		if (traitConfig) {
			context.default.title = game.i18n.localize(traitConfig.labels.title);
			context.default.icon = traitConfig.icon;
		}
		context.default.hint = Trait.localizedList(this.config.grants, this.config.choices, {
			choiceMode: this.config.choiceMode
		});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the guaranteed section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareGuaranteedContext(context, options) {
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the choices section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareChoicesContext(context, options) {
		context.count = context.choices[this.selected]?.data.count;
		context.choiceModeOptions = [
			{ value: "inclusive", label: game.i18n.localize("BF.Advancement.Trait.Choice.Mode.Inclusive.Label") },
			{ value: "exclusive", label: game.i18n.localize("BF.Advancement.Trait.Choice.Mode.Exclusive.Label") }
		];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the options section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareOptionsContext(context, options) {
		const chosen = this.selected === -1 ? context.grants.data : context.choices[this.selected].data.pool;
		context.choiceOptions = Trait.choices(this.trait, { chosen, prefixed: true, any: this.selected !== -1 });
		context.selectedTraitHeader = `${CONFIG.BlackFlag.traits[this.trait].labels.localization}[other]`;
		context.selectedTrait = this.trait;
		context.validTraitTypes = Object.entries(CONFIG.BlackFlag.traits).reduce((obj, [key, config]) => {
			if (this.config.mode === "default" || (config.type === "proficiency" && config.expertise))
				obj[key] = config.labels.title;
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);

		// Handle selecting & disabling category children when a category is selected
		for (const checkbox of this.element.querySelectorAll(".trait-options input:checked")) {
			const toCheck = checkbox.name.endsWith("*")
				? checkbox.closest("ol").querySelectorAll(`input:not([name="${checkbox.name}"])`)
				: checkbox.closest("li").querySelector("ol")?.querySelectorAll("input");
			toCheck?.forEach(i => (i.checked = i.disabled = true));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding a choice to the list.
	 * @this {AdvancementConfig}
	 * @param {Event} event - The originating click event.
	 * @param {HTMLElement} target - The button that was clicked.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 */
	static async #onAddChoice(event, target) {
		this.config.choices.push({ count: 1 });
		this.selected = this.config.choices.length - 1;
		this.config.grants = Array.from(this.advancement.configuration.grants);
		this.config.choices.forEach(c => {
			if (!c.pool) return;
			c.pool = Array.from(c.pool);
		});
		await this.advancement.update({ configuration: this.config });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle deleting a choice to the list.
	 * @this {AdvancementConfig}
	 * @param {Event} event - The originating click event.
	 * @param {HTMLElement} target - The button that was clicked.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 */
	static async #onDeleteChoice(event, target) {
		const input = target.closest("li").querySelector("[name='selectedIndex']");
		const selectedIndex = Number(input.value);
		this.config.choices.splice(selectedIndex, 1);
		if (selectedIndex <= this.selected) this.selected -= 1;
		this.config.grants = Array.from(this.advancement.configuration.grants);
		this.config.choices.forEach(c => {
			if (!c.pool) return;
			c.pool = Array.from(c.pool);
		});
		await this.advancement.update({ configuration: this.config });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onChangeForm(formConfig, event) {
		// Display new set of trait choices
		if (event.target.name === "selectedTrait") {
			this.trait = event.target.value;
			return this.render();
		}

		// Change selected configuration set
		if (event.target.name === "selectedIndex") {
			this.selected = Number(event.target.value ?? -1);
			const types = this.types;
			if (types.size && !types.has(this.trait)) this.trait = types.first();
			return this.render();
		}

		// If mode is changed from default to one of the others change selected type if current type is not valid
		if (
			event.target.name === "configuration.mode" &&
			event.target.value !== "default" &&
			this.config.mode === "default"
		) {
			const validTraitTypes = filteredKeys(CONFIG.BlackFlag.traits, c => c.type === "proficiency" && c.expertise);
			if (!validTraitTypes.includes(this.trait)) this.trait = validTraitTypes[0];
		}

		super._onChangeForm(formConfig, event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareConfigurationUpdate(configuration) {
		const choicesCollection = foundry.utils.deepClone(this.config.choices);

		if (configuration.checked) {
			const prefix = `${this.trait}:`;
			const filteredSelected = filteredKeys(configuration.checked);

			// Update grants
			if (this.selected === -1) {
				const filteredPrevious = this.config.grants.filter(k => !k.startsWith(prefix));
				configuration.grants = [...filteredPrevious, ...filteredSelected];
			}

			// Update current choice pool
			else {
				const current = choicesCollection[this.selected];
				const filteredPrevious = current.pool.filter(k => !k.startsWith(prefix));
				current.pool = [...filteredPrevious, ...filteredSelected];
			}
			delete configuration.checked;
		}

		if (configuration.count) {
			choicesCollection[this.selected].count = configuration.count;
			delete configuration.count;
		}

		// TODO: Remove when https://github.com/foundryvtt/foundryvtt/issues/7706 is resolved
		choicesCollection.forEach(c => {
			if (!c.pool) return;
			c.pool = Array.from(c.pool);
		});
		configuration.choices = choicesCollection;
		configuration.grants ??= Array.from(this.config.grants);

		// If one of the expertise modes is selected, filter out any traits that are not of a valid type
		if ((configuration.mode ?? this.config.mode) !== "default") {
			const validTraitTypes = filteredKeys(CONFIG.BlackFlag.traits, c => c.type === "proficiency" && c.expertise);
			configuration.grants = configuration.grants.filter(k => validTraitTypes.some(t => k.startsWith(t)));
			configuration.choices.forEach(c => (c.pool = c.pool.filter(k => validTraitTypes.some(t => k.startsWith(t)))));
		}

		return configuration;
	}
}

import { filteredKeys } from "../../utils/object.mjs";
import * as Trait from "../../utils/trait.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for traits.
 */
export default class TraitConfig extends AdvancementConfig {
	constructor(...args) {
		super(...args);
		this.selected = (this.config.choices.length && !this.config.grants.size) ? 0 : -1;
		this.trait = this.types.first() ?? "skills";
	}

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

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "two-column", "trait"],
			template: "systems/black-flag/templates/advancement/trait-config.hbs",
			width: 650
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.grants = {
			label: Trait.localizedList(this.config.grants) || "—",
			data: this.config.grants,
			selected: this.selected === -1
		};
		context.choices = this.config.choices.map((choice, index) => ({
			label: Trait.choiceLabel(choice, { only: true }).capitalize() || "—",
			data: choice,
			selected: this.selected === index
		}));
		const chosen = (this.selected === -1) ? context.grants.data : context.choices[this.selected].data.pool;
		context.count = context.choices[this.selected]?.data.count;
		context.selectedIndex = this.selected;

		// Build list of valid options based on current mode
		context.validTraitTypes = Object.entries(CONFIG.BlackFlag.traits).reduce((obj, [key, config]) => {
			if ( this.config.mode === "default"
				|| ((config.type === "proficiency") && config.expertise)) obj[key] = config.labels.title;
			return obj;
		}, {});

		// Get information on currently selected trait and build choices list
		const traitConfig = CONFIG.BlackFlag.traits[this.trait];
		if ( traitConfig ) {
			context.default.title = game.i18n.localize(traitConfig.labels.title);
			context.default.icon = traitConfig.icon;
		}
		context.choiceOptions = Trait.choices(this.trait, { chosen, prefixed: true, any: this.selected !== -1 });
		context.selectedTraitHeader = `${traitConfig.labels.localization}[other]`;
		context.selectedTrait = this.trait;

		context.hintPlaceholder = Trait.localizedList(
			this.config.grants, this.config.choices, { choiceMode: this.config.choiceMode }
		);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", this._onAction.bind(this));
		}

		// Handle selecting & disabling category children when a category is selected
		for ( const checkbox of html.querySelectorAll(".trait-options input:checked") ) {
			const toCheck = checkbox.name.endsWith("*")
				? checkbox.closest("ol").querySelectorAll(`input:not([name="${checkbox.name}"])`)
				: checkbox.closest("li").querySelector("ol")?.querySelectorAll("input");
			toCheck?.forEach(i => i.checked = i.disabled = true);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicks to the Add and Remove buttons above the list.
	 * @param {Event} event - Triggering click event.
	 */
	async _onAction(event) {
		event.preventDefault();
		switch (event.currentTarget.dataset.action) {
			case "add-choice":
				this.config.choices.push({ count: 1, trait: this.trait });
				this.selected = this.config.choices.length - 1;
				break;

			case "remove-choice":
				const input = event.currentTarget.closest("li").querySelector("[name='selectedIndex']");
				const selectedIndex = Number(input.value);
				this.config.choices.splice(selectedIndex, 1);
				if ( selectedIndex <= this.selected ) this.selected -= 1;
				break;

			default:
				return;
		}

		// Fix to prevent sets in grants & choice pools being saved as `[object Set]`
		// TOOD: Remove this when https://github.com/foundryvtt/foundryvtt/issues/7706 is resolved
		this.advancement.configuration.grants = Array.from(this.advancement.configuration.grants);
		this.advancement.configuration.choices.forEach(c => {
			if ( !c.pool ) return;
			c.pool = Array.from(c.pool);
		});

		await this.advancement.update({configuration: this.advancement.configuration});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onChangeInput(event) {
		// Display new set of trait choices
		if ( event.target.name === "selectedTrait" ) {
			this.trait = event.target.value;

			//  Update trait in selected choice
			const selectedChoice = this.config.choices[this.selected];
			if ( selectedChoice && !selectedChoice.pool?.size ) {
				return this.submit({ updateData: { "configuration.trait": this.trait } });
			}

			return this.render();
		}

		// Change selected configuration set
		if ( event.target.name === "selectedIndex" ) {
			this.selected = Number(event.target.value ?? -1);
			const types = this.types;
			if ( types.size && !types.has(this.trait) ) this.trait = types.first();
			return this.render();
		}

		// TOOD: If mode is changed, ensure no invalid traits are selected & change selected type if current
		// type is not valid

		super._onChangeInput(event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareConfigurationUpdate(configuration) {
		const choicesCollection = foundry.utils.deepClone(this.config.choices);

		if ( configuration.checked ) {
			const prefix = `${this.trait}:`;
			const filteredSelected = filteredKeys(configuration.checked);

			// Update grants
			if ( this.selected === -1 ) {
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

		if ( configuration.count ) {
			choicesCollection[this.selected].count = configuration.count;
			delete configuration.count;
		}

		// TODO: Remove when https://github.com/foundryvtt/foundryvtt/issues/7706 is resolved
		choicesCollection.forEach(c => {
			if ( !c.pool ) return;
			c.pool = Array.from(c.pool);
		});
		configuration.choices = choicesCollection;

		return configuration;
	}
}

/**
 * Configuration dialog for feature & talent prerequisites.
 */
export default class PrerequisiteConfig extends DocumentSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "prerequisite"],
			template: "systems/black-flag/templates/item/config/prerequisite-config.hbs",
			width: 450,
			height: "auto",
			sheetConfig: false,
			submitOnChange: true,
			closeOnSubmit: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		return game.i18n.localize("BF.Prerequisite.Config.Title");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Restriction filters currently set.
	 * @type {FilterDescription[]}
	 */
	get filters() {
		return this.document.system.restriction.filters;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = foundry.utils.mergeObject({
			CONFIG: CONFIG.BlackFlag,
			source: this.document.toObject().system,
			system: this.document.system,
			abilities: this.prepareAbilities(),
			// TODO: Spellcasting
			traits: this.prepareTraits()
		}, await super.getData(options));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare minimum abilities.
	 * @returns {object}
	 * @abstract
	 */
	prepareAbilities() {
		const abilities = {};
		for ( const [key, ability] of Object.entries(CONFIG.BlackFlag.abilities) ) {
			const filter = this.filters.find(f => f.k === `system.abilities.${key}.value`);
			abilities[key] = {
				label: ability.labels.abbreviation,
				value: filter?.v ?? ""
			};
		}
		return abilities;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare trait restrictions.
	 * @returns {object}
	 * @abstract
	 */
	prepareTraits() {
		const traits = {};
		traits.size = this.filters.find(f => f.k === "system.traits.size")?.v;
		return traits;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		const data = foundry.utils.expandObject(formData);
		const filters = this.filters;

		const updateFilter = (k, v, o) => {
			const existingIdx = filters.findIndex(f => f.k === k);
			if ( v ) {
				if ( existingIdx !== -1 ) filters[existingIdx].v = v;
				else filters.push({k, v, o});
			} else if ( existingIdx !== -1 ) filters.splice(existingIdx, 1);
		};

		Object.entries(data.abilities).forEach(([k, v]) => updateFilter(`system.abilities.${k}.value`, v, "gte"));
		// TODO: Spellcasting
		updateFilter("system.traits.size", data.traits?.size);

		super._updateObject(event, {"system.restriction.filters": filters});
	}
}

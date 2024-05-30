/**
 * Configuration dialog for feature & talent prerequisites.
 */
export default class PrerequisiteConfig extends DocumentSheet {
	/** @inheritDoc */
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

	/** @inheritDoc */
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

	/** @inheritDoc */
	async getData(options) {
		const context = foundry.utils.mergeObject(
			{
				CONFIG: CONFIG.BlackFlag,
				source: this.document.toObject().system,
				system: this.document.system,
				abilities: this.prepareAbilities(),
				levels: CONFIG.BlackFlag.levels(),
				spellcasting: this.prepareSpellcasting(),
				spellCircles: CONFIG.BlackFlag.spellCircles(undefined, false),
				traits: this.prepareTraits()
			},
			await super.getData(options)
		);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare minimum abilities.
	 * @returns {object}
	 */
	prepareAbilities() {
		const abilities = {};
		for (const [key, ability] of Object.entries(CONFIG.BlackFlag.abilities)) {
			const filter = this.filters.find(f => f._id === `ability-${key}`);
			abilities[key] = {
				label: ability.labels.abbreviation,
				value: filter?.v ?? ""
			};
		}
		return abilities;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare spellcasting restrictions.
	 * @returns {object}
	 */
	prepareSpellcasting() {
		const spellcasting = {};
		spellcasting.cantrip = this.filters.find(f => f._id === "hasCantrips")?.v;
		spellcasting.circle = this.filters.find(f => f._id === "spellCircle")?.v;
		spellcasting.damage = this.filters.find(f => f._id === "hasDamagingSpells")?.v;
		spellcasting.feature = this.filters.find(f => f._id === "spellcastingFeature")?.v;
		return spellcasting;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare trait restrictions.
	 * @returns {object}
	 */
	prepareTraits() {
		const traits = {};
		traits.level = this.filters.find(f => f._id === "characterLevel")?.v;
		traits.size = this.filters.find(f => f._id === "creatureSize")?.v;
		return traits;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _updateObject(event, formData) {
		const data = foundry.utils.expandObject(formData);
		const filters = this.filters;

		const updateFilter = (_id, k, v, o) => {
			const existingIdx = filters.findIndex(f => f._id === _id);
			if (v) {
				if (existingIdx !== -1) filters[existingIdx].v = v;
				else filters.push({ _id, k, v, o });
			} else if (existingIdx !== -1) filters.splice(existingIdx, 1);
		};

		Object.entries(data.abilities).forEach(([k, v]) =>
			updateFilter(`ability-${k}`, `system.abilities.${k}.value`, v, "gte")
		);
		updateFilter(
			"hasCantrips",
			undefined,
			data.spellcasting?.cantrip
				? [
						{ k: "system.spellcasting.spells.cantrips", v: 1, o: "gte" },
						{ k: "system.spellcasting.spells.knowable.cantrips", v: 1, o: "gte" }
					]
				: false,
			"OR"
		);
		updateFilter("spellCircle", "system.spellcasting.maxCircle", data.spellcasting?.circle, "gte");
		updateFilter("hasDamagingSpells", "system.spellcasting.spells.damaging", Number(data.spellcasting?.damage), "gte");
		updateFilter("spellcastingFeature", "system.spellcasting.hasSpellcastingAdvancement", data.spellcasting?.feature);
		updateFilter("characterLevel", "system.progression.level", data.traits?.level);
		updateFilter("creatureSize", "system.traits.size", data.traits?.size);

		super._updateObject(event, { "system.restriction.filters": filters });
	}
}

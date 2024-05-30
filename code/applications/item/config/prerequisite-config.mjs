import { Trait } from "../../../utils/_module.mjs";

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
		const filters = this.filters.reduce((obj, f) => {
			obj[f._id] = f;
			return obj;
		}, {});
		const context = foundry.utils.mergeObject(
			{
				CONFIG: CONFIG.BlackFlag,
				source: this.document.toObject().system,
				system: this.document.system,
				abilities: this.prepareAbilities(filters),
				levels: CONFIG.BlackFlag.levels(),
				proficiencies: this.prepareProficiencies(filters),
				spellcasting: this.prepareSpellcasting(filters),
				spellCircles: CONFIG.BlackFlag.spellCircles(undefined, false),
				traits: this.prepareTraits(filters)
			},
			await super.getData(options)
		);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare minimum abilities.
	 * @param {Record<string, FilterData>} filters - Prerequisites to consider.
	 * @returns {object}
	 */
	prepareAbilities(filters) {
		const abilities = {};
		for (const [key, ability] of Object.entries(CONFIG.BlackFlag.abilities)) {
			abilities[key] = {
				label: ability.labels.abbreviation,
				value: filters[`ability-${key}`]?.v ?? ""
			};
		}
		return abilities;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare proficiency restrictions.
	 * @param {Record<string, FilterData>} filters - Prerequisites to consider.
	 * @returns {object}
	 */
	prepareProficiencies(filters) {
		const opts = { category: true, priority: "localization" };
		return {
			armor: Trait.choices("armor", { chosen: new Set(filters.armorProficiency?.v ?? []), ...opts }),
			weapons: Trait.choices("weapons", { chosen: new Set(filters.weaponProficiency?.v ?? []), ...opts }),
			tools: Trait.choices("tools", { chosen: new Set(filters.toolProficiency?.v ?? []), ...opts })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare spellcasting restrictions.
	 * @param {Record<string, FilterData>} filters - Prerequisites to consider.
	 * @returns {object}
	 */
	prepareSpellcasting(filters) {
		return {
			cantrip: filters.hasCantrips?.v,
			circle: filters.spellCircle?.v,
			damage: filters.hasDamagingSpells?.v,
			feature: filters.spellcastingFeature?.v
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare trait restrictions.
	 * @param {Record<string, FilterData>} filters - Prerequisites to consider.
	 * @returns {object}
	 */
	prepareTraits(filters) {
		return {
			level: filters.characterLevel?.v,
			size: filters.creatureSize?.v
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("multi-select")) {
			element.addEventListener("change", this._onChangeInput.bind(this));
		}
	}

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

		// Abilities
		Object.entries(data.abilities).forEach(([k, v]) =>
			updateFilter(`ability-${k}`, `system.abilities.${k}.value`, v, "gte")
		);

		// Proficiencies
		updateFilter("armorProficiency", "system.proficiencies.armor.value", data.proficiencies?.armor, "hasAny");
		updateFilter("weaponProficiency", "system.proficiencies.weapons.value", data.proficiencies?.weapons, "hasAny");
		updateFilter("toolProficiency", "system.proficiencies.tools.value", data.proficiencies?.tools, "hasAny");

		// Spellcasting
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

		// Traits
		updateFilter("characterLevel", "system.progression.level", data.traits?.level);
		updateFilter("creatureSize", "system.traits.size", data.traits?.size);

		super._updateObject(event, { "system.restriction.filters": filters });
	}
}

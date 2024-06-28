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
				isV11: game.release.generation < 12,
				items: Array.from(this.document.system.restriction.items).join(","),
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
		const opts = { any: true, category: true, priority: "localization" };
		const prepareProficiency = trait =>
			Trait.choices(trait, {
				chosen: new Set([
					...(filters[`${trait}Proficiency`]?.v ?? []).map(s => s._key ?? s),
					...(filters[`${trait}Categories`]?.v ?? []).map(s => `${s}:*`)
				]),
				...opts
			});
		return {
			armor: prepareProficiency("armor"),
			weapons: prepareProficiency("weapons"),
			tools: prepareProficiency("tools"),
			skills: prepareProficiency("skills")
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
		const level = {};
		if (filters.characterLevel) {
			level.value = filters.characterLevel.v;
		} else if (filters.classLevel) {
			level.class = filters.classLevel._class;
			level.value = filters.classLevel.v;
		}
		return {
			level,
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

		const updateFilter = (_id, k, v, o, d = {}) => {
			const existingIdx = filters.findIndex(f => f._id === _id);
			if (v) {
				const value = { _id, k, v, o, ...d };
				if (existingIdx !== -1) filters[existingIdx] = value;
				else filters.push(value);
			} else if (existingIdx !== -1) filters.splice(existingIdx, 1);
		};

		// Abilities
		Object.entries(data.abilities).forEach(([k, v]) =>
			updateFilter(`ability-${k}`, `system.abilities.${k}.value`, v, "gte")
		);

		// Proficiencies
		const updateProficiency = (trait, extended) => {
			const [proficiencies, categories] = (data.proficiencies?.[trait] ?? []).reduce(
				(arr, k) => {
					if (k.endsWith(":*")) arr[1].push(k.replace(":*", ""));
					else arr[0].push(k);
					return arr;
				},
				[[], []]
			);
			updateFilter(
				`${trait}Proficiency`,
				extended ? undefined : `system.proficiencies.${trait}.value`,
				proficiencies.length
					? extended
						? proficiencies.map(_key => ({
								k: `system.proficiencies.${trait}.${_key}.proficiency.multiplier`,
								o: "gte",
								v: 1,
								_key
							}))
						: proficiencies
					: false,
				extended ? "OR" : "hasAny"
			);
			updateFilter(
				`${trait}Categories`,
				`system.proficiencies.${trait}.categories`,
				categories.length ? categories : false,
				"hasAny"
			);
		};
		updateProficiency("armor");
		updateProficiency("weapons");
		updateProficiency("tools", true);
		updateProficiency("skills", true);

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
		if (data.traits?.level?.class) {
			updateFilter("characterLevel");
			updateFilter(
				"classLevel",
				`system.progression.classes.${data.traits.level.class}.levels`,
				data.traits?.level?.value,
				undefined,
				{ _class: data.traits.level.class }
			);
		} else {
			updateFilter("characterLevel", "system.progression.level", data.traits?.level?.value);
			updateFilter("classLevel");
		}
		updateFilter("creatureSize", "system.traits.size", data.traits?.size);

		super._updateObject(event, { ...formData, "system.restriction.filters": filters });
	}
}

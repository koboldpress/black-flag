import { filter, numberFormat } from "../../../utils/_module.mjs";
import * as fields from "../../fields/_module.mjs";

/**
 * Data definition template for Feature and Talent items.
 */
export default class FeatureTemplate extends foundry.abstract.DataModel {

	static get metadata() {
		return {
			category: "features"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			description: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new foundry.data.fields.StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			identifier: new foundry.data.fields.SchemaField({
				value: new fields.IdentifierField()
			}),
			restriction: new foundry.data.fields.SchemaField({
				filters: new fields.FilterField()
			}),
			type: new foundry.data.fields.SchemaField({
				category: new foundry.data.fields.StringField(),
				value: new foundry.data.fields.StringField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedPrerequisiteLabel() {
		this.restriction.label = this.createPrerequisiteLabel();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a label for this item's prerequisites, validating if an actor is provided.
	 * @param {BlackFlagActor} [actor] - Actor to validate if required.
	 * @returns {string} - Prerequisite label, will contains HTML if actor is provided.
	 */
	createPrerequisiteLabel(actor) {
		if ( !this.restriction.filters.length ) return "";
		const prerequisites = [];

		const validate = (f, label) => {
			if ( !actor ) return label;
			return `${label} <i class="filter ${filter.performCheck(actor, [f]) ? "" : "in"}valid"></i>`;
		};

		// Abilities
		for ( const [key, ability] of Object.entries(CONFIG.BlackFlag.abilities) ) {
			const abilityFilter = this.restriction.filters.find(f => f.k === `system.abilities.${key}.value`);
			if ( !abilityFilter ) continue;
			prerequisites.push(validate(abilityFilter, game.i18n.format("BF.Prerequisite.Ability.Label", {
				abbreviation: game.i18n.localize(ability.labels.abbreviation).toUpperCase(),
				value: numberFormat(abilityFilter.v)
			})));
		}

		// TODO: Spellcasting

		// Traits
		const sizeFilter = this.restriction.filters.find(f => f.k === "system.traits.size");
		if ( sizeFilter ) prerequisites.push(validate(sizeFilter, game.i18n.format("BF.Prerequisite.Size.Label", {
			size: game.i18n.localize(CONFIG.BlackFlag.sizes[sizeFilter.v]?.label)
		})));

		if ( !prerequisites.length ) return "";
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit", style: "short" });
		return listFormatter.format(prerequisites);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Validate item prerequisites against actor data
	 * @param {BlackFlagActor} actor - Actor that needs to be validated.
	 * @returns {true|string[]} - True if the item is valid, or a list of invalid descriptions if not.
	 */
	validatePrerequisites(actor) {
		const invalidFilters = this.restriction.filters.filter(f => !filter.performCheck(actor, [f]));
		if ( !invalidFilters.length ) return true;

		const messages = [];
		for ( const invalidFilter of invalidFilters ) {
			// Ability score minimum
			if ( invalidFilter.k.startsWith("system.abilities.") ) {
				const abilityKey = invalidFilter.k.replace("system.abilities.", "").replace(".value", "");
				messages.push(game.i18n.format("BF.Prerequisite.Ability.Warning", {
					ability: game.i18n.localize(CONFIG.BlackFlag.abilities[abilityKey].labels.full).toLowerCase(),
					value: numberFormat(invalidFilter.v)
				}));
			}

			// Sizes
			else if ( invalidFilter.k === "system.traits.size" ) {
				messages.push(game.i18n.format("BF.Prerequisite.Size.Warning", {
					size: game.i18n.localize(CONFIG.BlackFlag.sizes[invalidFilter.v].label)
				}));
			}
		}
		return messages;
	}
}

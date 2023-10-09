import { numberFormat } from "../../../utils/_module.mjs";
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
		this.restriction.label = "";
		if ( !this.restriction.filters.length ) return;
		const prerequisites = [];

		// Abilities
		for ( const [key, ability] of Object.entries(CONFIG.BlackFlag.abilities) ) {
			const filter = this.restriction.filters.find(f => f.k === `system.abilities.${key}.value`);
			if ( !filter ) continue;
			prerequisites.push(game.i18n.format("BF.Prerequisite.Ability.Label", {
				abbreviation: game.i18n.localize(ability.labels.abbreviation).toUpperCase(),
				value: numberFormat(filter.v)
			}));
		}

		// TODO: Spellcasting

		// Traits
		const sizeFilter = this.restriction.filters.find(f => f.k === "system.traits.size");
		if ( sizeFilter ) prerequisites.push(game.i18n.format("BF.Prerequisite.Size.Label", {
			size: game.i18n.localize(CONFIG.BlackFlag.sizes[sizeFilter.v]?.label)
		}));

		if ( !prerequisites.length ) return;
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit", style: "short" });
		this.restriction.label = listFormatter.format(prerequisites);
	}
}

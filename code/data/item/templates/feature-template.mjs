import { filter, numberFormat } from "../../../utils/_module.mjs";
import FilterField from "../../fields/filter-field.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for Feature and Talent items.
 */
export default class FeatureTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static get metadata() {
		return {
			category: "features"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			restriction: new SchemaField({
				filters: new FilterField()
			}),
			type: new SchemaField({
				category: new StringField(),
				value: new StringField()
			})
		};
	}
	
	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static migrateFilterIds(source) {
		for ( const filter of source.restriction?.filters ?? [] ) {
			if ( filter._id ) continue;
			switch ( filter.k ) {
				case "system.spellcasting.present":
					filter._id = "spellcastingFeature";
					filter.k = "system.spellcasting.hasSpellcastingAdvancement";
					filter.v = true;
					delete filter.o;
					break;
				case "system.spellcasting.spells.damaging":
					filter._id = "hasDamagingSpells";
					break;
				case "system.traits.size":
					filter._id = "creatureSize";
					break;
				default:
					if ( filter.k?.startsWith("system.abilities.") ) {
						const ability = filter.k.replace("system.abilities.", "").replace(".value", "");
						filter._id = `ability-${ability}`;
					}
			}
		}
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
			const abilityFilter = this.restriction.filters.find(f => f._id === `ability-${key}`);
			if ( !abilityFilter ) continue;
			prerequisites.push(validate(abilityFilter, game.i18n.format("BF.Prerequisite.Ability.Label", {
				abbreviation: game.i18n.localize(ability.labels.abbreviation).toUpperCase(),
				value: numberFormat(abilityFilter.v)
			})));
		}

		// Spellcasting
		const spellcastingFeatureFilter = this.restriction.filters.find(f => f._id === "spellcastingFeature" );
		if ( spellcastingFeatureFilter ) prerequisites.push(validate(
			spellcastingFeatureFilter, game.i18n.localize("BF.Prerequisite.SpellcastingFeature.Label")
		));
		const cantripSpellsFilter = this.restriction.filters.find(f => f._id === "hasCantrips" );
		if ( cantripSpellsFilter ) prerequisites.push(validate(
			cantripSpellsFilter, game.i18n.localize("BF.Prerequisite.SpellcastingCantrip.Label")
		));
		const damageSpellsFilter = this.restriction.filters.find(f => f._id === "hasDamagingSpells");
		if ( damageSpellsFilter ) prerequisites.push(validate(
			damageSpellsFilter, game.i18n.localize("BF.Prerequisite.SpellcastingDamage.Label")
		));

		// Traits
		const sizeFilter = this.restriction.filters.find(f => f._id === "creatureSize");
		if ( sizeFilter ) prerequisites.push(validate(sizeFilter, game.i18n.format("BF.Prerequisite.Size.Label", {
			size: game.i18n.localize(CONFIG.BlackFlag.sizes[sizeFilter.v]?.label)
		})));

		// TODO: Send out hook for custom filter handling

		if ( !prerequisites.length ) return "";
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit", style: "short" });
		return listFormatter.format(prerequisites);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Validate item prerequisites against actor data.
	 * @param {BlackFlagActor} actor - Actor that needs to be validated.
	 * @returns {true|string[]} - True if the item is valid, or a list of invalid descriptions if not.
	 */
	validatePrerequisites(actor) {
		const invalidFilters = this.restriction.filters.filter(f => !filter.performCheck(actor, [f]));
		if ( !invalidFilters.length ) return true;

		const messages = [];
		for ( const invalidFilter of invalidFilters ) {
			if ( !invalidFilter._id ) continue;

			// Ability score minimum
			if ( invalidFilter._id.startsWith("ability-") ) {
				const abilityKey = invalidFilter._id.replace("ability-", "");
				messages.push(game.i18n.format("BF.Prerequisite.Ability.Warning", {
					ability: game.i18n.localize(CONFIG.BlackFlag.abilities[abilityKey].labels.full).toLowerCase(),
					value: numberFormat(invalidFilter.v)
				}));
			}

			// Spellcasting
			else if ( invalidFilter._id === "hasCantrips" ) {
				messages.push(game.i18n.localize("BF.Prerequisite.SpellcastingCantrip.Warning"));
			}
			else if ( invalidFilter._id === "hasDamagingSpells" ) {
				messages.push(game.i18n.localize("BF.Prerequisite.SpellcastingDamage.Warning"));
			}
			else if ( invalidFilter._id === "spellcastingFeature" ) {
				messages.push(game.i18n.localize("BF.Prerequisite.SpellcastingFeature.Warning"));
			}

			// Sizes
			else if ( invalidFilter._id === "creatureSize" ) {
				messages.push(game.i18n.format("BF.Prerequisite.Size.Warning", {
					size: game.i18n.localize(CONFIG.BlackFlag.sizes[invalidFilter.v].label)
				}));
			}

			else {
				// TODO: Send out hook for custom filter handling
			}
		}
		return messages;
	}
}

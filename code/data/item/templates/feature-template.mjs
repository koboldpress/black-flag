import { filter, numberFormat, Trait } from "../../../utils/_module.mjs";
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

		const filters = this.restriction.filters.reduce((obj, f) => {
			obj[f._id] = f;
			return obj;
		}, {});

		// Abilities
		for ( const [key, ability] of Object.entries(CONFIG.BlackFlag.abilities) ) {
			if ( !filters[`ability-${key}`] ) continue;
			prerequisites.push(validate(filters[`ability-${key}`], game.i18n.format("BF.Prerequisite.Ability.Label", {
				abbreviation: game.i18n.localize(ability.labels.abbreviation).toUpperCase(),
				value: numberFormat(filters[`ability-${key}`].v)
			})));
		}

		// Proficiencies
		const proficiencies = [];
		const formatter = game.i18n.getListFormatter({ type: "disjunction", style: "short" });
		if ( filters.armorProficiency ) proficiencies.push(validate(filters.armorProficiency, formatter.format(
			filters.armorProficiency.v.map(p => Trait.keyLabel(p, { trait: "armor", priority: "localization" }))
		)));
		if ( filters.weaponProficiency ) proficiencies.push(validate(filters.weaponProficiency, formatter.format(
			filters.weaponProficiency.v.map(p => Trait.keyLabel(p, { trait: "weapons", priority: "localization" }))
		)));
		if ( filters.toolProficiency ) proficiencies.push(validate(filters.toolProficiency, formatter.format(
				filters.toolProficiency.v.map(p => Trait.keyLabel(p, { trait: "tools", priority: "localization" }))
			)));
		if ( proficiencies.length ) prerequisites.push(game.i18n.format("BF.Prerequisite.Proficiency.Label", {
			proficiency: game.i18n.getListFormatter({ style: "short" }).format(proficiencies)
		}));

		// Spellcasting
		if ( filters.spellcastingFeature ) prerequisites.push(validate(
			filters.spellcastingFeature, game.i18n.localize("BF.Prerequisite.SpellcastingFeature.Label")
		));
		if ( filters.spellCircle ) prerequisites.push(validate(
			filters.spellCircle, game.i18n.format("BF.Prerequisite.SpellcastingCircle.Label", {
				circle: CONFIG.BlackFlag.spellCircles()[filters.spellCircle.v]
			})
		));
		if ( filters.hasCantrips ) prerequisites.push(validate(
			filters.hasCantrips, game.i18n.localize("BF.Prerequisite.SpellcastingCantrip.Label")
		));
		if ( filters.hasDamagingSpells ) prerequisites.push(validate(
			filters.hasDamagingSpells, game.i18n.localize("BF.Prerequisite.SpellcastingDamage.Label")
		));

		// Traits
		if ( filters.characterLevel ) prerequisites.push(validate(filters.characterLevel, game.i18n.format(
			"BF.Prerequisite.LevelCharacter.Label", { level: numberFormat(filters.characterLevel.v, { ordinal: true }) }
		)));
		if ( filters.creatureSize ) prerequisites.push(validate(filters.creatureSize, game.i18n.format(
			"BF.Prerequisite.Size.Label", { size: game.i18n.localize(CONFIG.BlackFlag.sizes[filters.creatureSize.v]?.label) }
		)));

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
		const proficiencies = [];
		const formatter = game.i18n.getListFormatter({ type: "disjunction", style: "short" });
		for ( const invalidFilter of invalidFilters ) {
			if ( invalidFilter._id?.startsWith("ability-") ) {
				const abilityKey = invalidFilter._id.replace("ability-", "");
				messages.push(game.i18n.format("BF.Prerequisite.Ability.Warning", {
					ability: game.i18n.localize(CONFIG.BlackFlag.abilities[abilityKey].labels.full).toLowerCase(),
					value: numberFormat(invalidFilter.v)
				}));
				continue;
			}

			switch ( invalidFilter._id ) {
				case "armorProficiency":
					proficiencies.push(formatter.format(invalidFilter.v.map(p =>
						Trait.keyLabel(p, { trait: "armor", priority: "localization" })
					)));
					break;
				case "characterLevel":
					messages.push(game.i18n.format("BF.Prerequisite.LevelCharacter.Warning", {
						level: numberFormat(invalidFilter.v, { ordinal: true })
					}));
					break;
				case "creatureSize":
					messages.push(game.i18n.format("BF.Prerequisite.Size.Warning", {
						size: game.i18n.localize(CONFIG.BlackFlag.sizes[invalidFilter.v].label)
					}));
					break;
				case "hasCantrips":
					messages.push(game.i18n.localize("BF.Prerequisite.SpellcastingCantrip.Warning"));
					break;
				case "hasDamagingSpells":
					messages.push(game.i18n.localize("BF.Prerequisite.SpellcastingDamage.Warning"));
					break;
				case "spellcastingFeature":
					messages.push(game.i18n.localize("BF.Prerequisite.SpellcastingFeature.Warning"));
					break;
				case "spellCircle":
					messages.push(game.i18n.format("BF.Prerequisite.SpellcastingCircle.Warning", {
						circle: CONFIG.BlackFlag.spellCircles()[invalidFilter.v]
					}));
					break;
				case "toolProficiency":
					proficiencies.push(formatter.format(invalidFilter.v.map(p =>
						Trait.keyLabel(p, { trait: "tools", priority: "localization" })
					)));
					break;
				case "weaponProficiency":
					proficiencies.push(formatter.format(invalidFilter.v.map(p =>
						Trait.keyLabel(p, { trait: "weapons", priority: "localization" })
					)));
					break;
				default:
					// TODO: Send out hook for custom filter handling
					break;
			}
		}

		if ( proficiencies.length ) messages.push(game.i18n.format("BF.Prerequisite.Proficiency.Warning", {
			proficiency: game.i18n.getListFormatter({ style: "short" }).format(proficiencies)
		}));

		return messages;
	}
}

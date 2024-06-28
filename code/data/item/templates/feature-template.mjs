import { filter, linkForUUID, numberFormat, Trait } from "../../../utils/_module.mjs";
import FilterField from "../../fields/filter-field.mjs";

const { BooleanField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for Feature and Talent items.
 *
 * @property {object} restriction
 * @property {FilterField} restriction.filters - Filters limiting when this item can be selected.
 * @property {Set<string>} restriction.items - Other items that must be present on the actor to take this feature.
 * @property {boolean} restriction.requireAll - Do all filters need to be satisfied to take this feature, or only one.
 * @property {object} type
 * @property {string} type.category - Feature or talent category for this item.
 * @property {string} type.value - Specific feature type.
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
				filters: new FilterField(),
				items: new SetField(new StringField()),
				requireAll: new BooleanField({
					initial: true,
					label: "BF.Prerequisite.RequireAll.Label",
					hint: "BF.Prerequisite.RequireAll.Hint"
				})
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

	/**
	 * Migrate source data to an object.
	 * Added in 0.9.031
	 * @param {object} source - The candidate source data from which the model will be constructed.
	 */
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

	/**
	 * Prepare this feature's pre-requisites label.
	 * Should be called during the `prepareDerivedData` stage.
	 */
	preparePrerequisiteLabel() {
		this.restriction.label = this.createPrerequisiteLabel();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Embeds                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add the prerequisite label to the embedded content.
	 * @param {HTMLCollection} embed - Existing embed collection.
	 * @returns {HTMLCollection}
	 */
	async embedPrerequisite(embed) {
		if ( this.restriction.label ) embed[0]?.insertAdjacentHTML("beforebegin", `<p><em>${
			game.i18n.format("BF.Prerequisite.Listing", { prerequisite: this.restriction.label })
		}</em></p>`);
		return embed;
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
		const prepareProficiency = trait => {
			if ( filters[`${trait}Proficiency`] ) proficiencies.push(validate(filters[`${trait}Proficiency`],
				formatter.format(
					filters[`${trait}Proficiency`].v.map(p => Trait.keyLabel(p._key ?? p, { trait, priority: "localization" }))
				)
			));
			if ( filters[`${trait}Categories`] ) proficiencies.push(validate(filters[`${trait}Categories`],
				game.i18n.format("BF.Prerequisite.Proficiency.AtLeastOne", { category: formatter.format(
					filters[`${trait}Categories`].v.map(p => Trait.keyLabel(p, { trait, count: 1, priority: "localization" }))
				) })
			));
		};
		prepareProficiency("armor");
		prepareProficiency("weapons");
		prepareProficiency("tools");
		prepareProficiency("skills");
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

		// Other Items
		for ( const uuid of this.restriction.items ) {
			const doc = fromUuidSync(uuid);
			if ( !doc ) continue;
			let label = linkForUUID(uuid);
			if ( actor ) label = `${label} <i class="filter ${actor.sourcedItems.get(uuid)?.size ? "" : "in"}valid"></i>`;
			prerequisites.push(label);
		}

		// TODO: Send out hook for custom filter handling

		if ( !prerequisites.length ) return "";
		const listFormatter = game.i18n.getListFormatter({
			type: this.restriction.requireAll ? "unit" : "disjunction", style: "short"
		});
		return listFormatter.format(prerequisites);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Validate item prerequisites against actor data.
	 * @param {BlackFlagActor} actor - Actor that needs to be validated.
	 * @returns {true|string[]} - True if the item is valid, or a list of invalid descriptions if not.
	 */
	validatePrerequisites(actor) {
		let missingItems = this.restriction.items.filter(uuid => !actor.sourcedItems.get(uuid)?.size);

		let invalidFilters;
		if ( this.restriction.requireAll ) {
			invalidFilters = this.restriction.filters.filter(f => !filter.performCheck(actor, [f]));
			if ( !invalidFilters.length && !missingItems.size ) return true;
		} else {
			const atLeastOneItem = missingItems.size < this.restriction.items.size;
			if ( this.restriction.filters.some(f => filter.performCheck(actor, [f])) || atLeastOneItem ) return true;
			invalidFilters = this.restriction.filters;
		}

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
				case "armorCategories":
				case "toolsCategories":
				case "skillsCategories":
				case "weaponsCategories":
					proficiencies.push(game.i18n.format("BF.Prerequisite.Proficiency.AtLeastOne", {
						category: formatter.format(invalidFilter.v.map(p => Trait.keyLabel(
							p?._key ?? p, { trait: invalidFilter._id.replace("Categories", ""), count: 1, priority: "localization" }
						)))
					}).toLowerCase());
					break;
				case "armorProficiency":
				case "toolsProficiency":
				case "skillsProficiency":
				case "weaponsProficiency":
					proficiencies.push(formatter.format(invalidFilter.v.map(p => Trait.keyLabel(
						p?._key ?? p, { trait: invalidFilter._id.replace("Proficiency", ""), priority: "localization" }
					))));
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
				default:
					// TODO: Send out hook for custom filter handling
					break;
			}
		}

		if ( proficiencies.length ) messages.push(game.i18n.format("BF.Prerequisite.Proficiency.Warning", {
			proficiency: game.i18n.getListFormatter({ style: "short" }).format(proficiencies)
		}));

		for ( const uuid of missingItems ) messages.push(game.i18n.format("BF.Prerequisite.Items.Warning", {
			name: fromUuidSync(uuid)?.name
		}));

		return messages;
	}
}

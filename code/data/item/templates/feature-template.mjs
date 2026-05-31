import { filter, formatNumber, linkForUUID, Trait } from "../../../utils/_module.mjs";
import FilterField from "../../fields/filter-field.mjs";

const { ArrayField, BooleanField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for Feature and Talent items.
 *
 * @property {object} restriction
 * @property {boolean} restriction.allowMultipleTimes - Can this talent be taken more than once?
 * @property {string[]} restriction.custom - Custom restrictions with no mechanical effect.
 * @property {FilterField} restriction.filters - Filters limiting when this item can be selected.
 * @property {Set<string>} restriction.items - Other items that must be present on the actor to take this feature.
 * @property {boolean} restriction.requireAll - Do all filters need to be satisfied to take this feature, or only one.
 * @property {object} type
 * @property {string} type.category - Feature or talent category for this item.
 * @property {string} type.value - Specific feature type.
 */
export default class FeatureTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			restriction: new SchemaField({
				allowMultipleTimes: new BooleanField({
					label: "BF.Prerequisite.AllowMultipleTimes.Label",
					hint: "BF.Prerequisite.AllowMultipleTimes.Hint"
				}),
				custom: new ArrayField(new StringField()),
				filters: new FilterField(),
				items: new SetField(new StringField()),
				requireAll: new BooleanField({
					initial: true,
					label: "BF.Prerequisite.RequireAll.Label",
					hint: "BF.Prerequisite.RequireAll.Hint"
				})
			}),
			type: new SchemaField({
				category: new StringField({ label: "BF.Feature.Category.Label" }),
				value: new StringField({ label: "BF.Feature.Type.Label" })
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static migrateFilterIds(source) {
		foundry.utils.logCompatibilityWarning(
			"`FeatureTemplate#_migrateFilterIds` has been renamed `_migrateFilterIds`.",
			{ since: "Black Flag 2.0", until: "Black Flag 3.0", once: true }
		);
		this._migrateFilterIds(source);
	}

	/**
	 * Migrate source data to an object.
	 * Added in 0.9.031
	 * @param {object} source - The candidate source data from which the model will be constructed.
	 */
	static _migrateFilterIds(source) {
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
		const makeLabel = this.createPrerequisiteLabel.bind(this);
		Object.defineProperty(this.restriction, "label", {
			get() { return makeLabel(); },
			configurable: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Embeds & Tooltips          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add the prerequisite label to the embedded content.
	 * @param {HTMLCollection} embed - Existing embed collection.
	 * @returns {HTMLCollection}
	 */
	async embedPrerequisite(embed) {
		if ( this.restriction.label ) embed[0]?.insertAdjacentHTML("beforebegin", `<p><em>${
			_loc("BF.Prerequisite.Listing", { prerequisite: this.restriction.label })
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
			prerequisites.push(validate(filters[`ability-${key}`], _loc("BF.Prerequisite.Ability.Label", {
				abbreviation: _loc(ability.labels.abbreviation).toUpperCase(),
				value: formatNumber(filters[`ability-${key}`].v)
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
				_loc("BF.Prerequisite.Proficiency.AtLeastOne", { category: formatter.format(
					filters[`${trait}Categories`].v.map(p => Trait.keyLabel(p, { trait, count: 1, priority: "localization" }))
				) })
			));
		};
		prepareProficiency("armor");
		prepareProficiency("weapons");
		prepareProficiency("tools");
		prepareProficiency("skills");
		if ( proficiencies.length ) prerequisites.push(_loc("BF.Prerequisite.Proficiency.Label", {
			proficiency: game.i18n.getListFormatter({ style: "short" }).format(proficiencies)
		}));

		// Spellcasting
		if ( filters.spellcastingFeature ) prerequisites.push(validate(
			filters.spellcastingFeature, _loc("BF.Prerequisite.SpellcastingFeature.Label")
		));
		if ( filters.spellCircle ) prerequisites.push(validate(
			filters.spellCircle, _loc("BF.Prerequisite.SpellcastingCircle.Label", {
				circle: CONFIG.BlackFlag.spellCircles()[filters.spellCircle.v]
			})
		));
		if ( filters.hasCantrips ) prerequisites.push(validate(
			filters.hasCantrips, _loc("BF.Prerequisite.SpellcastingCantrip.Label")
		));
		if ( filters.hasDamagingSpells ) prerequisites.push(validate(
			filters.hasDamagingSpells, _loc("BF.Prerequisite.SpellcastingDamage.Label")
		));

		// Traits
		if ( filters.characterLevel ) prerequisites.push(validate(filters.characterLevel, _loc(
			"BF.Prerequisite.LevelCharacter.Label", { level: formatNumber(filters.characterLevel.v, { ordinal: true }) }
		)));
		if ( filters.classLevel ) prerequisites.push(validate(filters.classLevel, _loc(
			"BF.Prerequisite.LevelClass.Label", {
				level: formatNumber(filters.classLevel.v, { ordinal: true }),
				class: CONFIG.BlackFlag.registration.get("class", filters.classLevel._class)?.name ?? "—"
			}
		)));
		if ( filters.creatureSize ) prerequisites.push(validate(filters.creatureSize, _loc(
			"BF.Prerequisite.Size.Label", { size: _loc(CONFIG.BlackFlag.sizes[filters.creatureSize.v]?.label) }
		)));

		// Other Items
		for ( const uuid of this.restriction.items ) {
			const doc = fromUuidSync(uuid);
			if ( !doc ) continue;
			let label = linkForUUID(uuid);
			if ( actor ) label = `${label} <i class="filter ${actor.sourcedItems.get(uuid)?.size ? "" : "in"}valid"></i>`;
			prerequisites.push(label);
		}

		prerequisites.push(...this.restriction.custom.filter(_ => _));

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
	 * @returns {true|null|string[]} - True if the item is valid, null if custom restrictions are provided that can't
	 *                                 be properly evaluated, or a list of invalid descriptions if validation failed.
	 */
	validatePrerequisites(actor) {
		let missingItems = this.restriction.items.filter(uuid => !actor.sourcedItems.get(uuid)?.size);

		let invalidFilters;
		if ( this.restriction.requireAll ) {
			invalidFilters = this.restriction.filters.filter(f => !filter.performCheck(actor, [f]));
			if ( !invalidFilters.length && !missingItems.size ) return this.restriction.custom.length ? null : true;
		} else {
			if ( this.restriction.custom.length ) return null;
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
				messages.push(_loc("BF.Prerequisite.Ability.Warning", {
					ability: _loc(CONFIG.BlackFlag.abilities[abilityKey].labels.full).toLowerCase(),
					value: formatNumber(invalidFilter.v)
				}));
				continue;
			}

			switch ( invalidFilter._id ) {
				case "armorCategories":
				case "toolsCategories":
				case "skillsCategories":
				case "weaponsCategories":
					proficiencies.push(_loc("BF.Prerequisite.Proficiency.AtLeastOne", {
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
					messages.push(_loc("BF.Prerequisite.LevelCharacter.Warning", {
						level: formatNumber(invalidFilter.v, { ordinal: true })
					}));
					break;
				case "classLevel":
					messages.push(_loc("BF.Prerequisite.LevelClass.Warning", {
						level: formatNumber(invalidFilter.v, { ordinal: true }),
						class: CONFIG.BlackFlag.registration.get("class", invalidFilter._class)?.name ?? "—"
					}))
					break;
				case "creatureSize":
					messages.push(_loc("BF.Prerequisite.Size.Warning", {
						size: _loc(CONFIG.BlackFlag.sizes[invalidFilter.v].label)
					}));
					break;
				case "hasCantrips":
					messages.push(_loc("BF.Prerequisite.SpellcastingCantrip.Warning"));
					break;
				case "hasDamagingSpells":
					messages.push(_loc("BF.Prerequisite.SpellcastingDamage.Warning"));
					break;
				case "spellcastingFeature":
					messages.push(_loc("BF.Prerequisite.SpellcastingFeature.Warning"));
					break;
				case "spellCircle":
					messages.push(_loc("BF.Prerequisite.SpellcastingCircle.Warning", {
						circle: CONFIG.BlackFlag.spellCircles()[invalidFilter.v]
					}));
					break;
				default:
					// TODO: Send out hook for custom filter handling
					break;
			}
		}

		if ( proficiencies.length ) messages.push(_loc("BF.Prerequisite.Proficiency.Warning", {
			proficiency: game.i18n.getListFormatter({ style: "short" }).format(proficiencies)
		}));

		for ( const uuid of missingItems ) messages.push(_loc("BF.Prerequisite.Items.Warning", {
			name: fromUuidSync(uuid)?.name
		}));

		return messages;
	}
}

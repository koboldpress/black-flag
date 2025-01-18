import * as Trait from "../utils/trait.mjs";
import { abilities } from "./abilities.mjs";
import { skills } from "./skills.mjs";

export const enrichment = {};

let _enrichmentLookup;
Object.defineProperty(enrichment, "lookup", {
	get() {
		if (!_enrichmentLookup) _createEnrichmentLookup();
		return _enrichmentLookup;
	},
	enumerable: true
});

/**
 * Create the initial enrichment lookup object.
 */
function _createEnrichmentLookup() {
	const addKeys = (key, object, localization) => {
		_enrichmentLookup[key] = {};
		for (const [k, v] of Object.entries(object)) {
			_enrichmentLookup[key][slugify(k)] = _enrichmentLookup[key][slugify(v.abbreviation)] = {
				key: k,
				...v,
				label: localization[k] ?? v.label
			};
		}
	};
	const addTrait = trait => {
		_enrichmentLookup[trait] = {};
		const choices = Trait.choices(trait);
		for (const key of choices.set) {
			const config = choices.get(key);
			_enrichmentLookup[trait][slugify(key)] = { key, label: config.label };
		}
	};
	const slugify = value => value?.slugify().replaceAll("-", "");

	_enrichmentLookup = {};
	addKeys("abilities", abilities, abilities.localizedAbbreviations);
	addKeys("skills", skills, skills.localized);
	addTrait("tools");
	addTrait("vehicles");

	_enrichmentLookup.abilities.spellcasting = {
		label: game.i18n.localize("BF.Ability.Spellcasting.Label"),
		key: "spellcasting"
	};
}

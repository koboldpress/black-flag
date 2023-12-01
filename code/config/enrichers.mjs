import * as Trait from "../utils/trait.mjs";
import { abilities } from "./abilities.mjs";
import { skills } from "./skills.mjs";

export const enrichment = {};

let _enrichmentLookup;
Object.defineProperty(enrichment, "lookup", {
	get() {
		if ( !_enrichmentLookup ) {
			_enrichmentLookup = {
				abilities: foundry.utils.deepClone(abilities),
				skills: foundry.utils.deepClone(skills),
				tools: flattenTools()
			};
			Object.entries(_enrichmentLookup.abilities).forEach(([key, a]) => {
				a.key = key;
				a.label = game.i18n.localize(a.labels.full);
				_enrichmentLookup.abilities[a.abbreviation] = a;
			});
			Object.entries(_enrichmentLookup.skills).forEach(([key, s]) => {
				s.key = key;
				s.label = game.i18n.localize(s.label);
				_enrichmentLookup.skills[s.abbreviation] = s;
			});
		}
		return _enrichmentLookup;
	},
	enumerable: true
});

/**
 * Collapse tool config for enrichment.
 * @returns {object}
 */
function flattenTools() {
	const choices = Trait.choices("tools");
	const tools = {};
	for ( const key of choices.set ) {
		const config = choices.get(key);
		tools[key] = { key, label: config.label };
	}
	return tools;
}

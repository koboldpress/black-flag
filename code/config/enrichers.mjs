import * as Trait from "../utils/trait.mjs";
import { abilities } from "./abilities.mjs";
import { skills } from "./skills.mjs";

export const enrichment = {};

let _enrichmentLookup;
Object.defineProperty(enrichment, "lookup", {
	get() {
		if (!_enrichmentLookup) {
			const addKeys = (key, object) => {
				_enrichmentLookup[key] = {};
				for (const [k, v] of Object.entries(object)) {
					_enrichmentLookup[key][slugify(k)] = _enrichmentLookup[key][slugify(v.abbreviation)] =
						foundry.utils.mergeObject({ key: k, label: object.localized[k] }, v, { inplace: false });
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
			addKeys("abilities", abilities);
			addKeys("skills", skills);
			addTrait("tools");
			addTrait("vehicles");
		}
		return _enrichmentLookup;
	},
	enumerable: true
});

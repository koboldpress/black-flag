import MappingField from "../data/fields/mapping-field.mjs";
import SelectChoices from "../documents/select-choices.mjs";
import { getPluralRules } from "./localization.mjs";
import { numberFormat } from "./number.mjs";

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                      Application                      */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Get the key path to the specified trait on an actor.
 * @param {string} trait - Trait as defined in `CONFIG.BlackFlag.traits`.
 * @returns {string} - Key path to this trait's object within an actor's data.
 */
export function actorKeyPath(trait) {
	const traitConfig = CONFIG.BlackFlag.traits[trait];
	if ( !traitConfig ) return "";
	if ( traitConfig.actorKeyPath ) return traitConfig.actorKeyPath;
	const prefix = traitConfig.type === "proficiency" ? "proficiencies" : "traits";
	return `system.${prefix}.${trait}`;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Get the current trait values for the provided actor.
 * @param {BlackFlagActor} actor
 * @param {string} trait - Trait as defined in `CONFIG.BlackFlag.traits`.
 * @returns {{key: string]: number}}
 */
export function actorValues(actor, trait) {
	const keyPath = actorKeyPath(trait);
	const data = foundry.utils.getProperty(actor, keyPath);
	if ( !data ) return {};
	const traitChoices = choices(trait, { prefixed: true });
	const values = {};

	const field = actor.system.schema.getField(keyPath.replace("system.", ""));
	if ( field instanceof MappingField ) {
		Object.entries(data).forEach(([k, d]) => {
			const key = traitChoices.find(k)?.[0];
			if ( !key ) return;
			values[key] = foundry.utils.getProperty(d, `${trait === "saves" ? "save." : ""}proficiency.multiplier`);
		});
	} else {
		data.value.forEach(v => {
			const key = traitChoices.find(v)?.[0];
			if ( key ) values[key] = 1;
		});
	}

	return values;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Calculate the change key path for a provided trait key.
 * @param {string} key - Key for a trait to set.
 * @param {string} [trait] - Trait as defined in `CONFIG.BlackFlag.traits`, only needed if key isn't prefixed.
 * @returns {string|void}
 */
export function changeKeyPath(key, trait) {
	const split = key.split(":");
	if ( !trait ) trait = split.shift();

	const traitConfig = CONFIG.BlackFlag.traits[trait];
	if ( !traitConfig ) return;

	let keyPath = actorKeyPath(trait);

	if ( trait === "saves" ) {
		return `${keyPath}.${split.pop()}.save.proficiency.multiplier`;
	} else if ( ["skills", "tools"].includes(trait) ) {
		return `${keyPath}.${split.pop()}.proficiency.multiplier`;
	} else {
		return `${keyPath}.value`;
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Find the configuration object for the provided trait key.
 * @param {string} key - Key for which the configuration should be found.
 * @param {object} [options={}]
 * @param {string} [options.trait] - Explicitly set trait type if non-prefixed key is provided.
 * @returns {object|void}
 */
export function configForKey(key, { trait }={}) {
	const parts = key.split(":");
	if ( !trait && (parts.length < 2) ) return;
	else trait ??= parts.shift();

	const traitConfig = CONFIG.BlackFlag.traits[trait];
	const traitData = CONFIG.BlackFlag[traitConfig.configKey ?? trait];

	// Top-level trait or non-prefixed key
	if ( parts.length === 1 ) {
		const searchCategory = (data, key) => {
			for ( const [k, v] of Object.entries(data) ) {
				if ( k === key ) return v;
				if ( v.children ) {
					const result = searchCategory(v.children, key);
					if ( result ) return result;
				}
			}
		};
		return searchCategory(traitData, parts.shift());
	}

	// Prefixed key
	else {
		const searchCategory = (data, parts) => {
			key = parts.shift();
			if ( parts.length ) return searchCategory(data[key]?.children ?? {}, parts);
			else return data[key];
		};
		return searchCategory(traitData, parts);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                         Lists                         */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Fetch the categories object for the specified trait type.
 * @param {string} trait - Trait as defined in `CONFIG.BlackFlag.traits`.
 * @returns {object} - Trait categories defined within `CONFIG.BlackFlag`.
 */
export function categories(trait) {
	return CONFIG.BlackFlag[CONFIG.BlackFlag.traits[trait]?.configKey ?? trait] ?? {};
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Get a list of choices for a specific trait.
 * @param {string} trait - Trait as defined in `CONFIG.BlackFlag.traits`.
 * @param {object} [options={}]
 * @param {Set<string>} [options.chosen=[]] - Optional list of keys to be marked as chosen.
 * @param {boolean} [options.prefixed=false] - Prefix keys with the trait type.
 * @param {boolean} [options.any=false] - Should an "Any" option be added to each category?
 * @param {boolean} [options.category=false] - Should the category be selectable in addition to its children?
 * @returns {SelectChoices} - Object mapping proficiency ids to choice objects.
 */
export function choices(trait, { chosen=new Set(), prefixed=false, any=false, category=false }={}) {
	const traitConfig = CONFIG.BlackFlag.traits[trait];
	if ( !traitConfig ) return new SelectChoices();
	if ( foundry.utils.getType(chosen) === "Array" ) chosen = new Set(chosen);

	let result = {};
	if ( prefixed && any ) {
		const key = `${trait}:*`;
		result[key] = { label: keyLabel(key).titleCase(), chosen: chosen.has(key), sorting: false, wildcard: true };
	}

	const prepareCategory = (key, data, result, prefix) => {
		let label = foundry.utils.getType(data) === "Object"
			? foundry.utils.getProperty(data, traitConfig.labelKeyPath ?? "label") : data;
		if ( !label ) {
			const localization = foundry.utils.getProperty(data, "localization");
			if ( localization ) label = `${localization}[other]`;
			else label = key;
		}
		if ( prefixed ) key = `${prefix}:${key}`;
		result[key] = {
			label: game.i18n.localize(label),
			chosen: chosen.has(key),
			sorting: traitConfig.sortCategories !== false
		};
		if ( data.children ) {
			result[key].selectableCategory = data?.selectableCategory ?? false;
			const children = result[key].children = {};
			if ( category && data?.selectableCategory !== false ) {
				children[key] = { label: result[key].label, chosen: chosen.has(key), sorting: false };
			}
			if ( any ) {
				const anyKey = `${key}:*`;
				children[anyKey] = {
					label: keyLabel(anyKey, { trait }).titleCase(), chosen: chosen.has(anyKey), sorting: false, wildcard: true
				};
			}
			Object.entries(data.children).forEach(([k, v]) => prepareCategory(k, v, children, key));
		}
	};

	Object.entries(categories(trait)).forEach(([k, v]) => prepareCategory(k, v, result, trait));

	return new SelectChoices(result).sorted();
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Prepare an object with all possible choices from a set of keys. These choices will be grouped by
 * trait type if more than one type is present.
 * @param {Set<string>} keys - Prefixed trait keys.
 * @returns {SelectChoices}
 */
export function mixedChoices(keys) {
	if ( !keys.size ) return new SelectChoices();
	const types = {};
	for ( const key of keys ) {
		const split = key.split(":");
		const trait = split.shift();
		const selectChoices = choices(trait, { prefixed: true }).filtered(new Set([key]));
		types[trait] ??= { label: traitLabel(trait), children: new SelectChoices() };
		types[trait].children.merge(selectChoices);
	}
	if ( Object.keys(types).length > 1 ) return new SelectChoices(types);
	return Object.values(types)[0].children;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                     Localization                      */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Get the localized label for a specific trait type.
 * @param {string} trait - Trait as defined in `CONFIG.BlackFlag.traits`.
 * @param {number} [count] - Count used to determine pluralization. If no count is provided, will default to
 *                           the 'other' pluralization.
 * @returns {string}
 */
export function traitLabel(trait, count) {
	const traitConfig = CONFIG.BlackFlag.traits[trait];
	const pluralRule = ( count !== undefined ) ? new Intl.PluralRules(game.i18n.lang).select(count) : "other";
	if ( !traitConfig ) return game.i18n.localize(`BF.Trait.Label[${pluralRule}]`);
	return game.i18n.localize(`${traitConfig.labels.localization}[${pluralRule}]`);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Retrieve the proper display label for the provided key.
 * @param {string} key - Key for which to generate the label.
 * @param {object} [config={}]
 * @param {number} [config.count] - Number to display, only if a wildcard is used as final part of key.
 * @param {string} [config.trait] - Trait as defined in `CONFIG.BlackFlag.traits` if not using a prefixed key.
 * @param {boolean} [config.final] - Is this the final in a list?
 * @param {"label"|"localization"} [config.priority] - If both a label and a localization string are found, which one
 *                                                     should be preferred?
 * @returns {string}
 */
export function keyLabel(key, { count, trait, final, priority }={}) {
	let parts = key.split(":");
	const localizedCount = count ? numberFormat(count, { spelledOut: true }) : null;
	priority ??= count ? "localization" : "label";

	if ( !trait || trait === parts[0] ) trait = parts.shift();
	const traitConfig = CONFIG.BlackFlag.traits[trait];
	if ( !traitConfig ) return key;
	const pluralRule = getPluralRules().select(count ?? 1);
	const type = game.i18n.localize(`${traitConfig.labels.localization}[${pluralRule}]`).toLowerCase();

	const searchTrait = (parts, traits, type) => {
		const firstKey = parts.shift();

		if ( firstKey === "*" ) {
			const key = `BF.Advancement.Trait.Choice.${final ? "Other" : `Any${count ? "Counted" : "Uncounted"}`}`;
			return game.i18n.format(key, { count: localizedCount, type });
		}

		let category = traits[firstKey];
		if ( !category && !parts.length ) category = configForKey(firstKey, { trait });
		if ( !category ) return key;
		let label = foundry.utils.getProperty(category, traitConfig.labelKeyPath ?? "label");
		const localization = foundry.utils.getProperty(category, "localization");
		const categoryPluralRule = count ? pluralRule : "other";
		if ( foundry.utils.getType(category) !== "Object" ) label = category;
		else if ( priority === "label" ) label ??= `${localization}[${categoryPluralRule}]`;
		else if ( localization ) label = `${localization}[${categoryPluralRule}]`;

		if ( !parts.length ) {
			if ( !label ) return key;
			return game.i18n.localize(label);
		}

		if ( !category.children ) return key;

		if ( localization ) type = game.i18n.localize(`${localization}[${getPluralRules().select(count ?? 1)}]`);
		else type = label;

		return searchTrait(parts, category.children, type);
	};

	return searchTrait(parts, categories(trait), type);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a human readable description of the provided choice.
 * @param {TraitChoice} choice - Data for a specific choice.
 * @param {object} [options={}]
 * @param {boolean} [options.only=false] - Is this choice on its own, or part of a larger list?
 * @param {boolean} [options.final=false] - If this choice is part of a list of other grants or choices,
 *                                          is it in the final position?
 * @param {string} [options.trait] - Explicitly set trait type if non-prefixed keys are provided.
 * @returns {string}
 */
export function choiceLabel(choice, { only=false, final=false, trait }={}) {
	if ( !choice.pool.size ) return "";
	const count = numberFormat(choice.count, { spelledOut: true });

	// Single entry in pool
	// { count: 3, pool: ["skills:*"] } -> any three skills
	// { count: 3, pool: ["skills:*"] } (final) -> three other skills
	if ( (choice.pool.size === 1) ) {
		return keyLabel(choice.pool.first(), {
			count: (choice.count > 1 || !only) ? choice.count : null, final: final && !only, trait
		});
	}

	const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "disjunction" });

	// Singular count
	// { count: 1, pool: ["skills:*"] } -> any skill
	// { count: 1, pool: ["thief", "skills:*"] } -> Thieves Tools or any skill
	// { count: 1, pool: ["thief", "tools:artisan:*"] } -> Thieves' Tools or any artisan tool
	if ( (choice.count === 1) && only ) {
		return listFormatter.format(choice.pool.map(p => keyLabel(p, { trait })));
	}

	// Select from a list of options
	// { count: 2, pool: ["thief", "skills:*"] } -> Choose two from thieves tools or any skill
	const choices = choice.pool.map(key => keyLabel(key, { trait }));
	return game.i18n.format("BF.Advancement.Trait.Choice.List", {
		count: count,
		list: listFormatter.format(choices)
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a human readable description of trait grants & choices.
 * @param {Set<string>} grants - Guaranteed trait grants.
 * @param {TraitChoice[]} [choices=[]] - Trait choices.
 * @param {object} [options={}]
 * @param {string} [options.choiceMode="inclusive"] - Choice mode.
 * @param {string} [options.style="long"] - List style type used (see Intl.ListFormat).
 * @param {string} [options.trait] - Explicitly set trait type if non-prefixed keys are provided.
 * @returns {string}
 */
export function localizedList(grants, choices=[], { choiceMode="inclusive", style="long", trait }={}) {
	const choiceSections = [];

	for ( const [index, choice] of choices.entries() ) {
		const final = choiceMode === "exclusive" ? false : index === choices.length - 1;
		choiceSections.push(choiceLabel(choice, { final, only: !grants.size && choices.length === 1 }));
	}

	let sections = Array.from(grants).map(g => keyLabel(g, { trait }));
	if ( choiceMode === "inclusive" ) {
		sections = sections.concat(choiceSections);
	} else {
		const choiceListFormatter = new Intl.ListFormat(game.i18n.lang, { style, type: "disjunction" });
		sections.push(choiceListFormatter.format(choiceSections));
	}

	const listFormatter = new Intl.ListFormat(game.i18n.lang, { style, type: "conjunction" });
	if ( !sections.length || grants.size ) return listFormatter.format(sections);
	return game.i18n.format("BF.Advancement.Trait.Choice.Wrapper", {
		choices: listFormatter.format(sections)
	});
}

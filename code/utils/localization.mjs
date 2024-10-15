import { flattenChildren, sortObjectEntries } from "./object.mjs";

/**
 * Create a formatted list including tags like for languages, sense, and movement.
 * @param {object} config
 * @param {Map<string, string>} [config.entries] - Mapping of keys & localized entries that make up the main list.
 * @param {string[]|Set<string>} [config.extras=[]] - Additional pre-localized values that will be added to the end.
 * @param {string[]|Set<string>} [config.tags=[]] - Tags that modify the list.
 * @param {TraitTagConfiguration} config.tagDefinitions - Configuration information for provided tags.
 * @param {string} [config.listType="unit"] - Type of list to use for entries.
 * @returns {string}
 */
export function formatTaggedList({ entries=new Map(), extras=[], tags=[], tagDefinitions, listType="unit" }) {
	const formatters = [];
	const appendedTags = [];
	const associatedTags = {};
	const inlineTags = [];
	for ( const tag of tags ) {
		const config = tagDefinitions[tag];
		const localized = game.i18n.localize(config?.display ?? tag);
		switch ( config.type ) {
			case "appendedTags":
				appendedTags.push(localized);
			case "associated":
				if ( entries.has(config.association) ) {
					associatedTags[config.association] ??= [];
					associatedTags[config.association].push(localized);
				} else {
					appendedTags.push(localized);
				}
				break;
			case "formatter":
				formatters.push(config.display ?? tag);
				break;
			case "inline":
			default:
				inlineTags.push(localized);
		}
	}

	// Iterate over values in entries, added associated tags as necessary
	entries = Array.from(entries.entries()).map(([key, value]) => {
		if ( !associatedTags[key] ) return value;
		return `${value} (${game.i18n.getListFormatter({ style: "short" }).format(associatedTags[key])})`;
	});
	entries.push(...inlineTags);

	let label = game.i18n.getListFormatter({ style: "short", type: listType }).format(entries);
	if ( appendedTags.length ) label += ` (${game.i18n.getListFormatter({ style: "short" }).format(appendedTags)})`;

	formatters.forEach(f => label = game.i18n.format(f, { entries: label }));
	return game.i18n.getListFormatter({ type: "unit" }).format([label, ...extras].filter(l => l));
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Cached options for attributes.
 * @type {Map<string, FormSelectOptions>}
 */
const _attributeOptionCache = new Map();

/**
 * Create a human readable label for the provided attribute key, if possible.
 * @param {string} attribute - Attribute key path to localize.
 * @param {object} [options={}]
 * @param {BlackFlagActor} [options.actor] - Optional actor to assist with lookups.
 * @returns {FormSelectOption}
 */
export function getAttributeOption(attribute, { actor }={}) {
	if ( _attributeOptionCache.has(attribute) ) return _attributeOptionCache.get(attribute);

	const cache = (label, group) => {
		const option = { value: attribute, label: label ?? attribute };
		if ( group ) option.group = group;
		_attributeOptionCache.set(attribute, option);
		return foundry.utils.deepClone(option);
	};

	switch (attribute) {
		case "attributes.ac.flat":
		case "attributes.ac.value": return cache(game.i18n.localize("BF.ArmorClass.Label"));
		case "attributes.cr": return cache(game.i18n.localize("BF.ChallengeRating.Label"));
		case "attributes.death.failure": return cache(game.i18n.localize("BF.Death.Failure.Label"));
		case "attributes.death.success": return cache(game.i18n.localize("BF.Death.Success.Label"));
		case "attributes.exhaustion": return cache(game.i18n.localize("BF.Condition.Exhaustion.Level"));
		case "attributes.hp.temp": return cache(game.i18n.localize("BF.HitPoint.Temp.LabelLong"));
		case "attributes.hp":
		case "attributes.hp.value": return cache(game.i18n.localize("BF.HitPoint.Label[other]"));
		case "initiative":
		case "attributes.initiative.mod": return cache(game.i18n.localize("BF.Initiative.Label"));
		case "attributes.legendary.spent":
		case "attributes.legendary.value": return cache(game.i18n.localize("BF.ACTIVATION.Type.Legendary[other]"));
		case "attributes.luck.value": return cache(game.i18n.localize("BF.Luck.Label"));
		case "attributes.perception": return cache(game.i18n.localize("BF.Skill.Perception.Label"));
		case "attributes.stealth": return cache(game.i18n.localize("BF.Skill.Stealth.Label"));
		case "progression.xp":
		case "progression.xp.value": return cache(game.i18n.localize("BF.ExperiencePoints.Label"));
		case "spellcasting.dc": return cache(game.i18n.localize("BF.Spellcasting.DC.Label"));
	}

	if ( attribute.startsWith("abilities.") ) return cache(
		CONFIG.BlackFlag.abilities.localized[attribute], game.i18n.localize("BF.Ability.Score.Label[other]")
	);

	if ( attribute.startsWith("proficiencies.skills.") ) {
		const key = attribute.replace("proficiencies.skills.", "").replace(".passive", "");
		const skill = CONFIG.BlackFlag.skills.localized[key];
		return cache(skill, game.i18n.localize("BF.Skill.Passive.Label"));
	}

	if ( attribute.startsWith("spellcasting.slots.") ) {
		let slot;
		if ( attribute.startsWith("spellcasting.slots.pact") ) {
			slot = game.i18n.localize("BF.Spellcasting.Type.Pact.Slots");
		} else {
			const circle = attribute.match(/spellcasting\.slots\.circle-(\d+)(?:\.|$)/)?.[1];
			if ( circle ) slot = CONFIG.BlackFlag.spellCircles()[Number(circle)];
		}
		if ( !slot && actor ) slot = foundry.utils.getProperty(actor.system, attribute)?.label;
		return cache(slot, game.i18n.localize("BF.CONSUMPTION.Type.SpellSlots.Label"));
	}

	if ( attribute.startsWith("traits.movement.types.") ) return cache(
		CONFIG.BlackFlag.movementTypes.localized[attribute.replace("traits.movement.types.", "")],
		game.i18n.localize("BF.Speed.Label")
	);

	if ( attribute.startsWith("traits.senses.types.") ) return cache(
		CONFIG.BlackFlag.senses.localized[attribute.replace("traits.senses.types.", "")],
		game.i18n.localize("BF.SENSES.Label[other]")
	);

	return { value: attribute, label: attribute };
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Cached store of Intl.ListFormat instances.
 * @type {{[key: string]: Intl.PluralRules}}
 */
const _pluralRules = {};

/**
 * Get a PluralRules object, fetching from cache if possible.
 * @param {object} [options={}]
 * @param {string} [options.type=cardinal]
 * @returns {Intl.PluralRules}
 */
export function getPluralRules({ type="cardinal" }={}) {
	_pluralRules[type] ??= new Intl.PluralRules(game.i18n.lang, { type });
	return _pluralRules[type];
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Attach a "localized" property to an object that returns a localized & sorted version.
 * @param {object} config - Configuration object to modify.
 * @param {object} [options={}] - Options to pass through to the makeLabels function.
 * @param {string} [options.propertyName] - Name where the localized string is stored.
 */
export function localizeConfig(config, { propertyName="localized", ...options }={}) {
	Object.defineProperty(config, propertyName, {
		get() {
			return makeLabels(config, options);
		},
		enumerable: false
	});
	Object.defineProperty(config, `${propertyName}Options`, {
		get() {
			return Object.entries(this[propertyName]).map(([value, label]) => ({ value, label }));
		},
		enumerable: false
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create labels for the provided object using either a "localization" value with the provided
 * plural role or a "label" value.
 * @param {object} object
 * @param {object} [options={}]
 * @param {boolean} [options.sort=true] - Should the localized results be sorted?
 * @param {string} [options.pluralRule="one"] - Pluralization rule to use with localization value.
 * @param {string} [options.labelKeyPath="label"] - Path to the standard label.
 * @param {string} [options.localizationKeyPath="label"] - Path to the pluralizable label.
 * @param {boolean} [options.flatten=false] - For nested configs with children, flatten them to one level.
 * @param {boolean|Function(object): boolean} [options.keepCategories=true] - Passed to `flattenChildren`.
 * @param {boolean} [options.objectOutput=false] - Output values as objects with label property.
 * @returns {object}
 */
export function makeLabels(object, {
	sort=true, pluralRule="one", labelKeyPath="label", localizationKeyPath="localization",
	flatten=false, keepCategories=true, objectOutput=false
}={}) {
	if ( flatten ) object = flattenChildren(object, { keepCategories });
	const localized = Object.entries(object).map(([k, d]) => {
		const label = makeLabel(d, { pluralRule, labelKeyPath, localizationKeyPath });
		return [k, objectOutput ? { ...d, [labelKeyPath]: label } : label];
	});
	if ( sort && objectOutput ) sortObjectEntries(localized, { sortKey: labelKeyPath });
	else if ( sort ) localized.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]));
	return Object.fromEntries(localized);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a label for the provided object using either a "localization" value with the provided
 * plural role or a "label" value.
 * @param {object|string} input
 * @param {object} [options={}]
 * @param {string} [options.pluralRule="one"] - Pluralization rule to use with localization value.
 * @param {string} [options.labelKeyPath="label"] - Path to the standard label.
 * @param {string} [options.localizationKeyPath="label"] - Path to the pluralizable label.
 * @returns {string}
 */
export function makeLabel(input, { pluralRule="one", labelKeyPath="label", localizationKeyPath="localization" }={}) {
	return game.i18n.localize(
		foundry.utils.getType(input) === "string" ? input
			: foundry.utils.getProperty(input, labelKeyPath)
      ?? `${foundry.utils.getProperty(input, localizationKeyPath)}[${pluralRule}]`
	);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Produce a human-formatted system version.
 * @returns {string}
 */
export function systemVersion() {
	const parts = game.system.version.split(".");
	const build = Number(parts.pop());
	const version = parts.join(".");
	const type = `BF.Version.${(game.system.flags.version?.type ?? "stable").capitalize()}`;

	return game.i18n.format("BF.Version.Label", {
		version, build, type: game.i18n.localize(type)
	});
}

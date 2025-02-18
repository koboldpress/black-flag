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
		switch ( config?.type ) {
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
const _attributeOptionCache = {
	activity: new Map(),
	actor: new Map(),
	item: new Map()
};

/**
 * Create a human readable label for the provided attribute key, if possible.
 * @param {string} attribute - Attribute key path to localize.
 * @param {object} [options={}]
 * @param {BlackFlagActor} [options.actor] - Optional actor to assist with lookups.
 * @param {BlackFlagItem} [options.item] - Optional item to assist with lookups.
 * @returns {FormSelectOption}
 */
export function getAttributeOption(attribute, { actor, item }={}) {
	if ( attribute.startsWith("system.") ) attribute = attribute.slice(7);

	let type = "actor";
	if ( item ) type = attribute.startsWith("activities.") ? "activity" : "item";
	else if ( _attributeOptionCache.actor.has(attribute) ) return _attributeOptionCache.actor.get(attribute);

	const getSchemaLabel = (attr, type, doc) => {
		if ( doc ) return doc.system.schema.getField(attr)?.label;
		for ( const model of Object.values(CONFIG[type].dataModels) ) {
			const field = model.schema.getField(attr);
			if ( field ) return field.label;
		}
	};

	let name;
	let group;
	let label;
	let option;

	// Activity Labels
	if ( type === "activity" ) {
		let [, activityId, ...keyPath] = attribute.split(".");
		const activity = item.system.activities?.get(activityId);
		if ( !activity ) return { value: attribute, label: attribute };
		attribute = keyPath.join(".");
		name = `${item.name}: ${activity.name}`;
		if ( _attributeOptionCache.activity.has(attribute) ) option = _attributeOptionCache.activity.get(attribute);
		else if ( attribute === "uses.spent" ) label = "BF.Uses.Short";
	}

	// Item Labels
	else if ( type === "item" ) {
		name = item.name;
		if ( _attributeOptionCache.item.has(attribute) ) option = _attributeOptionCache.item.get(attribute);
		else if ( attribute === "uses.spent" ) label = "BF.Uses.Short";
		else label = getSchemaLabel(attribute, "Item", item);
	}

	// Abilities
	else if ( attribute.startsWith("abilities.") ) {
		label = CONFIG.BlackFlag.abilities.localized[attribute];
		group = "BF.Ability.Score.Label[other]";
	}

	// Hit Dice
	else if ( attribute.startsWith("attributes.hd.d.") ) {
		const denom = attribute.replace("attributes.hd.d.", "").replace(".spent", "");
		label = game.i18n.format("BF.HitDie.LabelSpecific", { denom });
		group = "BF.HitDie.Label[other]";
	}

	// Skills
	else if ( attribute.startsWith("proficiencies.skills.") ) {
		const key = attribute.replace("proficiencies.skills.", "").replace(".passive", "");
		label = CONFIG.BlackFlag.skills.localized[key];
		group = "BF.Skill.Passive.Label";
	}

	// Spell Slots
	else if ( attribute.startsWith("spellcasting.slots.") ) {
		if ( attribute.startsWith("spellcasting.slots.pact") ) {
			label = "BF.Spellcasting.Type.Pact.Slots";
		} else {
			const circle = attribute.match(/spellcasting\.slots\.circle-(\d+)(?:\.|$)/)?.[1];
			if ( circle ) label = CONFIG.BlackFlag.spellCircles()[Number(circle)];
		}
		if ( !label && actor ) label = foundry.utils.getProperty(actor.system, attribute)?.label;
		group = "BF.CONSUMPTION.Type.SpellSlots.Label";
	}

	// Movement
	else if ( attribute.startsWith("traits.movement.types.") ) {
		label = CONFIG.BlackFlag.movementTypes.localized[attribute.replace("traits.movement.types.", "")];
		group = "BF.Speed.Label";
	}

	// Senses
	else if ( attribute.startsWith("traits.senses.types.") ) {
		label = CONFIG.BlackFlag.senses.localized[attribute.replace("traits.senses.types.", "")];
		group = "BF.SENSES.Label[other]";
	}

	else {
		switch (attribute) {
			case "attributes.ac.flat":
			case "attributes.ac.value":
				label = "BF.ArmorClass.Label";
				break;
			case "attributes.cr":
				label = "BF.ChallengeRating.Label";
				break;
			case "attributes.death.failure":
				label = "BF.Death.Failure.Label";
				break;
			case "attributes.death.success":
				label = "BF.Death.Success.Label";
				break;
			case "attributes.exhaustion":
				label = "BF.Condition.Exhaustion.Level";
				break;
			case "attributes.hp.temp":
				label = "BF.HitPoint.Temp.LabelLong";
				break;
			case "attributes.hp":
			case "attributes.hp.value":
				label = "BF.HitPoint.Label[other]";
				break;
			case "initiative":
			case "attributes.initiative.mod":
				label = "BF.Initiative.Label";
				break;
			case "attributes.legendary.spent":
			case "attributes.legendary.value":
				label = "BF.ACTIVATION.Type.Legendary[other]";
				break;
			case "attributes.luck.value":
				label = "BF.Luck.Label";
				break;
			case "attributes.perception":
				label = "BF.Skill.Perception.Label";
				break;
			case "attributes.stealth":
				label = "BF.Skill.Stealth.Label";
				break;
			case "progression.xp":
			case "progression.xp.value":
				label = "BF.ExperiencePoints.Label";
				break;
			case "spellcasting.dc":
				label = "BF.Spellcasting.DC.Label";
				break;
			default:
				label = getSchemaLabel(attribute, "Actor", actor);
				break;
		} 
	}

	if ( !option ) option = {
		value: attribute,
		label: label ? game.i18n.localize(label) : attribute,
		group: group ? game.i18n.localize(group) : undefined
	};
	if ( label ) _attributeOptionCache[type].set(attribute, option);
	option = foundry.utils.deepClone(option);
	if ( name ) option.label = `${name} ${option.label}`;
	return option;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Cached store of Intl.PluralRules instances.
 * @type {Record<string, Intl.PluralRules>}
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

/* <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform pre-localization on the contents of a SchemaField. Necessary because the `localizeSchema` method
 * on `Localization` is private.
 * @param {SchemaField} schema
 * @param {string[]} prefixes
 */
export function localizeSchema(schema, prefixes) {
	Localization.localizeDataModel({ schema }, { prefixes });
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

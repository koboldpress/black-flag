import Advancement from "./documents/advancement/advancement.mjs";
import { log, simplifyBonus } from "./utils/_module.mjs";

/**
 * Set up system-specific enrichers.
 */
export function registerCustomEnrichers() {
	log("Registering custom enrichers");
	CONFIG.TextEditor.enrichers.push({
		pattern: /\[\[\/(?<type>check|damage|save|skill|tool) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
		enricher: enrichString
	}, {
		pattern: /&(?<type>Embed)\[(?<config>[^\]]+)\](?:{(?<label>[^}]+)})?/gi,
		enricher: enrichString
	});

	document.body.addEventListener("click", handleRollAction);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Parse config data from the provided string and call the appropriate enricher method.
 * @param {RegExpMatchArray} match - The regular expression match result.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {Promise<HTMLElement|null>}
 */
async function enrichString(match, options) {
	let { type, config, label } = match.groups;
	config = parseConfig(config);
	config.input = match[0];
	switch ( type.toLowerCase() ) {
		case "check":
		case "skill":
		case "tool": return enrichCheck(config, label, options);
		case "save": return enrichSave(config, label, options);
		case "damage": return enrichDamage(config, label, options);
		case "embed": return enrichEmbed(config, label, options);
	}
	return null;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Parse a string into a configuration object.
 * @param {string} match - Matched configuration string.
 * @returns {object}
 */
function parseConfig(match) {
	const config = { values: [] };
	for ( const part of match.match(/(?:[^\s"]+|"[^"]*")+/g) ) {
		if ( !part ) continue;
		const [key, value] = part.split("=");
		const valueLower = value?.toLowerCase();
		if ( value === undefined ) config.values.push(key.replace(/(^"|"$)/g, ""));
		else if ( ["true", "false"].includes(valueLower) ) config[key] = valueLower === "true";
		else if ( Number.isNumeric(value) ) config[key] = Number(value);
		else config[key] = value.replace(/(^"|"$)/g, "");
	}
	return config;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Element Creation                   */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a passive skill tag.
 * @param {string} label - Label to display.
 * @param {object} dataset - Data that will be added to the tag.
 * @returns {HTMLElement}
 */
function createPassiveTag(label, dataset) {
	const span = document.createElement("span");
	span.classList.add("passive-check");
	_addDataset(span, dataset);
	span.innerText = label;
	return span;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a rollable link.
 * @param {string} label - Label to display.
 * @param {object} dataset - Data that will be added to the link for the rolling method.
 * @returns {HTMLElement}
 */
function createRollLink(label, dataset) {
	const link = document.createElement("a");
	link.classList.add("roll-link");
	_addDataset(link, dataset);
	link.innerHTML = `<i class="fa-solid fa-dice-d20"></i> ${label}`;
	return link;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Add a dataset object to the provided element.
 * @param {HTMLElement} element - Element to modify.
 * @param {object} dataset - Data properties to add.
 * @private
 */
function _addDataset(element, dataset) {
	for ( const [key, value] of Object.entries(dataset) ) {
		if ( !["input", "values"].includes(key) && value ) element.dataset[key] = value;
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                     Event Handling                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform the provided roll action.
 * @param {Event} event - The click event triggering the action.
 * @returns {Promise|void}
 */
function handleRollAction(event) {
	const target = event.target.closest("[data-roll-action]");
	if ( !target ) return;
	event.stopPropagation();

	const action = target.dataset.rollAction;
	const speaker = ChatMessage.implementation.getSpeaker();

	switch ( action ) {
		case "ability-check":
		case "ability-save":
		case "skill":
		case "tool": return rollCheckSave(event, speaker);
		case "damage": return rollDamage(event, speaker);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                 Check & Save Enrichers                */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */


/**
 * Enrich an ability check link to perform a specific ability or skill check. If an ability is provided
 * along with a skill, then the skill check will always use the provided ability. Otherwise it will use
 * the character's default ability for that skill.
 * @param {string[]} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the check could be built, otherwise null.
 *
 * @example Create a dexterity check:
 * ```[[/check ability=dex]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="dex">
 *   <i class="fa-solid fa-dice-d20"></i> Dexterity check
 * </a>
 * ```
 *
 * @example Create an acrobatics check with a DC and default ability:
 * ```[[/check skill=acrobatics dc=20]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="dexterity" data-skill="acrobatics" data-dc="20">
 *   <i class="fa-solid fa-dice-d20"></i> DC 20 Dexterity (Acrobatics) check
 * </a>
 * ```
 *
 * @example Create an acrobatics check using strength:
 * ```[[/check ability=strength skill=acrobatics]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="strength" data-skill="acrobatics">
 *   <i class="fa-solid fa-dice-d20"></i> Strength (Acrobatics) check
 * </a>
 * ```
 *
 * @example Create a tool check:
 * ```[[/check tool=thievesTools ability=intelligence]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="intelligence" data-tool="thievesTools">
 *   <i class="fa-solid fa-dice-d20"></i> Intelligence (Thieves' Tools) check
 * </a>
 * ```
 *
 * @example Formulas used for DCs will be resolved using data provided to the description (not the roller):
 * ```[[/check ability=charisma dc=@abilities.int.dc]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="charisma" data-dc="15">
 *   <i class="fa-solid fa-dice-d20"></i> DC 15 Charisma check
 * </a>
 * ```
 */
async function enrichCheck(config, label, options) {
	for ( const value of config.values ) {
		if ( value in CONFIG.BlackFlag.enrichment.lookup.abilities ) config.ability = value;
		else if ( value in CONFIG.BlackFlag.enrichment.lookup.skills ) config.skill = value;
		else if ( value in CONFIG.BlackFlag.enrichment.lookup.tools ) config.tool = value;
		else if ( Number.isNumeric(value) ) config.dc = Number(value);
		else config[value] = true;
	}

	let invalid = false;

	const skillConfig = CONFIG.BlackFlag.enrichment.lookup.skills[config.skill];
	if ( config.skill && !skillConfig ) {
		log(`Skill ${config.skill} not found while enriching ${config.input}.`, { level: "warn" });
		invalid = true;
	} else if ( config.skill && !config.ability ) {
		config.ability = skillConfig.ability;
	}

	const toolConfig = CONFIG.BlackFlag.enrichment.lookup.tools[config.tool];
	if ( config.tool && !toolConfig ) {
		log(`Tool ${config.tool} not found while enriching ${config.input}.`, { level: "warn" });
		invalid = true;
	}

	let abilityConfig = CONFIG.BlackFlag.enrichment.lookup.abilities[config.ability];
	if ( config.ability && !abilityConfig ) {
		log(`Ability ${config.ability} not found while enriching ${config.input}.`, { level: "warn" });
		invalid = true;
	} else if ( !abilityConfig ) {
		log(`No ability provided while enriching check ${config.input}.`, { level: "warn" });
		invalid = true;
	}

	if ( config.dc && !Number.isNumeric(config.dc) ) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	if ( invalid ) return null;

	if ( !label ) {
		const ability = abilityConfig?.label;
		const skill = skillConfig?.label;
		const tool = toolConfig?.label;
		if ( ability && (skill || tool) ) {
			label = game.i18n.format("BF.Enricher.Check.Specific", { ability, type: skill ?? tool });
		} else {
			label = ability;
		}
		const longSuffix = config.format === "long" ? "Long" : "Short";
		if ( config.passive ) {
			label = game.i18n.format(`BF.Enricher.DC.Passive.${longSuffix}`, { dc: config.dc, check: label });
		} else {
			if ( config.dc ) label = game.i18n.format("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
			label = game.i18n.format(`BF.Enricher.Check.${longSuffix}`, { check: label });
		}
	}

	if ( config.passive ) return createPassiveTag(label, config);
	const rollAction = config.skill ? "skill" : config.tool ? "tool" : "ability-check";
	return createRollLink(label, { rollAction, ...config });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich a saving throw link.
 * @param {string[]} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.
 *
 * @example Create a dexterity saving throw:
 * ```[[/save ability=dexterity]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="save" data-key="dexterity">
 *   <i class="fa-solid fa-dice-d20"></i> Dexterity
 * </a>
 * ```
 *
 * @example Add a DC to the save:
 * ```[[/save ability=dexterity dc=20]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="save" data-key="dexterity" data-dc="20">
 *   <i class="fa-solid fa-dice-d20"></i> DC 20 Dexterity
 * </a>
 * ```
 */
async function enrichSave(config, label, options) {
	for ( const value of config.values ) {
		if ( value in CONFIG.BlackFlag.enrichment.lookup.abilities ) config.ability = value;
		else if ( Number.isNumeric(value) ) config.dc = Number(value);
		else config[value] = true;
	}

	const abilityConfig = CONFIG.BlackFlag.enrichment.lookup.abilities[config.ability];
	if ( !abilityConfig ) {
		log(`Ability ${config.ability} not found while enriching ${config.input}.`, { level: "warn" });
		return null;
	}

	if ( config.dc && !Number.isNumeric(config.dc) ) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	if ( !label ) {
		label = abilityConfig.label;
		if ( config.dc ) label = game.i18n.format("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
		label = game.i18n.format(`BF.Enricher.DC.Save.${config.format === "long" ? "Long" : "Short"}`, {
			save: label
		});
	}

	return createRollLink(label, { rollAction: "ability-save", ...config });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform a check or save roll.
 * @param {Event} event - The click event triggering the action.
 * @param {TokenDocument} speaker - Currently selected token.
 * @returns {Promise|void}
 */
function rollCheckSave(event, speaker) {
	// Fetch the actor that should perform the roll
	let actor;
	if ( speaker.token ) actor = game.actors.tokens[speaker.token];
	actor ??= game.actors.get(speaker.actor);
	if ( !actor ) {
		ui.notifications.warn(game.i18n.localize("BF.Enricher.Warning.NoActor"));
		return;
	}

	const target = event.target.closest("[data-roll-action]");
	const { rollAction, dc, ...data } = target.dataset;
	const rollConfig = { event, ...data };
	if ( dc ) rollConfig.options = { target: dc };

	return actor.roll(rollAction, rollConfig);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Damage Enricher                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich a damage link.
 * @param {string[]} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.
 *
 * @example Create a damage link:
 * ```[[/damage 2d6 type=bludgeoning]]``
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="damage" data-formula="2d6" data-type="bludgeoning">
 *   <i class="fa-solid fa-dice-d20"></i> 2d6
 * </a> bludgeoning
 * ````
 *
 * @example Display the average:
 * ```[[/damage 2d6 type=bludgeoning average=true]]``
 * becomes
 * ```html
 * 7 (<a class="roll-action" data-roll-action="damage" data-formula="2d6" data-type="bludgeoning">
 *   <i class="fa-solid fa-dice-d20"></i> 2d6
 * </a>) bludgeoning
 * ````
 *
 * @example Manually set the average & don't prefix the type:
 * ```[[/damage 8d4dl force average=666]]``
 * becomes
 * ```html
 * 666 (<a class="roll-action" data-roll-action="damage" data-formula="8d4dl" data-type="force">
 *   <i class="fa-solid fa-dice-d20"></i> 8d4dl
 * </a> force
 * ````
 */
async function enrichDamage(config, label, options) {
	for ( const value of config.values ) {
		if ( value in CONFIG.BlackFlag.damageTypes ) config.type = value;
		else if ( value === "average" ) config.average = true;
		else config.formula = value;
	}
	config.formula = Roll.defaultImplementation.replaceFormulaData(config.formula, options.rollData ?? {});
	if ( !config.formula ) return null;
	config.rollAction = "damage";

	if ( label ) return createRollLink(label, config);

	const localizationData = {
		formula: createRollLink(config.formula, config).outerHTML,
		type: game.i18n.localize(CONFIG.BlackFlag.damageTypes[config.type]?.label ?? "").toLowerCase()
	};

	let localizationType = "Short";
	if ( config.average ) {
		localizationType = "Long";
		if ( config.average === true ) {
			const minRoll = Roll.create(config.formula).evaluate({ minimize: true, async: true });
			const maxRoll = Roll.create(config.formula).evaluate({ maximize: true, async: true });
			localizationData.average = Math.floor((await minRoll.total + await maxRoll.total) / 2);
		} else if ( Number.isNumeric(config.average) ) {
			localizationData.average = config.average;
		} else {
			localizationType = "Short";
		}
	}

	const span = document.createElement("span");
	span.innerHTML = game.i18n.format(`BF.Enricher.Damage.${localizationType}`, localizationData);
	return span;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform a damage roll.
 * @param {Event} event - The click event triggering the action.
 * @param {TokenDocument} [speaker] - Currently selected token, if one exists.
 * @returns {Promise|void}
 */
async function rollDamage(event, speaker) {
	const target = event.target.closest(".roll-link");
	const { formula, type } = target.dataset;

	const rollConfigs = [{
		parts: [formula],
		type,
		event
	}];

	const title = game.i18n.format("BF.Roll.Type.Label", { type: game.i18n.localize("BF.Damage.Label") });
	const messageConfig = {
		data: {
			flavor: title,
			event,
			title,
			speaker,
			"flags.black-flag.roll.type": "damage"
		}
	};

	const dialogConfig = {};

	if ( Hooks.call("blackFlag.preRollDamage", undefined, rollConfigs, messageConfig, dialogConfig) === false ) return;
	const rolls = await CONFIG.Dice.DamageRoll.build(rollConfigs, messageConfig, dialogConfig);
	if ( rolls?.length ) Hooks.callAll("blackFlag.postRollDamage", undefined, rolls);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Embed Enrichers                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

const MAX_EMBED_DEPTH = 5;

/**
 * Enrich an embedded document.
 * @param {string[]} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.
 */
async function enrichEmbed(config, label, options) {
	options._embedDepth ??= 0;
	if ( options._embedDepth > MAX_EMBED_DEPTH ) {
		log(`Embed enrichers are restricted to ${MAX_EMBED_DEPTH} levels deep. ${
			config.input} cannot be enriched fully.`, { level: "warn" });
		return null;
	}

	for ( const value of config.values ) {
		if ( value === "features" ) config.features = true;
		if ( config.uuid ) break;
		try {
			const parsed = foundry.utils.parseUuid(value);
			if ( parsed.documentId ) config.uuid = value;
		} catch(err) {}
	}

	// Find the first GrantFeatures or ChooseFeatures advancement on the item
	let doc;
	if ( !config.uuid && config.features ) {
		const advancementCollection = options.relativeTo?.system?.advancement;
		doc = advancementCollection?.find(a => ["grantFeatures", "chooseFeatures"].includes(a.metadata.type));
		if ( !doc ) {
			log(`No advancement found to use when embedding features for ${config.input}.`, { level: "warn" });
			return null;
		}
	}

	doc ??= await fromUuid(config.uuid, { relative: options.relativeTo });
	let element;
	if ( doc instanceof Advancement ) element = await doc.embed(config, label, options);
	else if ( doc instanceof JournalEntryPage ) element = await enrichEmbedJournalEntryPage(doc, config, label, options);
	if ( element ) {
		element.classList.add("embedded-content");
		return element;
	}

	if ( !doc ) log(`No document can be found to embed for ${config.input}.`, { level: "warn" });
	else log(`Cannot embed a ${doc.constructor.name} document for ${config.input}.`, { level: "warn" });
	return null;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich an embedded journal entry page.
 * @param {JournalEntryPage} page - The page being embedded.
 * @param {string[]} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.
 *
 * @example Create an embedded image from the UUID of an Image Journal Entry Page:
 * ```@Embed[uuid=.QnH8yGIHy4pmFBHR classes="small right"]```
 * becomes
 * ```html
 * <figure class="small right">
 *   <img src="assets/image.png">
 *   <figcaption>A caption for the image
 *     <cite>
 *       <a class="content-link" draggable="true"
 *          data-uuid="JournalEntry.xFNPjbSEDbWjILNj.JournalEntryPage.QnH8yGIHy4pmFBHR"
 *          data-id="QnH8yGIHy4pmFBHR" data-type="JournalEntryPage" data-tooltip="Image Page">
 *         <i class="fas fa-file-image"></i> Image Page
 *       </a>
 *     </cite>
 *   </figcaption>
 * </figure>
 * ```
 * @example Embed the content of the Journal Entry Page inline with the given UUID:
 * ```@Embed[uuid=JournalEntry.xFNPjbSEDbWjILNj.JournalEntryPage.QnH8yGIHy4pmFBHR inline]```
 * becomes
 * ```html
 * <section>
 *   <p>The contents of the page</p>
 * </section>
 * ```
 */
async function enrichEmbedJournalEntryPage(page, config, label, options) {
	const showCitation = config.cite !== false;
	const createCaption = (figure, captionText) => {
		const caption = document.createElement("figcaption");
		if ( captionText ) caption.innerHTML += captionText;
		if ( showCitation ) caption.innerHTML += `<cite>${page.toAnchor().outerHTML}</cite>`;
		figure.insertAdjacentElement("beforeend", caption);
	};

	if ( page.type === "image" ) {
		const showCaption = config.caption !== false;

		const figure = document.createElement("figure");
		if ( config.classes ) figure.classList = config.classes;
		figure.innerHTML = `<img src="${page.src}" alt="${config.alt || label || page.name}">`;
		if ( showCaption || showCitation ) createCaption(figure, showCaption ? (label || page.image.caption) : null);

		return figure;
	}

	if ( page.type === "text" ) {
		config.inline ??= config.values.includes("inline");
		const enriched = await TextEditor.enrichHTML(page.text.content, {
			...options, _embedDepth: options._embedDepth + 1
		});

		if ( config.inline ) {
			const section = document.createElement("section");
			section.innerHTML = enriched;
			return section;
		}

		const figure = document.createElement("figure");
		figure.innerHTML = enriched;
		if ( config.classes ) figure.classList = config.classes;
		if ( label || showCitation ) createCaption(figure, label);

		return figure;
	}

	else {
		return null;
	}
}

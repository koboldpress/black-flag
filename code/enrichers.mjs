import { log } from "./utils/_module.mjs";

/**
 * Set up system-specific enrichers.
 */
export function registerCustomEnrichers() {
	log("Registering custom enrichers");
	CONFIG.TextEditor.enrichers.push({
		pattern: /\[\[\/(?<type>check|damage|save|skill|tool) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
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
		case "damage": return enrichDamage(config, label, options);
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
		case "damage":
			return rollDamage(event, speaker);
	}
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
 * <a class="roll-action" data-type="damage" data-formula="2d6" data-damage-type="bludgeoning">
 *   <i class="fa-solid fa-dice-d20"></i> 2d6
 * </a> bludgeoning
 * ````
 *
 * @example Display the average:
 * ```[[/damage 2d6 type=bludgeoning average=true]]``
 * becomes
 * ```html
 * 7 (<a class="roll-action" data-type="damage" data-formula="2d6" data-damage-type="bludgeoning">
 *   <i class="fa-solid fa-dice-d20"></i> 2d6
 * </a>) bludgeoning
 * ````
 *
 * @example Manually set the average & don't prefix the type:
 * ```[[/damage 8d4dl force average=666]]``
 * becomes
 * ```html
 * 666 (<a class="roll-action" data-type="damage" data-formula="8d4dl" data-damage-type="force">
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

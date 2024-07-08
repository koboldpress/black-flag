import { getSelectedTokens, log, simplifyBonus } from "./utils/_module.mjs";

/**
 * Set up system-specific enrichers.
 */
export function registerCustomEnrichers() {
	log("Registering custom enrichers");
	CONFIG.TextEditor.enrichers.push(
		{
			pattern:
				/\[\[\/(?<type>attack|check|damage|healing|save|skill|tool)(?<config> [^\]]+)?]](?:{(?<label>[^}]+)})?/gi,
			enricher: enrichString
		},
		{
			pattern: /\[\[(?<type>calc|lookup) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
			enricher: enrichString
		},
		{
			// TODO: Remove when v11 support is dropped
			pattern: /@(?<type>Embed)\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gi,
			enricher: enrichString
		},
		{
			pattern: /~def\[([^\]]+)]/gi,
			enricher: (match, options) => {
				const dnf = document.createElement("dfn");
				dnf.innerText = match[1];
				return dnf;
			}
		}
	);

	document.body.addEventListener("click", handleActivation);
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
	config = parseConfig(config, { multiple: ["damage", "healing"].includes(type) });
	config._input = match[0];
	switch (type.toLowerCase()) {
		case "attack":
			return enrichAttack(config, label, options);
		case "calc":
			return enrichCalculation(config, label, options);
		case "check":
		case "skill":
		case "tool":
			return enrichCheck(config, label, options);
		case "lookup":
			return enrichLookup(config, label, options);
		case "save":
			return enrichSave(config, label, options);
		case "healing":
			config._isHealing = true;
		case "damage":
			return enrichDamage(config, label, options);
		case "embed":
			return enrichEmbed(config, label, options);
	}
	return null;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Parse a string into a configuration object.
 * @param {string} match - Matched configuration string.
 * @param {object} [options={}]
 * @param {boolean} [options.multiple=false] - Support splitting the configuration by "&". If `true` then an array of
 *                                             configs will be returned rather than a single object.
 * @returns {object|object[]}
 */
function parseConfig(match = "", { multiple = false } = {}) {
	if (multiple) return match.split("&").map(s => parseConfig(s));
	const config = { values: [] };
	for (const part of match.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []) {
		if (!part) continue;
		const [key, value] = part.split("=");
		const valueLower = value?.toLowerCase();
		if (value === undefined) config.values.push(key.replace(/(^"|"$)/g, ""));
		else if (["true", "false"].includes(valueLower)) config[key] = valueLower === "true";
		else if (Number.isNumeric(value)) config[key] = Number(value);
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
 * Create a rollable link with a request section for GMs.
 * @param {string} label - Label to display
 * @param {object} dataset - Data that will be added to the link for the rolling method.
 * @returns {HTMLElement}
 */
function createRequestLink(label, dataset) {
	const span = document.createElement("span");
	span.classList.add("roll-link-group");
	_addDataset(span, dataset);
	span.insertAdjacentElement("afterbegin", createRollLink(label));

	// Add chat request link for GMs
	if (game.user.isGM) {
		const gmLink = document.createElement("a");
		gmLink.classList.add("extra-link");
		gmLink.dataset.request = true;
		gmLink.dataset.tooltip = "BF.Enricher.Request.Action";
		gmLink.setAttribute("aria-label", game.i18n.localize(gmLink.dataset.tooltip));
		gmLink.innerHTML = '<i class="fa-solid fa-comment-dots" inert></i>';
		span.insertAdjacentElement("beforeend", gmLink);
	}

	return span;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a rollable link.
 * @param {string} label - Label to display.
 * @param {object} [dataset={}] - Data that will be added to the link for the rolling method.
 * @param {object} [options={}]
 * @param {string} [options.classes="roll-link"] - Class to add to the link.
 * @param {string} [options.tag="a"] - Tag to use for the link.
 * @returns {HTMLElement}
 */
function createRollLink(label, dataset = {}, { classes = "roll-link", tag = "a" } = {}) {
	const link = document.createElement(tag);
	link.className = classes;
	_addDataset(link, dataset);
	link.innerHTML = `<i class="fa-solid fa-dice-d20" inert></i> ${label}`;
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
	for (const [key, value] of Object.entries(dataset)) {
		if (key.startsWith("_") || key === "values" || !value) continue;
		if (["Array", "Object"].includes(foundry.utils.getType(value))) element.dataset[key] = JSON.stringify(value);
		else element.dataset[key] = value;
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                     Event Handling                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Activate an activity.
 * @param {Event} event - The click event triggering the action.
 */
async function handleActivation(event) {
	const activity = await fromUuid(event.target.closest("[data-activity-uuid]")?.dataset.activityUuid);
	if (activity) {
		event.stopPropagation();
		activity.activate();
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform the provided roll action.
 * @param {Event} event - The click event triggering the action.
 * @returns {Promise|void}
 */
function handleRollAction(event) {
	const target = event.target.closest("[data-roll-action]");
	if (!target) return;
	event.stopPropagation();

	if (event.target.closest('[data-request="true"]')) return requestCheckSave(event);

	switch (target.dataset.rollAction) {
		case "ability-check":
		case "ability-save":
		case "skill":
		case "tool":
			return rollCheckSave(event);
		case "attack":
			return rollAttack(event);
		case "damage":
			return rollDamage(event);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Attack Enricher                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich an attack link, using a pre-set to hit value or determining it from the enriching item or activity.
 * @param {object} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.}
 *
 * @example Create an attack link using a fixed to hit:
 * ```[[/attack +5]]``` or ```[[/attack formula=5]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="attack" data-formula="+5">
 *   <i class="fa-solid fa-dice-d20" inert></i> +5
 * </a> to hit
 * ```
 *
 * @example Create an attack link using the attack from the item:
 * ```[[/attack]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="attack" data-activity="...uuid...">
 *   <i class="fa-solid fa-dice-d20" inert></i> +8
 * </a> to hit
 * ```
 */
async function enrichAttack(config, label, options) {
	const formulaParts = [];
	if (config.formula) formulaParts.push(config.formula);
	for (const value of config.values) formulaParts.push(value);
	config.formula = Roll.defaultImplementation.replaceFormulaData(formulaParts.join(" "), options.rollData ?? {});
	if (!config.formula) {
		const { formula, activity } = options.relativeTo?.getAttackDetails?.(config) ?? {};
		config.formula = formula || "+0";
		if (activity) config.activity = activity.uuid;
	}
	// TODO: Simplify formula as must as possible for display
	// TODO: Improve this logic
	if (!config.formula.startsWith("+") && !config.formula.startsWith("-")) config.formula = `+${config.formula}`;
	config.rollAction = "attack";

	if (label) return createRollLink(label, config);

	const span = document.createElement("span");
	span.innerHTML = game.i18n.format("BF.Enricher.Attack.Long", {
		formula: createRollLink(config.formula, config).outerHTML
	});
	return span;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform an attack roll.
 * @param {Event} event - The click event triggering the action.
 * @returns {Promise|void}
 */
async function rollAttack(event) {
	const target = event.target.closest("[data-roll-action]");
	const { formula, activity: activityUuid } = target.dataset;

	if (activityUuid) {
		const activity = await fromUuid(activityUuid);
		if (activity) return activity.rollAttack();
	}

	const rollConfig = {
		event,
		rolls: [{ parts: [formula.replace(/^\s*\+\s*/, "")] }]
	};

	const dialogConfig = {};

	const title = game.i18n.format("BF.Roll.Type.Label", { type: game.i18n.localize("BF.Attack.Label") });
	const messageConfig = {
		data: {
			flavor: title,
			title,
			speaker: ChatMessage.implementation.getSpeaker(),
			"flags.black-flag.roll.type": "attack"
		}
	};

	if (Hooks.call("blackFlag.preRollAttack", rollConfig, dialogConfig, messageConfig) === false) return;
	const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);
	if (rolls?.length) Hooks.callAll("blackFlag.postRollAttack", this, rolls);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                  Calculation Enricher                 */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich a pre-resolved deterministic calculation
 * @param {object} config - Configuration data.
 * @param {string} [fallback] - Optional fallback if the value couldn't be found.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML element if the calculation could be built, otherwise null.
 *
 * @example Include a NPC's modified perception value:
 * ```The creature's perception is [[calc @attributes.perception + 5]] while perceiving with hearing or smell.``
 * becomes
 * ```html
 * The creature's perception is <span class="calculated-value">17</span> while perceiving with hearing or smell.
 * ```
 */
function enrichCalculation(config, fallback, options) {
	const formulaParts = [];
	if (config.formula) formulaParts.push(config.formula);
	formulaParts.push(...config.values);
	const roll = new Roll(
		formulaParts.join(" "),
		options.rollData ?? options.relativeTo?.getRollData({ deterministic: true })
	);

	if (!roll.isDeterministic) {
		log(`Non-deterministic formula found while enriching ${config._input}.`, { level: "warn" });
		return null;
	}

	if (game.release.generation < 12) roll.evaluate({ async: false });
	else roll.evaluateSync();

	const span = document.createElement("span");
	span.classList.add("calculation-value");
	span.innerText = roll.total;
	return span;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                 Check & Save Enrichers                */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a roll label for a check or save.
 * @param {object} config - Enricher configuration data.
 * @returns {string}
 */
function createRollLabel(config) {
	const ability = CONFIG.BlackFlag.abilities.localizedAbbreviations[config.ability]?.toUpperCase();
	const skill = CONFIG.BlackFlag.skills.localized[config.skill];
	const tool = CONFIG.BlackFlag.enrichment.lookup.tools[config.tool]?.label;
	const longSuffix = config.format === "long" ? "Long" : "Short";
	const showDC = config.dc && !config.hideDC;

	let label;
	switch (config.rollAction) {
		case "ability-check":
		case "skill":
		case "tool":
			if (ability && (skill || tool)) {
				label = game.i18n.format("BF.Enricher.Check.Specific", { ability, type: skill ?? tool });
			} else {
				label = ability;
			}
			if (config.passive) {
				label = game.i18n.format(`BF.Enricher.DC.Passive.${longSuffix}`, { dc: config.dc, check: label });
			} else {
				if (showDC) label = game.i18n.format("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
				label = game.i18n.format(`BF.Enricher.Check.${longSuffix}`, { check: label });
			}
			break;
		case "ability-save":
			label = (ability ?? config.ability).toUpperCase();
			if (showDC) label = game.i18n.format("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
			label = game.i18n.format(`BF.Enricher.Save.${longSuffix}`, { save: label });
			break;
		default:
			return "";
	}

	// TODO: Icon

	return label;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich an ability check link to perform a specific ability or skill check. If an ability is provided
 * along with a skill, then the skill check will always use the provided ability. Otherwise it will use
 * the character's default ability for that skill.
 * @param {object} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the check could be built, otherwise null.
 *
 * @example Create a dexterity check:
 * ```[[/check ability=dex]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="dex">
 *   <i class="fa-solid fa-dice-d20" inert></i> Dexterity check
 * </a>
 * ```
 *
 * @example Create an acrobatics check with a DC and default ability:
 * ```[[/check skill=acrobatics dc=20]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="dexterity" data-skill="acrobatics" data-dc="20">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 20 Dexterity (Acrobatics) check
 * </a>
 * ```
 *
 * @example Create an acrobatics check using strength:
 * ```[[/check ability=strength skill=acrobatics]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="strength" data-skill="acrobatics">
 *   <i class="fa-solid fa-dice-d20" inert></i> Strength (Acrobatics) check
 * </a>
 * ```
 *
 * @example Create a tool check:
 * ```[[/check tool=thievesTools ability=intelligence]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="intelligence" data-tool="thievesTools">
 *   <i class="fa-solid fa-dice-d20" inert></i> Intelligence (Thieves' Tools) check
 * </a>
 * ```
 *
 * @example Formulas used for DCs will be resolved using data provided to the description (not the roller):
 * ```[[/check ability=charisma dc=@abilities.int.dc]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="charisma" data-dc="15">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 15 Charisma check
 * </a>
 * ```
 */
async function enrichCheck(config, label, options) {
	const LOOKUP = CONFIG.BlackFlag.enrichment.lookup;
	for (const value of config.values) {
		if (value in LOOKUP.abilities) config.ability = LOOKUP.abilities[value].key;
		else if (value in LOOKUP.skills) config.skill = LOOKUP.skills[value].key;
		else if (value in LOOKUP.tools) config.tool = value;
		else if (Number.isNumeric(value)) config.dc = Number(value);
		else config[value] = true;
	}

	let invalid = false;

	const skillConfig = CONFIG.BlackFlag.enrichment.lookup.skills[config.skill];
	if (config.skill && !skillConfig) {
		log(`Skill ${config.skill} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	} else if (config.skill && !config.ability) {
		config.ability = skillConfig.ability;
	}

	const toolConfig = CONFIG.BlackFlag.enrichment.lookup.tools[config.tool];
	if (config.tool && !toolConfig) {
		log(`Tool ${config.tool} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	}

	let abilityConfig = CONFIG.BlackFlag.enrichment.lookup.abilities[config.ability];
	if (config.ability && !abilityConfig) {
		log(`Ability ${config.ability} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	} else if (!abilityConfig) {
		log(`No ability provided while enriching check ${config._input}.`, { level: "warn" });
		invalid = true;
	}

	if (config.dc && !Number.isNumeric(config.dc)) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	if (invalid) return null;

	config.rollAction = config.skill ? "skill" : config.tool ? "tool" : "ability-check";
	label ??= createRollLabel(config);
	if (config.passive) return createPassiveTag(label, config);
	return createRequestLink(label, config);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich a saving throw link.
 * @param {object} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.
 *
 * @example Create a dexterity saving throw:
 * ```[[/save ability=dexterity]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="save" data-key="dexterity">
 *   <i class="fa-solid fa-dice-d20" inert></i> DEX
 * </a>
 * ```
 *
 * @example Add a DC to the save:
 * ```[[/save ability=dexterity dc=20]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="save" data-key="dexterity" data-dc="20">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 20 DEX
 * </a>
 * ```
 *
 * @example Empty enricher fetches details from item or activity.
 * ```[[/save]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="save" data-key="dexterity" data-dc="20" data-activity="...uuid...">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 20 DEX
 * </a>
 * ```
 */
async function enrichSave(config, label, options) {
	for (const value of config.values) {
		if (value in CONFIG.BlackFlag.enrichment.lookup.abilities) config.ability = value;
		else if (Number.isNumeric(value)) config.dc = Number(value);
		else config[value] = true;
	}
	if (!config.ability) {
		const { ability, dc, activity } = options.relativeTo?.getSaveDetails?.(config) ?? {};
		config.ability = ability;
		config.dc ??= dc;
		if (activity) config.activity = activity.uuid;
	}

	const abilityConfig = CONFIG.BlackFlag.enrichment.lookup.abilities[config.ability];
	if (!abilityConfig) {
		log(`Ability ${config.ability} not found while enriching ${config._input}.`, { level: "warn" });
		return null;
	}

	if (config.dc && !Number.isNumeric(config.dc)) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	config.rollAction = "ability-save";
	return createRequestLink(label || createRollLabel(config), config);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a roll request chat message for a check or save roll.
 * @param {Event} event - The click event triggering the action.
 * @returns {Promise|void}
 */
async function requestCheckSave(event) {
	const target = event.target.closest("[data-roll-action]");
	const MessageClass = getDocumentClass("ChatMessage");
	const chatData = {
		user: game.user.id,
		content: await renderTemplate("systems/black-flag/templates/chat/request-card.hbs", {
			buttonLabel: createRollLabel({ ...target.dataset, format: "long", icon: true }),
			hiddenLabel: createRollLabel({ ...target.dataset, format: "long", icon: true, hideDC: true }),
			dataset: { ...target.dataset, action: "rollRequest" }
		}),
		flavor: game.i18n.localize("BF.Enricher.Request.Title"),
		speaker: MessageClass.getSpeaker({ user: game.user })
	};
	// TODO: Remove when v11 support is dropped
	if (game.release.generation < 12) chatData.type = CONST.CHAT_MESSAGE_TYPES.OTHER;
	return MessageClass.create(chatData);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform a check or save roll.
 * @param {Event} event - The click event triggering the action.
 * @returns {Promise|void}
 */
async function rollCheckSave(event) {
	const target = event.target.closest("[data-roll-action]");
	const { activity: activityUuid } = target.dataset;

	if (activityUuid) {
		const activity = await fromUuid(activityUuid);
		if (activity) return activity.rollSavingThrow();
	}

	target.disabled = true;
	try {
		const actors = new Set(getSelectedTokens().map(t => t.actor));
		if (!actors.size) {
			ui.notifications.warn(game.i18n.localize("BF.Enricher.Warning.NoActor"));
			return;
		}

		for (const actor of actors) {
			const { rollAction, dc, ...data } = target.dataset;
			const rollConfig = { event, ...data };
			if (dc) rollConfig.target = Number(dc);
			await actor.roll(rollAction, rollConfig);
		}
	} finally {
		target.disabled = false;
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Damage Enricher                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich a damage link.
 * @param {object[]} configs - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.
 *
 * @example Create a damage link:
 * ```[[/damage 2d6 type=bludgeoning]]``
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="damage" data-formulas="["2d6"]" data-types="["bludgeoning"]">
 *   <i class="fa-solid fa-dice-d20" inert></i> 2d6
 * </a> bludgeoning
 * ````
 *
 * @example Display the average:
 * ```[[/damage 2d6 type=bludgeoning average=true]]``
 * becomes
 * ```html
 * 7 (<a class="roll-action" data-roll-action="damage" data-formulas="["2d6"]" data-types="["bludgeoning"]">
 *   <i class="fa-solid fa-dice-d20" inert></i> 2d6
 * </a>) bludgeoning
 * ````
 *
 * @example Manually set the average & don't prefix the type:
 * ```[[/damage 8d4dl force average=666]]``
 * becomes
 * ```html
 * 666 (<a class="roll-action" data-roll-action="damage" data-formulas="["8d4dl"]" data-types="["force"]">
 *   <i class="fa-solid fa-dice-d20" inert></i> 8d4dl
 * </a> force
 * ````
 *
 * @example Use two different damage types:
 * ```[[/damage 1d6 + 5 slashing & 2d6 fire average]]```
 * becomes
 * ```html
 * <a class="unlink" data-roll-action="damage" data-formulas="["1d6","2d6"]" data-types="["bludgeoning","fire"]"
 *    data-average="true">
 *   3 (<span class="roll-link"><i class="fa-solid fa-dice-d20" inert></i> 1d6 + 5</span>) bludgeoning plus
 *   7 (<span class="roll-link"><i class="fa-solid fa-dice-d20" inert></i> 2d6</span>) fire
 * </a>
 * ```
 *
 * @example Create a healing link:
 * ```[[/healing 2d6]]``` or ```[[/damage 2d6 healing]]```
 * becomes
 * ```html
 * <a class="unlink" data-roll-action="damage" data-formulas="["2d6"]" data-types="["healing"]">
 *   <i class="fa-solid fa-dice-d20" inert></i> 2d6
 * </a> healing
 * ```
 */
async function enrichDamage(configs, label, options) {
	const config = { rollAction: "damage", formulas: [], types: [] };
	for (const c of configs) {
		const formulaParts = [];
		if (c.average) config.average = c.average;
		if (c.formula) formulaParts.push(c.formula);
		for (const value of c.values) {
			if (value in CONFIG.BlackFlag.damageTypes) c.type = value;
			else if (value in CONFIG.BlackFlag.healingTypes) c.type = value;
			else if (value === "average") config.average = true;
			else if (value === "versatile") config.versatile = true;
			else formulaParts.push(value);
		}
		c.formula = Roll.defaultImplementation.replaceFormulaData(formulaParts.join(" "), options.rollData ?? {});
		c.type = c.type ?? (configs._isHealing ? "healing" : null);
		if (c.formula) {
			config.formulas.push(c.formula);
			config.types.push(c.type);
		}
	}

	if (!config.formulas.length) {
		const damageDetails = options.relativeTo?.getDamageDetails?.(config);
		for (const r of damageDetails?.rolls ?? []) {
			// TODO: Simplify formula as must as possible for display
			const formula = Roll.defaultImplementation.replaceFormulaData(r.parts.join(" + "), r.data, { missing: "0" });
			if (formula) {
				config.formulas.push(formula);
				config.types.push(r.options.damageType);
			}
		}
		config.activity = damageDetails?.activity?.uuid;
	}

	if (!config.formulas.length) return null;

	if (label) return createRollLink(label, config);

	const parts = [];
	for (const [idx, formula] of config.formulas.entries()) {
		const type = config.types[idx];
		const typeConfig = CONFIG.BlackFlag.damageTypes[type] ?? CONFIG.BlackFlag.healingTypes[type];
		const localizationData = {
			formula: createRollLink(formula, {}, { tag: "span" }).outerHTML,
			type: game.i18n.localize(typeConfig?.label ?? "").toLowerCase()
		};

		let localizationType = "Short";
		if (config.average) {
			localizationType = "Long";
			if (config.average === true) {
				const minRoll = Roll.create(formula).evaluate({ minimize: true });
				const maxRoll = Roll.create(formula).evaluate({ maximize: true });
				localizationData.average = Math.floor(((await minRoll).total + (await maxRoll).total) / 2);
			} else if (Number.isNumeric(config.average)) {
				localizationData.average = config.average;
			} else {
				localizationType = "Short";
			}
		}

		parts.push(game.i18n.format(`BF.Enricher.Damage.${localizationType}`, localizationData));
	}

	const link = document.createElement("a");
	link.className = "unlink";
	_addDataset(link, config);
	if (config.average && parts.length === 2) {
		link.innerHTML = game.i18n.format("BF.Enricher.Damage.Double", { first: parts[0], second: parts[1] });
	} else {
		link.innerHTML = game.i18n.getListFormatter().format(parts);
	}
	return link;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform a damage roll.
 * @param {Event} event - The click event triggering the action.
 * @returns {Promise|void}
 */
async function rollDamage(event) {
	const target = event.target.closest("[data-roll-action]");
	let { formulas, types, activity: activityUuid } = target.dataset;
	formulas = JSON.parse(formulas);
	types = JSON.parse(types);

	if (activityUuid) {
		const activity = await fromUuid(activityUuid);
		if (activity) return activity.rollDamage();
	}

	const rollConfig = {
		event,
		rolls: formulas.map((formula, idx) => ({ parts: [formula], options: { damageType: types[idx] } }))
	};

	const dialogConfig = {};

	const title = game.i18n.format("BF.Roll.Type.Label", { type: game.i18n.localize("BF.Damage.Label") });
	const messageConfig = {
		data: {
			flavor: title,
			title,
			speaker: ChatMessage.implementation.getSpeaker(),
			"flags.black-flag.roll.type": "damage"
		}
	};

	if (Hooks.call("blackFlag.preRollDamage", rollConfig, dialogConfig, messageConfig) === false) return;
	const rolls = await CONFIG.Dice.DamageRoll.build(rollConfig, dialogConfig, messageConfig);
	if (rolls?.length) Hooks.callAll("blackFlag.postRollDamage", rolls);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Embed Enrichers                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

const MAX_EMBED_DEPTH = 5;

/**
 * Enrich an embedded document.
 * @param {object} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link if the save could be built, otherwise null.
 */
async function enrichEmbed(config, label, options) {
	options._embedDepth ??= 0;
	if (options._embedDepth > MAX_EMBED_DEPTH) {
		log(
			`Embed enrichers are restricted to ${MAX_EMBED_DEPTH} levels deep. ${config._input} cannot be enriched fully.`,
			{ level: "warn" }
		);
		return null;
	}

	config = foundry.utils.mergeObject({ cite: true, caption: true, inline: config.values.includes("inline") }, config);

	for (const value of config.values) {
		if (config.uuid) break;
		try {
			const parsed = foundry.utils.parseUuid(value, { relative: options.relativeTo });
			if ((game.release.generation < 12 && parsed.embedded?.length) || parsed.documentId) config.uuid = value;
		} catch (err) {}
	}

	config.doc = await fromUuid(config.uuid, { relative: options.relativeTo });
	// Special backported handling of journal pages
	if (config.doc instanceof JournalEntryPage) {
		switch (config.doc.type) {
			case "image":
				return embedImagePage(config, label, options);
			case "text":
			case "rule":
				return embedTextPage(config, label, options);
		}
	} else if (config.doc instanceof RollTable) return embedRollTable(config, label, options);
	// Forward everything else to documents
	else if (foundry.utils.getType(config.doc?.toEmbed) === "function") {
		const doc = config.doc;
		delete config.doc;
		return doc.toEmbed({ ...config, label }, options);
	} else log(`No document can be found to embed for ${config._input}.`, { level: "warn" });

	return null;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Embed an image page.
 * @param {object} config - Configuration data.
 * @param {string} [label] - Optional label to replace the default caption.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML figure containing the image, caption from the image page or a custom
 *                               caption, and a link to the source if it could be built, otherwise null.
 */
function embedImagePage(config, label, options) {
	const showCaption = config.caption !== false;
	const showCite = config.cite !== false;
	const caption = label || config.doc.image.caption || config.doc.name;

	const figure = document.createElement("figure");
	if (config.classes) figure.className = config.classes;
	figure.classList.add("content-embed");
	figure.innerHTML = `<img src="${config.doc.src}" alt="${config.alt || caption}">`;

	if (showCaption || showCite) {
		const figcaption = document.createElement("figcaption");
		if (showCaption) figcaption.innerHTML += `<strong class="embed-caption">${caption}</strong>`;
		if (showCite) figcaption.innerHTML += `<cite>${config.doc.toAnchor().outerHTML}</cite>`;
		figure.insertAdjacentElement("beforeend", figcaption);
	}
	return figure;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Embed a text page.
 * @param {object} config - Configuration data.
 * @param {string} [label] - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML element containing the content from the given page and a link to the
 *                               source if it could be built, otherwise null.
 */
async function embedTextPage(config, label, options) {
	options = { ...options, _embedDepth: options._embedDepth + 1, relativeTo: config.doc };
	config.inline ??= config.values.includes("inline");

	const enrichedPage = await TextEditor.enrichHTML(config.doc.text.content, options);
	if (config.inline) {
		const section = document.createElement("section");
		if (config.classes) section.className = config.classes;
		section.classList.add("content-embed");
		section.innerHTML = enrichedPage;
		if (label && section.children[0]) {
			const inlineCaption = document.createElement("strong");
			inlineCaption.classList.add("inline-caption");
			inlineCaption.innerText = label;
			section.children[0].insertAdjacentElement("afterbegin", inlineCaption);
		}
		return section;
	}

	const showCaption = config.caption !== false;
	const showCite = config.cite !== false;
	const caption = label || config.doc.name;
	const figure = document.createElement("figure");
	figure.innerHTML = enrichedPage;

	if (config.classes) figure.className = config.classes;
	figure.classList.add("content-embed");
	if (showCaption || showCite) {
		const figcaption = document.createElement("figcaption");
		if (showCaption) figcaption.innerHTML += `<strong class="embed-caption">${caption}</strong>`;
		if (showCite) figcaption.innerHTML += `<cite>${config.doc.toAnchor().outerHTML}</cite>`;
		figure.insertAdjacentElement("beforeend", figcaption);
	}

	return figure;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Embed a roll table.
 * @param {object} config -  Configuration data.
 * @param {string} label - Optional label to use as the table caption.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {Promise<HTMLElement|null>}
 */
async function embedRollTable(config, label, options) {
	options = { ...options, _embedDepth: options._embedDepth + 1, relativeTo: config.doc };
	config.inline ??= config.values.includes("inline");
	const results = config.doc.results.toObject();
	results.sort((a, b) => a.range[0] - b.range[0]);
	const table = document.createElement("table");
	table.classList.add("roll-table-embed");
	table.innerHTML = `
		<thead>
			<tr>
				<th>${game.i18n.localize("TABLE.Roll")}</th>
				<th>${game.i18n.localize("Result")}</th>
			</tr>
		</thead>
		<tbody></tbody>
	`;

	const getDocAnchor = (doc, resultData) => {
		if (doc) return doc.toAnchor().outerHTML;

		// No doc found, create a broken anchor.
		return `<a class="content-link broken"><i class="fas fa-unlink"></i>${
			resultData.text || game.i18n.localize("Unknown")
		}</a>`;
	};

	const tbody = table.querySelector("tbody");
	for (const data of results) {
		const { range, type, text, documentCollection, documentId } = data;
		const row = document.createElement("tr");
		const [lo, hi] = range;
		row.innerHTML += `<td>${lo === hi ? lo : `${lo}&mdash;${hi}`}</td>`;
		let result;
		switch (type) {
			case CONST.TABLE_RESULT_TYPES.TEXT:
				result = await TextEditor.enrichHTML(text, options);
				break;
			case CONST.TABLE_RESULT_TYPES.DOCUMENT: {
				const doc = CONFIG[documentCollection]?.collection.instance?.get(documentId);
				result = getDocAnchor(doc, data);
				break;
			}
			case CONST.TABLE_RESULT_TYPES.COMPENDIUM: {
				const doc = await game.packs.get(documentCollection)?.getDocument(documentId);
				result = getDocAnchor(doc, data);
				break;
			}
		}

		row.innerHTML += `<td>${result}</td>`;
		tbody.append(row);
	}

	if (config.inline) {
		const section = document.createElement("section");
		if (config.classes) section.className = config.classes;
		section.classList.add("content-embed");
		section.append(table);
		return section;
	}

	const showCaption = config.caption !== false;
	const showCite = config.cite !== false;
	const figure = document.createElement("figure");
	figure.append(table);
	if (config.classes) figure.className = config.classes;
	figure.classList.add("content-embed");
	if (showCaption || showCite) {
		const figcaption = document.createElement("figcaption");
		if (showCaption) {
			if (label) figcaption.innerHTML += `<strong class="embed-caption">${label}</strong>`;
			else {
				const description = await TextEditor.enrichHTML(config.doc.description, options);
				const container = document.createElement("div");
				container.innerHTML = description;
				container.classList.add("embed-caption");
				figcaption.append(container);
			}
		}
		if (showCite) figcaption.innerHTML += `<cite>${config.doc.toAnchor().outerHTML}</cite>`;
		figure.append(figcaption);
	}
	return figure;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Lookup Enricher                    */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich a property lookup.
 * @param {object} config - Configuration data.
 * @param {string} [fallback] - Optional fallback if the value couldn't be found.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML element if the lookup could be built, otherwise null.
 *
 * @example Include a creature's name in its description:
 * ```[[lookup @name]]``
 * becomes
 * ```html
 * <span class="lookup-value">Adult Black Dragon</span>
 * ```
 */
function enrichLookup(config, fallback, options) {
	let keyPath = config.path;
	let style = config.style;
	for (const value of config.values) {
		if (value === "capitalize") style ??= "capitalize";
		else if (value === "lowercase") style ??= "lowercase";
		else if (value === "uppercase") style ??= "uppercase";
		else if (value.startsWith("@")) keyPath ??= value;
	}

	if (!keyPath) {
		console.warn(`Lookup path must be defined to enrich ${config._input}.`);
		return null;
	}

	const data = options.relativeTo?.getRollData() ?? {};
	let value = foundry.utils.getProperty(data, keyPath.substring(1)) ?? fallback;
	if (value && style) {
		if (style === "capitalize") value = value.capitalize();
		else if (style === "lowercase") value = value.toLowerCase();
		else if (style === "uppercase") value = value.toUpperCase();
	}

	const span = document.createElement("span");
	span.classList.add("lookup-value");
	if (!value) span.classList.add("not-found");
	span.innerText = value ?? keyPath;
	return span;
}

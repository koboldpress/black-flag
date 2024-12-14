import AttackRollConfigurationDialog from "./applications/dice/attack-configuration-dialog.mjs";
import Activity from "./documents/activity/activity.mjs";
import { getSelectedTokens, getTargetDescriptors, log, simplifyBonus, simplifyFormula } from "./utils/_module.mjs";

const slugify = value => value?.slugify().replaceAll("-", "").replaceAll("(", "").replaceAll(")", "");

/**
 * Set up system-specific enrichers.
 */
export function registerCustomEnrichers() {
	log("Registering custom enrichers");
	const stringNames = ["attack", "check", "damage", "heal", "healing", "save", "skill", "tool", "vehicle"];
	CONFIG.TextEditor.enrichers.push(
		{
			pattern: new RegExp(`\\[\\[/(?<type>${stringNames.join("|")})(?<config> [^\\]]+)?]](?:{(?<label>[^}]+)})?`, "gi"),
			enricher: enrichString
		},
		{
			pattern: /\[\[(?<type>calc|lookup) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
			enricher: enrichString
		},
		{
			pattern: /&(?<type>reference)\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gi,
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
	document.body.addEventListener("click", handleApply);
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
		case "vehicle":
			return enrichCheck(config, label, options);
		case "lookup":
			return enrichLookup(config, label, options);
		case "save":
			return enrichSave(config, label, options);
		case "heal":
		case "healing":
			config._isHealing = true;
		case "damage":
			return enrichDamage(config, label, options);
		case "reference":
			return enrichReference(config, label, options);
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
 * @param {HTMLElement|string} label - Label to display
 * @param {object} dataset - Data that will be added to the link for the rolling method.
 * @returns {HTMLElement}
 */
function createRequestLink(label, dataset) {
	const span = document.createElement("span");
	span.classList.add("roll-link-group");
	_addDataset(span, dataset);
	if (label instanceof HTMLElement) span.insertAdjacentElement("afterbegin", label);
	else span.insertAdjacentHTML("afterbegin", label);

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
	link.innerHTML = '<i class="fa-solid fa-dice-d20" inert></i>';
	link.append(label);
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
	if (activity && !event.target.closest("[data-roll-action]")) {
		event.stopPropagation();
		activity.activate();
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Apply a status effect.
 * @param {Event} event - The click event triggering the action.
 */
async function handleApply(event) {
	const status = event.target.closest('[data-action="apply"][data-status]')?.dataset.status;
	const effect = CONFIG.statusEffects.find(e => e.id === status);
	if (!effect) return;
	event.stopPropagation();
	for (const token of getSelectedTokens()) await token.actor?.toggleStatusEffect(status);
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
		case "vehicle":
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
	if (config.activity && config.formula) {
		console.warn(`Activity ID and formula found while enriching ${config._input}, only one is supported.`);
		return null;
	}

	const formulaParts = [];
	if (config.formula) formulaParts.push(config.formula);
	for (const value of config.values) {
		if (value in CONFIG.BlackFlag.attackModes) config.attackMode = value;
		else formulaParts.push(value);
	}
	config.formula = Roll.defaultImplementation.replaceFormulaData(formulaParts.join(" "), options.rollData ?? {});

	const activity = config.activity
		? options.relativeTo?.system.activities?.get(config.activity)
		: !config.formula
			? options.relativeTo instanceof Activity
				? options.relativeTo
				: options.relativeTo?.system.activities?.getByType("attack")[0] ?? null
			: null;

	if (activity) {
		config.activityUuid = activity.uuid;
		const attackConfig = activity.getAttackDetails?.(config) ?? {};
		config.formula = Roll.defaultImplementation.replaceFormulaData(attackConfig.parts.join(" + "), attackConfig.data);
		delete config.activity;
	}

	if (!config.activityUuid && !config.formula) {
		console.warn(`No formula or linked activity found while enriching ${config._input}.`);
		return null;
	}

	config.rollAction = "attack";

	if (label) return createRollLink(label, config);

	let displayFormula = simplifyFormula(config.formula);
	if (!displayFormula.startsWith("+") && !displayFormula.startsWith("-")) displayFormula = `+${displayFormula}`;

	const span = document.createElement("span");
	span.innerHTML = game.i18n.format("BF.Enricher.Attack.Long", {
		formula: createRollLink(displayFormula, config).outerHTML
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
	const { activityUuid, attackMode, formula } = target.dataset;

	if (activityUuid) {
		const activity = await fromUuid(activityUuid);
		if (activity) return activity.rollAttack({ attackMode, event });
	}

	const targets = getTargetDescriptors();
	const rollConfig = {
		attackMode,
		event,
		rolls: [
			{
				parts: [formula.replace(/^\s*\+\s*/, "")],
				options: {
					target: targets.length === 1 ? targets[0].ac : undefined
				}
			}
		]
	};

	const dialogConfig = {
		applicationClass: AttackRollConfigurationDialog
	};

	const messageConfig = {
		data: {
			flags: {
				[game.system.id]: {
					messageType: "roll",
					roll: {
						type: "attack"
					},
					targets: getTargetDescriptors()
				}
			},
			flavor: game.i18n.format("BF.Roll.Type.Label", { type: game.i18n.localize("BF.ATTACK.Label") }),
			speaker: ChatMessage.implementation.getSpeaker()
		}
	};

	if (Hooks.call("blackFlag.preRollAttack", rollConfig, dialogConfig, messageConfig) === false) return;
	const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);
	if (rolls?.length) {
		Hooks.callAll("blackFlag.rollAttack", rolls, { ammoUpdate: null, subject: null });
		Hooks.callAll("blackFlag.postRollAttack", rolls, { subject: null });
	}
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
		options.rollData ?? options.relativeTo?.getRollData?.({ deterministic: true })
	);

	if (!roll.isDeterministic) {
		log(`Non-deterministic formula found while enriching ${config._input}.`, { level: "warn" });
		return null;
	}

	roll.evaluateSync();

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
	const tool = CONFIG.BlackFlag.enrichment.lookup.tools[slugify(config.tool)]?.label;
	const vehicle = CONFIG.BlackFlag.enrichment.lookup.vehicles[slugify(config.vehicle)]?.label;
	const longSuffix = config.format === "long" ? "Long" : "Short";
	const showDC = config.dc && !config.hideDC;

	let label;
	switch (config.rollAction) {
		case "ability-check":
		case "skill":
		case "tool":
		case "vehicle":
			if (ability && (skill || tool || vehicle)) {
				label = game.i18n.format("BF.Enricher.Check.Specific", { ability, type: skill ?? tool ?? vehicle });
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
			label = (ability || config.ability)?.toUpperCase?.() ?? "";
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
 * ```[[/check tool=thieves ability=intelligence]]```
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
		const slug = slugify(value);
		if (slug in LOOKUP.abilities) config.ability = LOOKUP.abilities[slug].key;
		else if (slug in LOOKUP.skills) config.skill = LOOKUP.skills[slug].key;
		else if (slug in LOOKUP.tools) config.tool = slug;
		else if (slug in LOOKUP.vehicles) config.vehicle = slug;
		else if (Number.isNumeric(value)) config.dc = Number(value);
		else config[value] = true;
	}

	let invalid = false;

	const skillConfig = CONFIG.BlackFlag.enrichment.lookup.skills[slugify(config.skill)];
	if (config.skill && !skillConfig) {
		log(`Skill ${config.skill} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	} else if (config.skill && !config.ability) {
		config.ability = skillConfig.ability;
	}

	const toolConfig = CONFIG.BlackFlag.enrichment.lookup.tools[slugify(config.tool)];
	if (config.tool && !toolConfig) {
		log(`Tool ${config.tool} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	}

	const vehicleConfig = CONFIG.BlackFlag.enrichment.lookup.vehicles[slugify(config.vehicle)];
	if (config.vehicle && !vehicleConfig) {
		log(`Vehicle ${config.vehicle} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	}

	let abilityConfig = CONFIG.BlackFlag.enrichment.lookup.abilities[slugify(config.ability)];
	if (config.ability && !abilityConfig) {
		log(`Ability ${config.ability} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	} else if (!abilityConfig) {
		log(`No ability provided while enriching check ${config._input}.`, { level: "warn" });
		invalid = true;
	}
	if (abilityConfig?.key) config.ability = abilityConfig.key;

	if (config.dc && !Number.isNumeric(config.dc)) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	if (invalid) return null;

	config.ability = [config.ability];
	config.rollAction = config.skill ? "skill" : config.tool ? "tool" : config.vehicle ? "vehicle" : "ability-check";
	label ??= createRollLabel(config);
	if (config.passive) return createPassiveTag(label, config);
	return createRequestLink(createRollLink(label), config);
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
	if (config.activity && config.ability) {
		console.warn(`Activity ID and ability found while enriching ${config._input}, only one is supported.`);
		return null;
	}

	const LOOKUP = CONFIG.BlackFlag.enrichment.lookup;
	for (const value of config.values) {
		const slug = slugify(value);
		if (slug in LOOKUP.abilities) config.ability = LOOKUP.abilities[slug].key;
		else if (Number.isNumeric(value)) config.dc = Number(value);
		else config[value] = true;
	}
	if (foundry.utils.getType(config.ability) === "string") config.ability = [config.ability];

	const activity = config.activity
		? options.relativeTo?.system.activities?.get(config.activity)
		: !config.formula
			? options.relativeTo instanceof Activity
				? options.relativeTo
				: options.relativeTo?.system.activities?.getByType("save")[0] ?? null
			: null;

	if (activity) {
		config.activityUuid = activity.uuid;
		const saveConfig = activity.getSaveDetails?.(config) ?? {};
		config.ability =
			foundry.utils.getType(saveConfig.ability) === "Set" ? Array.from(saveConfig.ability) : [saveConfig.ability];
		config.dc = saveConfig.dc;
		delete config.activity;
	}

	if (!config.activityUuid && !config.ability) {
		console.warn(`No ability or linked activity found while enriching ${config._input}.`);
		return null;
	}

	config.ability = config.ability?.map(a => slugify(a)).filter(a => a in CONFIG.BlackFlag.enrichment.lookup.abilities);
	if (!config.ability.length) config.ability.push("");

	if (config.dc && !Number.isNumeric(config.dc)) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	config.rollAction = "ability-save";
	if (label) label = createRollLink(label);
	if (!label && config.ability?.length < 2) {
		label = createRollLink(createRollLabel({ ...config, ability: config.ability[0] }));
	} else {
		const abilities = config.ability.map(
			ability =>
				createRollLink(CONFIG.BlackFlag.abilities.localizedAbbreviations[ability].toUpperCase(), { ...config, ability })
					.outerHTML
		);
		label = game.i18n.getListFormatter({ type: "disjunction" }).format(abilities);
		const showDC = config.dc && !config.hideDC;
		if (showDC) label = game.i18n.format("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
		label = game.i18n.format(`BF.Enricher.Save.${config.format === "long" ? "Long" : "Short"}`, { save: label });
		delete config.rollAction;
	}

	config.ability = config.ability.join("|");
	return createRequestLink(label, config);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a roll request chat message for a check or save roll.
 * @param {Event} event - The click event triggering the action.
 * @returns {Promise|void}
 */
async function requestCheckSave(event) {
	const target = event.target.closest("[data-roll-action]");
	const buttons = [];

	const abilities = target.dataset.ability?.split("|");
	if (abilities?.length)
		abilities.forEach(ability =>
			buttons.push({
				visibleLabel: createRollLabel({ ...target.dataset, ability, format: "long", icon: true }),
				hiddenLabel: createRollLabel({ ...target.dataset, ability, format: "long", icon: true, hideDC: true }),
				dataset: { ...target.dataset, ability, action: "rollRequest" }
			})
		);
	else
		buttons.push({
			visibleLabel: createRollLabel({ ...target.dataset, format: "long", icon: true }),
			hiddenLabel: createRollLabel({ ...target.dataset, format: "long", icon: true, hideDC: true }),
			dataset: { ...target.dataset, action: "rollRequest" }
		});

	const MessageClass = getDocumentClass("ChatMessage");
	const chatData = {
		user: game.user.id,
		content: await renderTemplate("systems/black-flag/templates/chat/request-card.hbs", { buttons }),
		flavor: game.i18n.localize("BF.Enricher.Request.Title"),
		speaker: MessageClass.getSpeaker({ user: game.user })
	};
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
	const dataset = {
		...(event.target.closest("[data-roll-action]")?.dataset ?? {}),
		...(event.target.closest(".roll-link")?.dataset ?? {})
	};

	target.disabled = true;
	try {
		const actors = new Set(getSelectedTokens().map(t => t.actor));
		if (!actors.size) {
			ui.notifications.warn(game.i18n.localize("BF.Enricher.Warning.NoActor"));
			return;
		}

		for (const actor of actors) {
			const { rollAction, dc, ...data } = dataset;
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
 * ```[[/heal 2d6]]``` or ```[[/damage 2d6 healing]]```
 * becomes
 * ```html
 * <a class="unlink" data-roll-action="damage" data-formulas="["2d6"]" data-types="["healing"]">
 *   <i class="fa-solid fa-dice-d20" inert></i> 2d6
 * </a> healing
 * ```
 */
async function enrichDamage(configs, label, options) {
	const config = { rollAction: "damage", formulas: [], types: [], rollType: configs._isHealing ? "healing" : "damage" };
	for (const c of configs) {
		const formulaParts = [];
		if (c.activity) config.activity = c.activity;
		if (c.average) config.average = c.average;
		if (c.magical) config.magical = true;
		if (c.mode) config.attackMode = c.mode;
		if (c.formula) formulaParts.push(c.formula);
		for (const value of c.values) {
			if (value in CONFIG.BlackFlag.damageTypes) c.type = value;
			else if (value in CONFIG.BlackFlag.healingTypes) c.type = value;
			else if (value === "average") config.average = true;
			else if (value === "magical") config.magical = true;
			else if (value === "versatile") config.attackMode ??= "twoHanded";
			else formulaParts.push(value);
		}
		c.formula = Roll.defaultImplementation.replaceFormulaData(formulaParts.join(" "), options.rollData ?? {});
		c.type = c.type ?? (configs._isHealing ? "healing" : null);
		if (c.formula) {
			config.formulas.push(c.formula);
			config.types.push(c.type);
		}
	}
	config.types = config.types.map(t => t?.replace("/", "|"));

	if (config.activity && config.formulas.length) {
		console.warn(`Activity ID and formulas found while enriching ${config._input}, only one is supported.`);
		return null;
	}

	let activity = options.relativeTo?.system.activities?.get(config.activity);
	if (!activity && !config.formula) {
		const types = configs._isHealing ? ["heal"] : ["attack", "damage", "save"];
		for (const a of options.relativeTo?.system.activities?.getByTypes(...types) ?? []) {
			if (a.system.damage.parts.length || a.system.healing?.formula) {
				activity = a;
				break;
			}
		}
	}

	if (activity) {
		config.activityUuid = activity.uuid;
		configs.rollType = activity.type === "heal" ? "healing" : "damage";
		const damageConfig = activity.getDamageDetails(config);
		for (const r of damageConfig?.rolls ?? []) {
			const formula = Roll.defaultImplementation.replaceFormulaData(r.parts.join(" + "), r.data, { missing: "0" });
			if (formula) {
				config.formulas.push(formula);
				if (r.options.damageTypes?.size) config.types.push(Array.from(r.options.damageTypes).join("|"));
				else config.types.push(r.options.damageType);
			}
		}
		delete config.activity;
	}

	if (!config.activityUuid && !config.formulas.length) {
		console.warn(`No formula or linked activity found while enriching ${config._input}.`);
		return null;
	}

	if (label) return createRollLink(label, config);

	const parts = [];
	for (const [idx, formula] of config.formulas.entries()) {
		const type = config.types[idx];
		const types = type
			?.split("|")
			.map(t => CONFIG.BlackFlag.damageTypes.localized[t] ?? CONFIG.BlackFlag.healingTypes.localized[t])
			.filter(_ => _);
		const localizationData = {
			formula: createRollLink(formula, {}, { tag: "span" }).outerHTML,
			type: game.i18n.getListFormatter({ type: "disjunction" }).format(types).toLowerCase()
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
	let { formulas, types, activity: activityUuid, attackMode, magical, rollType } = target.dataset;
	formulas = JSON.parse(formulas);
	magical = magical === "true";
	types = JSON.parse(types);

	if (activityUuid) {
		const activity = await fromUuid(activityUuid);
		if (activity) return activity.rollDamage({ attackMode, event });
	}

	const rollConfig = {
		attackMode,
		event,
		rolls: formulas.map((formula, idx) => {
			const damageTypes = new Set(types[idx]?.split("|") ?? []);
			return {
				parts: [formula],
				options: { damageType: damageTypes?.first(), damageTypes, magical }
			};
		})
	};

	const dialogConfig = {};

	const title = game.i18n.format("BF.Roll.Type.Label", {
		type: game.i18n.localize(rollType === "healing" ? "BF.Healing.Label" : "BF.DAMAGE.Label")
	});
	const messageConfig = {
		data: {
			flavor: title,
			title,
			speaker: ChatMessage.implementation.getSpeaker(),
			flags: {
				[game.system.id]: {
					messageType: "roll",
					roll: {
						type: rollType ?? "damage"
					},
					targets: getTargetDescriptors()
				}
			}
		}
	};

	if (Hooks.call("blackFlag.preRollDamage", rollConfig, dialogConfig, messageConfig) === false) return;
	const rolls = await CONFIG.Dice.DamageRoll.build(rollConfig, dialogConfig, messageConfig);
	if (rolls?.length) Hooks.callAll("blackFlag.postRollDamage", rolls);
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
 * ```[[lookup @name]]```
 * becomes
 * ```html
 * <span class="lookup-value">Adult Black Dragon</span>
 * ```
 *
 * @example Lookup a property within an activity:
 * ```[[lookup @target.template.size activity=Osjqpi5MJiML9pYs]]```
 * becomes
 * ```html
 * <span class="lookup-value">120</span>
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

	let activity = options.relativeTo?.system.activities?.get(config.activity);
	if (config.activity && !activity) {
		console.warn(`Activity not found when enriching ${config._input}.`);
		return null;
	}

	if (!keyPath) {
		console.warn(`Lookup path must be defined to enrich ${config._input}.`);
		return null;
	}

	const data = activity
		? activity.getRollData().activity
		: options.rollData ?? options.relativeTo?.getRollData?.() ?? {};
	let value = foundry.utils.getProperty(data, keyPath.substring(1)) ?? fallback;
	if (value && style) {
		if (style === "capitalize") value = value.capitalize();
		else if (style === "lowercase") value = value.toLowerCase();
		else if (style === "uppercase") value = value.toUpperCase();
	}

	const span = document.createElement("span");
	span.classList.add("lookup-value");
	if (!value && options.documents === false) return null;
	if (!value) span.classList.add("not-found");
	span.innerText = value ?? keyPath;
	return span;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                   Reference Enricher                  */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enrich a reference link.
 * @param {object} config - Configuration data.
 * @param {string} label - Optional label to replace default text.
 * @param {EnrichmentOptions} options - Options provided to customize text enrichment.
 * @returns {HTMLElement|null} - An HTML link to the Journal Entry Page for the given reference.
 */
async function enrichReference(config, label, options) {
	let key;
	let source;
	let type = Object.keys(config).find(k => k in CONFIG.BlackFlag.ruleTypes);
	if (type) {
		key = slugify(config[type]);
		source = foundry.utils.getProperty(CONFIG.BlackFlag, CONFIG.BlackFlag.ruleTypes[type].references)?.[key];
	} else if (config.values.length) {
		key = slugify(config.values.join(""));
		for (const [t, { references }] of Object.entries(CONFIG.BlackFlag.ruleTypes)) {
			source = foundry.utils.getProperty(CONFIG.BlackFlag, references)?.[key];
			if (source) {
				type = t;
				break;
			}
		}
	}

	if (!source) {
		console.warn(`No valid rule foundry while enriching ${config._input}.`);
		return null;
	}

	const uuid = foundry.utils.getType(source) === "Object" ? source.reference : source;
	if (!uuid) return null;

	const journalPage = await fromUuid(uuid);
	const span = document.createElement("span");
	span.classList.add("reference-link", "roll-link-group");
	span.append(journalPage.toAnchor({ name: label || journalPage.name }));

	if (type === "condition" && config.apply !== false) {
		const apply = document.createElement("a");
		apply.classList.add("extra-link");
		apply.dataset.action = "apply";
		apply.dataset.status = key;
		apply.dataset.tooltip = "BF.Enricher.Apply.Label";
		apply.setAttribute("aria-label", game.i18n.localize(apply.dataset.tooltip));
		apply.innerHTML = '<i class="fa-solid fa-fw fa-reply-all fa-flip-horizonal" inert></i>';
		span.append(apply);
	}

	return span;
}

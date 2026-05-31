import AttackRollConfigurationDialog from "./applications/dice/attack-configuration-dialog.mjs";
import DefaultMap from "./data/utility/default-map.mjs";
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
			id: "blackFlag-enricher",
			pattern: new RegExp(
				`\\[\\[/(?<type>${stringNames.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`,
				"gi"
			),
			enricher: enrichString,
			onRender: onRenderEnricher
		},
		{
			id: "blackFlag-lookup",
			pattern: /\[\[(?<type>calc|lookup) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
			enricher: enrichString
		},
		{
			id: "blackFlag-reference",
			pattern: /&(?<type>reference)\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gi,
			enricher: enrichString,
			onRender: onRenderEnricher
		},
		{
			id: "blackFlag-definition",
			pattern: /~def\[([^\]]+)]/gi,
			enricher: (match, options) => {
				const dnf = document.createElement("dfn");
				dnf.innerText = match[1];
				return dnf;
			}
		}
	);
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
	config = parseConfig(config, { multiple: ["damage", "healing", "heal"].includes(type) });
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
	if (label instanceof HTMLTemplateElement) span.append(label.content);
	else if (label instanceof HTMLElement) span.append(label);
	else span.append(label);

	// Add chat request link for GMs
	if (game.user.isGM) {
		const gmLink = document.createElement("a");
		gmLink.classList.add("extra-link");
		gmLink.dataset.action = "postRequest";
		gmLink.dataset.tooltip = "BF.Enricher.Request.Action";
		gmLink.setAttribute("aria-label", _loc(gmLink.dataset.tooltip));
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
	link.innerHTML = '<i class="fa-solid fa-dice-d20" inert></i>';
	link.append(label);
	_addDataset(link, dataset);
	if (tag === "a") link.dataset.action = "roll";
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

const _addListeners = (buttons, handler) =>
	buttons.forEach(button => button.addEventListener("click", event => handler(event, event.currentTarget)));

/**
 * Attach actions to chat message for requested rolls.
 * @param {BlackFlagChatMessage} message
 * @param {HTMLElement} element
 */
export function activateChatListeners(message, element) {
	_addListeners(element.querySelectorAll('[data-action="rollRequest"]'), handleRoll);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Attach actions to enrichers when they are rendered.
 * @param {HTMLEnrichedContentElement} element
 */
function onRenderEnricher(element) {
	_addListeners(element.querySelectorAll('[data-action="applyStatus"]'), handleApplyStatus);
	_addListeners(element.querySelectorAll('[data-action="postRequest"]'), handlePostRequest);
	_addListeners(element.querySelectorAll('[data-action="roll"]'), handleRoll);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create the combined dataset for the target button and any parent groups.
 * @param {HTMLElement} target - Button that was clicked.
 * @returns {object}
 */
function getRollActionDataset(target) {
	return {
		...((target.closest(".roll-link-group") ?? target)?.dataset ?? {}),
		...(target.closest(".roll-link")?.dataset ?? {})
	};
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Apply a status effect.
 * @param {Event} event - Triggering click event.
 * @param {HTMLElement} target - Button that was clicked.
 */
async function handleApplyStatus(event, target) {
	const status = target.closest("[data-status]")?.dataset.status;
	if (!status) return;
	window.getSelection().empty();
	const actors = new Set();
	for (const { actor } of getSelectedTokens()) {
		if (!actor || actors.has(actor)) continue;
		await actor.toggleStatusEffect(status);
		actors.add(actor);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle creating a roll request chat message.
 * @param {Event} event - Triggering click event.
 * @param {HTMLElement} target - Button that was clicked.
 */
async function handlePostRequest(event, target) {
	window.getSelection().empty();
	const dataset = getRollActionDataset(target);

	let buttons;
	switch (dataset.rollAction) {
		case "ability-check":
		case "skill":
		case "tool":
		case "vehicle":
			buttons = createCheckRequestButtons(dataset);
			break;
		case "ability-save":
			buttons = createSaveRequestButtons(dataset);
			break;
		default:
			buttons = [createRequestButton({ ...dataset, format: "short" })];
	}

	const MessageClass = getDocumentClass("ChatMessage");
	const chatData = {
		content: await foundry.applications.handlebars.renderTemplate(
			"systems/black-flag/templates/chat/request-card.hbs",
			{ buttons }
		),
		flavor: _loc("BF.Enricher.Request.Title"),
		speaker: MessageClass.getSpeaker({ user: game.user }),
		user: game.user.id
	};
	MessageClass.create(chatData);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform the provided roll action.
 * @param {Event} event - Triggering click event.
 * @param {HTMLElement} target - Button that was clicked.
 */
async function handleRoll(event, target) {
	window.getSelection().empty();
	target.disabled = true;
	try {
		const dataset = getRollActionDataset(target);
		switch (dataset.rollAction) {
			case "ability-check":
			case "ability-save":
			case "skill":
			case "tool":
			case "vehicle":
				await rollCheckSave(event, target);
				break;
			case "attack":
				await rollAttack(event, target);
				break;
			case "damage":
				await rollDamage(event, target);
				break;
		}
	} finally {
		target.disabled = false;
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
 *
 * @example Display the full attack section:
 * ```[[/attack format=extended]]``` or ```[[/attack extended]]```
 * becomes
 * ```html
 * <span class="attack-extended">
 *   <em>Melee Attack Roll</em>:
 *   <span class="roll-link-group" data-type="attack" data-formula="+16" data-activity-uuid="...uuid...">
 *     <a class="roll-link"><i class="fa-solid fa-dice-d20" inert"></i> +16</a>
 *   </span>, reach 15 ft, one target
 * </span>
 * ```
 */
async function enrichAttack(config, label, options) {
	if (config.activity && config.formula) {
		log(`Activity ID and formula found while enriching ${config._input}, only one is supported.`, { level: "warn" });
		return null;
	}

	const formulaParts = [];
	if (config.formula) formulaParts.push(config.formula);
	for (const value of config.values) {
		if (value in CONFIG.BlackFlag.attackModes) config.attackMode = value;
		else if (value === "extended") config.format = "extended";
		else formulaParts.push(value);
	}
	config.formula = Roll.defaultImplementation.replaceFormulaData(formulaParts.join(" "), options.rollData ?? {});

	const activity = config.activity
		? options.relativeTo?.system?.activities?.get(config.activity)
		: !config.formula
			? options.relativeTo instanceof Activity
				? options.relativeTo
				: options.relativeTo?.system?.activities?.getByType("attack")[0] ?? null
			: null;

	if (activity) {
		config.activityUuid = activity.uuid;
		const attackConfig = activity.getAttackDetails?.(config) ?? {};
		config.formula = Roll.defaultImplementation.replaceFormulaData(attackConfig.parts.join(" + "), attackConfig.data);
		delete config.activity;
	}

	if (!config.activityUuid && !config.formula) {
		log(`No formula or linked activity found while enriching ${config._input}.`, { level: "warn" });
		return null;
	}

	config.rollAction = "attack";

	if (label) return createRollLink(label, config);

	let displayFormula = simplifyFormula(config.formula) || "+0";
	if (!displayFormula.startsWith("+") && !displayFormula.startsWith("-")) displayFormula = `+${displayFormula}`;

	const span = document.createElement("span");
	span.innerHTML = _loc("BF.Enricher.Attack.Long", {
		formula: createRollLink(displayFormula, config).outerHTML
	});

	if (config.format === "extended") {
		const type = game.i18n
			.format("BF.ATTACK.Formatted", {
				type: game.i18n
					.getListFormatter({ type: "disjunction" })
					.format(
						Array.from(activity?.system.validAttackTypes ?? []).map(t => CONFIG.BlackFlag.weaponTypes.localized[t])
					),
				classification: CONFIG.BlackFlag.attackTypes.localized[activity?.system.attack.type.classification] ?? ""
			})
			.trim();
		const parts = [
			span.outerHTML,
			activity?.getRangeLabel(config.attackMode),
			activity?.target?.affects?.labels?.statBlock
		];
		const full = document.createElement("span");
		full.className = "attack-extended";
		full.innerHTML = _loc("BF.Enricher.Attack.Extended", {
			type,
			parts: game.i18n.getListFormatter({ type: "unit" }).format(parts.filter(_ => _))
		});
		return full;
	}

	return span;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform an attack roll.
 * @param {Event} event - Triggering click event.
 * @param {HTMLElement} target - Button that was clicked.
 * @returns {Promise|void}
 */
async function rollAttack(event, target) {
	const dataset = getRollActionDataset(target);
	const { activityUuid, attackMode, formula } = dataset;

	if (activityUuid) {
		const activity = await fromUuid(activityUuid);
		if (activity) return activity.rollAttack({ attackMode, event });
	}

	const targets = getTargetDescriptors();
	const rollConfig = {
		attackMode,
		event,
		hookNames: ["attack", "d20Test"],
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
			flavor: _loc("BF.Roll.Type.Label", { type: _loc("BF.ATTACK.Label") }),
			speaker: ChatMessage.implementation.getSpeaker()
		}
	};

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
	const ability = CONFIG.BlackFlag.enrichment.lookup.abilities[slugify(config.ability)]?.label;
	const skill = CONFIG.BlackFlag.enrichment.lookup.skills[slugify(config.skill)]?.label;
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
				label = _loc("BF.Enricher.Check.Specific", { ability, type: skill ?? tool ?? vehicle });
			} else {
				label = ability;
			}
			if (config.passive) {
				label = _loc(`BF.Enricher.${showDC ? "DC." : ""}Passive.${longSuffix}`, {
					dc: config.dc,
					check: label
				});
			} else {
				if (showDC) label = _loc("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
				label = _loc(`BF.Enricher.Check.${longSuffix}`, { check: label });
			}
			break;
		case "ability-save":
			label = ability || config.ability?.toUpperCase() || "";
			if (showDC) label = _loc("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
			label = _loc(`BF.Enricher.Save.${longSuffix}`, { save: label });
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
 *   <i class="fa-solid fa-dice-d20" inert></i> DEX
 * </a>
 * ```
 *
 * @example Create an acrobatics check with a DC and default ability:
 * ```[[/check skill=acrobatics dc=20]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="dexterity" data-skill="acrobatics" data-dc="20">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 20 DEX (Acrobatics)
 * </a>
 * ```
 *
 * @example Create an acrobatics check using strength:
 * ```[[/check ability=strength skill=acrobatics]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="strength" data-skill="acrobatics">
 *   <i class="fa-solid fa-dice-d20" inert></i> STR (Acrobatics)
 * </a>
 * ```
 *
 * @example Create a tool check:
 * ```[[/check tool=thieves ability=intelligence]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="intelligence" data-tool="thievesTools">
 *   <i class="fa-solid fa-dice-d20" inert></i> INT (Thieves' Tools)
 * </a>
 * ```
 *
 * @example Formulas used for DCs will be resolved using data provided to the description (not the roller):
 * ```[[/check ability=charisma dc=@abilities.int.dc]]```
 * becomes
 * ```html
 * <a class="roll-action" data-roll-action="check" data-ability="charisma" data-dc="15">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 15 CHA
 * </a>
 * ```
 *
 * @example Use multiple skills in a check using default abilities:
 * ```[[/check skill=acrobatics/athletics dc=15]]```
 * ```[[/check acrobatics athletics 15]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="check" data-skill="acrobatics|athletics" data-dc="15">
 *   DC 15
 *   <a class="roll-action" data-ability="dexterity" data-skill="acrobatics">
 *     <i class="fa-solid fa-dice-d20" inert></i> DEX (Acrobatics)
 *   </a> or
 *   <a class="roll-action" data-ability="strength" data-skill="athletics">
 *     <i class="fa-solid fa-dice-d20" inert></i> STR (Athletics)
 *   </a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Use multiple skills with a fixed ability:
 * ```[[/check ability=str skill=deception/persuasion dc=15]]```
 * ```[[/check strength deception persuasion 15]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="check" data-ability="str" data-skill="deception|persuasion" data-dc="15">
 *   DC 15 STR
 *   (<a class="roll-action" data-skill="deception"><i class="fa-solid fa-dice-d20" inert></i> Deception</a> or
 *   <a class="roll-action" data-ability="persuasion"><i class="fa-solid fa-dice-d20" inert></i> Persuasion</a>)
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Link an enricher to an check activity, either explicitly or automatically
 * ```[[/check activity=RLQlsLo5InKHZadn]]``` or ```[[/check]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-roll-action="ability-check" data-ability="dexterity" data-dc="20"
 *       data-activity-uuid="...">
 *   <a class="roll-action"><i class="fa-solid fa-dice-d20" inert></i> DC 20 DEX</a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 */
async function enrichCheck(config, label, options) {
	config.skill = config.skill?.replaceAll("/", "|").split("|") ?? [];
	config.tool = config.tool?.replaceAll("/", "|").split("|") ?? [];
	config.vehicle = config.vehicle?.replaceAll("/", "|").split("|") ?? [];
	const LOOKUP = CONFIG.BlackFlag.enrichment.lookup;
	for (const value of config.values) {
		const slug = foundry.utils.getType(value) === "string" ? slugify(value) : value;
		if (slug in LOOKUP.abilities) config.ability = LOOKUP.abilities[slug].key;
		else if (slug in LOOKUP.skills) config.skill.push(LOOKUP.skills[slug].key);
		else if (slug in LOOKUP.tools) config.tool.push(slug);
		else if (slug in LOOKUP.vehicles) config.vehicle.push(slug);
		else if (Number.isNumeric(value)) config.dc = Number(value);
		else config[value] = true;
	}
	delete config.values;

	const groups = new DefaultMap(() => []);
	let invalid = false;

	const anything = config.ability || config.skill.length || config.tool.length || config.vehicle.length;
	const item = options.relativeTo instanceof Item ? options.relativeTo : options.relativeTo?.item;
	const activity = config.activity
		? item?.system?.activities?.get(config.activity)
		: !anything
			? options.relativeTo instanceof Activity && options.relativeTo.type === "check"
				? options.relativeTo
				: item?.system?.activities?.getByType("check")[0] ?? null
			: null;

	if (activity) {
		if (activity.type !== "check") {
			log(`Check enricher linked to non-check activity when enriching ${config._input}.`, { level: "warn" });
			return null;
		}

		if (activity.system.check.ability) config.ability = activity.system.check.ability;
		config.activityUuid = activity.uuid;
		config.dc = activity.system.check.dc.value;
		config.skill = [];
		config.tool = [];
		config.vehicle = [];
		for (const associated of activity.system.check.associated) {
			if (associated in CONFIG.BlackFlag.skills) config.skill.push(associated);
			else if (associated in CONFIG.BlackFlag.tools) config.tool.push(associated);
			else if (associated in CONFIG.BlackFlag.vehicles) config.vehicle.push(associated);
		}
		delete config.activity;
	}

	let abilityConfig = LOOKUP.abilities[slugify(config.ability)];
	if (config.ability && !abilityConfig) {
		log(`Ability ${config.ability} not found while enriching ${config._input}.`, { level: "warn" });
		invalid = true;
	} else if (abilityConfig?.key) config.ability = abilityConfig.key;

	for (let [index, skill] of config.skill.entries()) {
		const skillConfig = LOOKUP.skills[slugify(skill)];
		if (skillConfig) {
			if (skillConfig.key) skill = config.skill[index] = skillConfig.key;
			const ability = config.ability || skillConfig.ability;
			groups.get(ability).push({ key: skill, type: "skill", label: skillConfig.label });
		} else {
			log(`Skill ${skill} not found while enriching ${config._input}.`, { level: "warn" });
			invalid = true;
		}
	}

	for (const tool of config.tool) {
		const toolConfig = LOOKUP.tools[slugify(tool)];
		if (toolConfig) {
			if (config.ability) {
				groups.get(config.ability).push({ key: tool, type: "tool", label: toolConfig.label });
			} else {
				log(`Tool "${tool}" found without specified ability while enriching ${config._input}.`, { level: "warn" });
				invalid = true;
			}
		} else {
			log(`Tool ${tool} not found while enriching ${config._input}.`, { level: "warn" });
			invalid = true;
		}
	}

	for (const vehicle of config.vehicle) {
		const vehicleConfig = LOOKUP.vehicles[slugify(vehicle)];
		if (vehicleConfig) {
			if (config.ability) {
				groups.get(config.ability).push({ key: vehicle, type: "vehicle", label: vehicleConfig.label });
			} else {
				log(`Vehicle "${vehicle}" found without specified ability while enriching ${config._input}.`, {
					level: "warn"
				});
				invalid = true;
			}
		} else {
			log(`Vehicle ${vehicle} not found while enriching ${config._input}.`, { level: "warn" });
			invalid = true;
		}
	}

	if (!abilityConfig && !groups.size) {
		log(`No ability, skill, tool, vehicle or linked activity provided while enriching ${config._input}.`, {
			level: "warn"
		});
		invalid = true;
	}

	const complex = config.skill.length + config.tool.length + config.vehicle.length > 1;
	if (config.passive && complex) {
		log(
			`Multiple proficiencies and passive flag found while enriching ${config._input}, which aren't supported together.`,
			{ level: "warn" }
		);
		invalid = true;
	}
	if (label && complex) {
		log(
			`Multiple proficiencies and a custom label found while enriching ${config._input}, which aren't supported together.`,
			{ level: "warn" }
		);
		invalid = true;
	}

	if (config.dc && !Number.isNumeric(config.dc)) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	if (invalid) return null;

	if (complex) {
		const formatter = game.i18n.getListFormatter({ type: "disjunction" });
		const parts = [];
		for (const [ability, associated] of groups.entries()) {
			const makeConfig = ({ key, type }) => ({
				rollAction: type,
				[type]: key,
				ability: groups.size > 1 ? ability : undefined
			});

			// Multiple associated proficiencies, link each individually
			if (associated.length > 1)
				parts.push(
					_loc("BF.Enricher.Check.Specific", {
						ability: LOOKUP.abilities[ability].label,
						type: formatter.format(associated.map(a => createRollLink(a.label, makeConfig(a)).outerHTML))
					})
				);
			// Only single associated proficiency, wrap whole thing in roll link
			else {
				const associatedConfig = makeConfig(associated[0]);
				parts.push(createRollLink(createRollLabel({ ...associatedConfig, ability }), associatedConfig).outerHTML);
			}
		}

		label = formatter.format(parts);
		if (config.dc && !config.hideDC) {
			label = _loc("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
		}
		label = _loc(`BF.Enricher.Check.${config.format === "long" ? "Long" : "Short"}`, { check: label });
		const template = document.createElement("template");
		template.innerHTML = label;
		return createRequestLink(template, {
			rollAction: "ability-check",
			...config,
			skill: config.skill.join("|"),
			tool: config.tool.join("|"),
			vehicle: config.vehicle.join("|")
		});
	}

	config = {
		rollAction: config.skill.length
			? "skill"
			: config.tool.length
				? "tool"
				: config.vehicle.length
					? "vehicle"
					: "ability-check",
		ability: Array.from(groups.keys())[0],
		...config,
		skill: config.skill[0],
		tool: config.tool[0],
		vehicle: config.vehicle[0]
	};
	label ??= createRollLabel(config);
	if (config.passive) return createPassiveTag(label, config);
	return createRequestLink(createRollLink(label), config);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create the buttons for a check requested in chat.
 * @param {object} dataset
 * @returns {object[]}
 */
function createCheckRequestButtons(dataset) {
	const skills = dataset.skill?.split("|") ?? [];
	const tools = dataset.tool?.split("|") ?? [];
	const vehicles = dataset.vehicle?.split("|") ?? [];
	if (skills.length + tools.length + vehicles.length <= 1) return [createRequestButton(dataset)];
	const baseDataset = { ...dataset };
	delete baseDataset.skill;
	delete baseDataset.tool;
	delete baseDataset.vehicle;
	return [
		...skills.map(skill =>
			createRequestButton({
				ability: CONFIG.BlackFlag.skills[skill].ability,
				...baseDataset,
				format: "long",
				skill,
				rollAction: "skill"
			})
		),
		...tools.map(tool => createRequestButton({ ...baseDataset, format: "long", tool, rollAction: "tool" })),
		...vehicles.map(skill => createRequestButton({ ...baseDataset, format: "long", vehicle, rollAction: "vehicle" }))
	];
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
		log(`Activity ID and ability found while enriching ${config._input}, only one is supported.`, { level: "warn" });
		return null;
	}

	const blankAbility = config.ability === false;
	config.ability = blankAbility ? [] : config.ability?.replace("/", "|").split("|") ?? [];
	const LOOKUP = CONFIG.BlackFlag.enrichment.lookup;
	for (const value of config.values) {
		const slug = slugify(value);
		if (slug in LOOKUP.abilities) config.ability.push(LOOKUP.abilities[slug].key);
		else if (Number.isNumeric(value)) config.dc = Number(value);
		else config[value] = true;
	}
	config.ability = config.ability
		.map(a => slugify(a))
		.filter(a => a in LOOKUP.abilities)
		.map(a => LOOKUP.abilities[a].key ?? a);

	const item = options.relativeTo instanceof Item ? options.relativeTo : options.relativeTo?.item;
	const activity = config.activity
		? item?.system?.activities?.get(config.activity)
		: !config.ability.length && !blankAbility
			? options.relativeTo instanceof Activity && options.relativeTo.type === "save"
				? options.relativeTo
				: item?.system?.activities?.getByType("save")[0] ?? null
			: null;

	if (activity) {
		config.activityUuid = activity.uuid;
		const saveConfig = activity.getSaveDetails?.(config) ?? {};
		config.ability =
			foundry.utils.getType(saveConfig.ability) === "Set" ? Array.from(saveConfig.ability) : [saveConfig.ability];
		config.dc = saveConfig.dc;
		delete config.activity;
	}

	if (!config.activityUuid && !config.ability.length && !blankAbility) {
		log(`No ability or linked activity found while enriching ${config._input}.`, { level: "warn" });
		return null;
	}

	if (!config.ability.length) config.ability.push("");

	if (config.dc && !Number.isNumeric(config.dc)) config.dc = simplifyBonus(config.dc, options.rollData ?? {});

	if (config.ability.length > 1 && label) {
		log(
			`Multiple abilities and custom label found while enriching ${config._input}, which aren't supported together.`,
			{ level: "warn" }
		);
		return null;
	}

	config.rollAction = "ability-save";
	if (label) label = createRollLink(label);
	else if (config.ability?.length <= 1) {
		label = createRollLink(createRollLabel({ ...config, ability: config.ability[0] }));
	} else {
		const abilities = config.ability.map(ability => {
			const linkConfig = { ...config, ability };
			delete linkConfig.rollAction;
			return createRollLink(LOOKUP.abilities[ability].label, linkConfig).outerHTML;
		});
		label = game.i18n.getListFormatter({ type: "disjunction" }).format(abilities);
		const showDC = config.dc && !config.hideDC;
		if (showDC) label = _loc("BF.Enricher.DC.Phrase", { dc: config.dc, check: label });
		label = _loc(`BF.Enricher.Save.${config.format === "long" ? "Long" : "Short"}`, { save: label });
		const template = document.createElement("template");
		template.innerHTML = label;
		label = template;
	}

	return createRequestLink(label, { ...config, ability: config.ability.join("|") });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create the buttons for a save requested in chat.
 * @param {object} dataset
 * @returns {object[]}
 */
function createSaveRequestButtons(dataset) {
	const abilities = dataset.ability ? dataset.ability.split("|") : [""];
	return abilities.map(ability => createRequestButton({ ...dataset, format: "long", ability }));
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a button for a chat request.
 * @param {object} dataset
 * @returns {object}
 */
function createRequestButton(dataset) {
	return {
		visibleLabel: createRollLabel({ ...dataset, icon: true }),
		hiddenLabel: createRollLabel({ ...dataset, icon: true, hideDC: true }),
		dataset: { ...dataset, action: "rollRequest", visibility: "all" }
	};
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform a check or save roll.
 * @param {Event} event - Triggering click event.
 * @param {HTMLElement} target - Button that was clicked.
 * @returns {Promise|void}
 */
async function rollCheckSave(event, target) {
	const dataset = getRollActionDataset(target);

	const actors = new Set(getSelectedTokens().map(t => t.actor));
	if (!actors.size) {
		ui.notifications.warn(_loc("BF.Enricher.Warning.NoActor"));
		return;
	}

	for (const actor of actors) {
		const { rollAction, dc, ...data } = dataset;
		const rollConfig = { event, ...data };
		if (rollConfig.ability === "spellcasting") rollConfig.ability = actor.system.spellcasting?.ability;
		if (dc) rollConfig.target = Number(dc);
		await actor.roll(rollAction, rollConfig);
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
		if (c.format) config.format = c.format;
		if (c.formula) formulaParts.push(c.formula);
		if (configs._isHealing && !c.type) c.type = "healing";
		c.type = c.type?.replaceAll("/", "|").split("|") ?? [];
		for (const value of c.values) {
			if (value in CONFIG.BlackFlag.damageTypes) c.type.push(value);
			else if (value in CONFIG.BlackFlag.healingTypes) c.type.push(value);
			else if (value === "average") config.average = true;
			else if (value === "extended") config.format = "extended";
			else if (value === "magical") config.magical = true;
			else if (value === "versatile") config.attackMode ??= "twoHanded";
			else formulaParts.push(value);
		}
		c.formula = Roll.defaultImplementation.replaceFormulaData(formulaParts.join(" "), options.rollData ?? {});
		if (c.formula) {
			config.formulas.push(c.formula);
			config.types.push(c.type.join("|"));
		}
	}
	config.types = config.types.map(t => t?.replace("/", "|"));
	if (config.format === "extended") config.average ??= true;

	if (config.activity && config.formulas.length) {
		log(`Activity ID and formulas found while enriching ${config._input}, only one is supported.`, { level: "warn" });
		return null;
	}

	let activity =
		options.relativeTo instanceof Activity && !config.formulas.length
			? options.relativeTo
			: options.relativeTo?.system?.activities?.get(config.activity);
	if (!activity && !config.formulas.length) {
		const types = configs._isHealing ? ["heal"] : ["attack", "damage", "save"];
		for (const a of options.relativeTo?.system?.activities?.getByTypes(...types) ?? []) {
			if (a.system.damage?.parts.length || a.system.healing?.formula) {
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
		log(`No formula or linked activity found while enriching ${config._input}.`, { level: "warn" });
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

		parts.push(_loc(`BF.Enricher.Damage.${localizationType}`, localizationData));
	}

	const link = document.createElement("a");
	link.className = "unlink";
	link.dataset.action = "roll";
	_addDataset(link, config);
	if (config.average && parts.length === 2) {
		link.innerHTML = _loc("BF.Enricher.Damage.Double", { first: parts[0], second: parts[1] });
	} else {
		link.innerHTML = game.i18n.getListFormatter().format(parts);
	}

	if (config.format === "extended") {
		const span = document.createElement("span");
		span.className = "damage-extended";
		span.innerHTML = _loc("BF.Enricher.Damage.Extended", { damage: link.outerHTML });
		return span;
	}

	return link;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform a damage roll.
 * @param {Event} event - Triggering click event.
 * @param {HTMLElement} target - Button that was clicked.
 * @returns {Promise|void}
 */
async function rollDamage(event, target) {
	const dataset = getRollActionDataset(target);
	let { formulas, types, activity: activityUuid, attackMode, magical, rollType } = dataset;
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
		hookNames: ["damage"],
		rolls: formulas.map((formula, idx) => {
			const damageTypes = new Set(types[idx]?.split("|") ?? []);
			return {
				parts: [formula],
				options: { damageType: damageTypes?.first(), damageTypes, magical }
			};
		})
	};

	const dialogConfig = {};

	const title = _loc("BF.Roll.Type.Label", {
		type: _loc(rollType === "healing" ? "BF.Healing.Label" : "BF.DAMAGE.Label")
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

	let activity = options.relativeTo?.system?.activities?.get(config.activity);
	if (config.activity && !activity) {
		log(`Activity not found when enriching ${config._input}.`, { level: "warn" });
		return null;
	}

	if (!keyPath) {
		log(`Lookup path must be defined to enrich ${config._input}.`, { level: "warn" });
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
		log(`No valid rule foundry while enriching ${config._input}.`, { level: "warn" });
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
		apply.dataset.action = "applyStatus";
		apply.dataset.status = key;
		apply.dataset.tooltip = "BF.Enricher.Apply.Label";
		apply.setAttribute("aria-label", _loc(apply.dataset.tooltip));
		apply.innerHTML = '<i class="fa-solid fa-fw fa-reply-all fa-flip-horizonal" inert></i>';
		span.append(apply);
	}

	return span;
}

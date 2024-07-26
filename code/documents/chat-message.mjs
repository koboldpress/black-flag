import MessageLuckElement from "../applications/components/message-luck.mjs";
import aggregateDamageRolls from "../dice/aggregate-damage-rolls.mjs";

/**
 * Extended version of ChatMessage to highlight critical damage, support luck modifications, and other system features.
 */
export default class BlackFlagChatMessage extends ChatMessage {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The currently highlighted token from this message.
	 * @type {BlackFlagToken|null}
	 */
	_highlighted = null;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should roll DCs and other challenge details be displayed on this card?
	 * @type {boolean}
	 */
	get shouldDisplayChallenge() {
		if (game.user.isGM || this.user === game.user) return true;
		switch (game.settings.get(game.system.id, "challengeVisibility")) {
			case "all":
				return true;
			case "player":
				return !this.user.isGM;
			default:
				return false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getHTML() {
		const jQuery = await super.getHTML();
		if (!this.isContentVisible) return jQuery;
		const html = jQuery[0];

		this._renderHeader(html);
		this._renderButtons(html);
		this._activateActivityListeners(html);
		if (this.isRoll) {
			this._highlightRollResults(html);
			this._renderLuckInterface(html);
			await this._renderAttackUI(html);
			await this._renderDamageUI(html);
		}

		return jQuery;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add classes to roll results to indicate successes and failures.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_highlightRollResults(html) {
		const originatingMessage = game.messages.get(this.getFlag(game.system.id, "originatingMessage")) ?? this;
		const displayAttackResult = game.user.isGM || game.settings.get(game.system.id, "attackVisibility") !== "none";
		const displayChallenge = originatingMessage.shouldDisplayChallenge;

		const rollResults = html.querySelectorAll(".dice-roll");
		for (const [index, roll] of this.rolls.entries()) {
			const result = rollResults[index];
			if (!result) return;

			const isAttack = this.getFlag(game.system.id, "type") === "attack";
			const isDeathSave = this.getFlag(game.system.id, "type") === "death";
			const showResult = isAttack ? displayAttackResult : displayChallenge;

			if (isAttack && isDeathSave) {
				if (roll.isCriticalSuccess) result.classList.add("critical-success");
				else if (roll.isCriticalFailure) result.classList.add("critical-failure");
			}
			if (showResult) {
				if (roll.isSuccess) result.classList.add("success");
				else if (roll.isFailure) result.classList.add("failure");
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Control visibility of chat buttons based on current user.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_renderButtons(html) {
		if (this.shouldDisplayChallenge) html.dataset.displayChallenge = "";

		const actor = game.actors.get(this.speaker.actor);
		if (game.user.isGM || actor?.isOwner || this.user.id === game.user.id) {
			// TODO: Optionally hide any controls
		} else {
			for (const button of html.querySelectorAll(".menu button:not([data-all-users]")) {
				button.hidden = true;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the to-hit tray.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	async _renderAttackUI(html) {
		const displayAttackResult = game.user.isGM || game.settings.get(game.system.id, "attackVisibility") !== "none";
		const roll = this.rolls.filter(r => r instanceof CONFIG.Dice.ChallengeRoll)[0];
		const targets = this.getFlag(game.system.id, "targets");
		if (displayAttackResult && roll && targets?.length) {
			const attackResult = document.createElement("blackFlag-attackResult");
			attackResult.roll = roll;
			html.querySelector(".message-content").appendChild(attackResult);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display total damage and apply damage controls.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	async _renderDamageUI(html) {
		const rolls = this.rolls.filter(r => r instanceof CONFIG.Dice.DamageRoll);
		if (!rolls.length) return;

		const aggregatedRolls = CONFIG.BlackFlag.aggregateDamageDisplay ? aggregateDamageRolls(rolls) : rolls;
		const context = aggregatedRolls.reduce(
			(obj, r) => {
				obj.formulaParts.push(CONFIG.BlackFlag.aggregateDamageDisplay ? r.formula : ` + ${r.formula}`);
				obj.total += r.total;
				obj.parts.push(this._splitDamageRoll(r));
				return obj;
			},
			{ formulaParts: [], total: 0, parts: [] }
		);
		context.formula = context.formulaParts.join("").replace(/^ \+ /, "");
		const rendered = await renderTemplate(`systems/${game.system.id}/templates/chat/damage-tooltip.hbs`, context);
		html.querySelectorAll(".message-content .dice-roll").forEach(e => e.remove());
		html.querySelector(".message-content").insertAdjacentHTML("afterbegin", rendered);

		// TODO: Add option to make this optionally visible to players
		if (game.user.isGM) {
			const damageApplication = document.createElement("blackFlag-damageApplication");
			damageApplication.damages = aggregateDamageRolls(rolls, { respectProperties: true }).map(roll => ({
				value: roll.total,
				type: roll.options.damageType,
				properties: new Set(roll.options.properties ?? [])
			}));
			html.querySelector(".message-content").appendChild(damageApplication);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Split a damage roll into dice and constant components.
	 * @param {DamageRoll} roll - Roll to split.
	 * @returns {{ constant: number, dice: { result: string, classes: string }[], total: number, type: string }}
	 * @protected
	 */
	_splitDamageRoll(roll) {
		const data = { constant: 0, dice: [], total: roll.total, type: roll.options.damageType };
		data.config = CONFIG.BlackFlag.damageTypes[data.type] ?? CONFIG.BlackFlag.healingTypes[data.type];
		let hasMultiplication = false;
		for (let i = roll.terms.length - 1; i >= 0; ) {
			const term = roll.terms[i--];
			if (!(term instanceof foundry.dice.terms.NumericTerm) && !(term instanceof foundry.dice.terms.DiceTerm)) continue;
			const value = term.total;
			if (term instanceof foundry.dice.terms.DiceTerm)
				data.dice.push(
					...term.results.map(r => ({
						result: term.getResultLabel(r),
						classes: term.getResultCSS(r).filterJoin(" ")
					}))
				);
			let multiplier = 1;
			let operator = roll.terms[i];
			while (operator instanceof foundry.dice.terms.OperatorTerm) {
				if (!["+", "-"].includes(operator.operator)) hasMultiplication = true;
				if (operator.operator === "-") multiplier *= -1;
				operator = roll.terms[--i];
			}
			if (term instanceof foundry.dice.terms.NumericTerm) data.constant += value * multiplier;
		}
		if (hasMultiplication) data.constant = null;
		return data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Swap the header element with a collapsible chat tray.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_renderHeader(html) {
		const header = html.querySelector(".card-header.collapsible");
		if (!header) return;
		const tray = document.createElement("blackflag-tray");
		tray.classList.add("card-header");
		header.replaceWith(tray);
		tray.append(header);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the luck controls on the chat card if necessary.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_renderLuckInterface(html) {
		if (!MessageLuckElement.shouldDisplayLuckInterface(this)) return;
		const content = html.querySelector(".message-content");
		content.insertAdjacentHTML("beforeend", "<blackFlag-messageLuck></blackFlag-messageLuck>");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add event listeners to an activity card or remove the controls if activity could not be found.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_activateActivityListeners(html) {
		if (this.getFlag(game.system.id, "type") === "activity") {
			const activity = this.getAssociatedActivity();
			activity?.activateChatListeners(this, html);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle target selection and panning.
	 * @param {PointerEvent} event - The triggering event.
	 * @returns {Promise} - Promise that resolves once the canvas pan has completed.
	 */
	async onTargetMouseDown(event) {
		event.stopPropagation();
		const uuid = event.currentTarget.dataset.uuid;
		const doc = fromUuidSync(uuid);
		const token = doc instanceof Token ? doc : doc?.token?.object ?? doc?.getActiveTokens()[0];
		if (!token || !doc.testUserPermission(game.user, "OBSERVER")) return;
		const releaseOthers = !event.shiftKey;
		if (token.controlled) token.release();
		else {
			token.control({ releaseOthers });
			return canvas.animatePan(token.center);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle highlighting a token when a chat message is hovered over.
	 * @param {PointerEvent} event - The triggering event.
	 */
	onTargetHoverIn(event) {
		const uuid = event.currentTarget.dataset.uuid;
		const doc = fromUuidSync(uuid);
		const token = doc instanceof Token ? doc : doc?.token?.object ?? doc?.getActiveTokens()[0];
		if (token && token.isVisible) {
			if (!token.controlled) token._onHoverIn(event, { hoverOutOthers: true });
			this._highlighted = token;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle ending the highlighting of token.
	 * @param {PointerEvent} event - The triggering event.
	 */
	onTargetHoverOut(event) {
		if (this._highlighted) this._highlighted._onHoverOut(event);
		this._highlighted = null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the activity associated with this chat card.
	 * @returns {Activity|void}
	 */
	getAssociatedActivity() {
		return fromUuidSync(this.getFlag(game.system.id, "activityUuid"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the Actor which is the author of a chat card.
	 * @returns {BlackFlagActor|void}
	 */
	getAssociatedActor() {
		if (this.speaker.scene && this.speaker.token) {
			const scene = game.scenes.get(this.speaker.scene);
			const token = scene?.tokens.get(this.speaker.token);
			if (token) return token.actor;
		}
		return game.actors.get(this.speaker.actor);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the item associated with this chat card.
	 * @returns {BlackFlagItem|void}
	 */
	getAssociatedItem() {
		const item = fromUuidSync(this.getFlag(game.system.id, "itemUuid"));
		if (item) return item;

		const activity = fromUuidSync(this.getFlag(game.system.id, "activityUuid"));
		if (activity) return activity.item;

		const actor = this.getAssociatedActor();
		if (!actor) return;

		const storedData = this.getFlag(game.system.id, "itemData");
		return storedData
			? new Item.implementation(storedData, { parent: actor })
			: actor.items.get(this.getFlag(game.system.id, "itemId"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Find the combatant associated with this message.
	 * @param {number} initiative - Initiative total to use to find exact matches.
	 * @returns {Combatant|void}
	 */
	getCombatant(initiative) {
		if (!initiative) {
			const rollIndex = this.rolls.findIndex(r => r instanceof CONFIG.Dice.ChallengeRoll);
			initiative = this.rolls[rollIndex]?.total;
		}

		const { exactMatch, tokenMatch, actorMatch } = Array.from(game.combats.map(c => Array.from(c.combatants)))
			.flat()
			.reduce((obj, combatant) => {
				if (obj.exactMatch) return obj;
				if (combatant.sceneId === this.speaker.scene) {
					if (combatant.tokenId === this.speaker.token) {
						obj.tokenMatch = combatant;
						if (combatant.initiative === initiative) obj.exactMatch = combatant;
					} else if (combatant.actorId === this.speaker.actor) obj.actorMatch = combatant;
				}
				return obj;
			}, {});
		return exactMatch ?? tokenMatch ?? actorMatch;
	}
}

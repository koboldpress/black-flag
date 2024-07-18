import MessageLuckElement from "../applications/components/message-luck.mjs";

/**
 * Extended version of ChatMessage to highlight critical damage, support luck modifications, and other system features.
 */
export default class BlackFlagChatMessage extends ChatMessage {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
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
			this._renderDamageUI(html);
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
		const displayChallenge = originatingMessage.shouldDisplayChallenge;
		const rollResults = html.querySelectorAll(".dice-roll");
		for (const [index, roll] of this.rolls.entries()) {
			const result = rollResults[index];
			if (!result) return;
			if (roll.isCriticalSuccess) result.classList.add("critical-success");
			else if (roll.isCriticalFailure) result.classList.add("critical-failure");
			if (roll.isSuccess && displayChallenge) result.classList.add("success");
			else if (roll.isFailure && displayChallenge) result.classList.add("failure");
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
	 * Display total damage and apply damage controls.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_renderDamageUI(html) {
		if (!this.rolls.every(r => r instanceof CONFIG.Dice.DamageRoll)) return;
		if (this.rolls.length > 1) {
			const total = this.rolls.reduce((t, r) => t + r.total, 0);
			html.querySelector(".message-content")?.insertAdjacentHTML(
				"beforeend",
				`
				<div class="damage dice-roll">
				  <div class="dice-result">
					  <h4 class="dice-total damage-total">${game.i18n.localize("Total")}: ${total}</h4>
				  </div>
				</div>
			`
			);
		}

		// TODO: Add option to make this optionally visible to players
		if (game.user.isGM) {
			const damageApplication = document.createElement("blackFlag-damageApplication");
			damageApplication.damages = this.rolls.map(roll => ({
				value: roll.total,
				type: roll.options.damageType,
				properties: new Set(roll.options.properties ?? [])
			}));
			html.querySelector(".message-content").appendChild(damageApplication);
		}
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

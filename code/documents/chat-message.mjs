import MessageLuckElement from "../applications/components/message-luck.mjs";

/**
 * Extended version of ChatMessage to highlight critical damage, support luck modifications, and other system features.
 */
export default class BlackFlagChatMessage extends ChatMessage {
	async getHTML() {
		const jQuery = await super.getHTML();
		if (!this.isContentVisible) return jQuery;
		const html = jQuery[0];

		await this._activateActivityListeners(html);
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
		const rollResults = html.querySelectorAll(".dice-roll");
		for (const [index, roll] of this.rolls.entries()) {
			const result = rollResults[index];
			if (!result) return;
			if (roll.isCriticalSuccess) result.classList.add("critical-success");
			else if (roll.isCriticalFailure) result.classList.add("critical-failure");
			if (roll.isSuccess) result.classList.add("success");
			else if (roll.isFailure) result.classList.add("failure");
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Activity Actions           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add event listeners to an activity card or remove the controls if activity could not be found.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	async _activateActivityListeners(html) {
		const uuid = this.getFlag(game.system.id, "uuid");
		if (this.getFlag(game.system.id, "type") !== "activity" || !uuid) return;

		const activity = await fromUuid(uuid);
		activity?.activateChatListeners(this, html);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Damage Rolls            */
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
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                 Luck                */
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
}

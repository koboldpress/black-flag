import BlackFlagDialog from "../applications/dialog.mjs";

/**
 * Extended version of ChatMessage to highlight critical damage, support luck modifications, and other system features.
 */
export default class BlackFlagChatMessage extends ChatMessage {
	async getHTML() {
		const jQuery = await super.getHTML();
		if ( !this.isContentVisible ) return jQuery;
		const html = jQuery[0];

		await this._activateActivityListeners(html);
		if ( this.isRoll ) {
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
		for ( const [index, roll] of this.rolls.entries() ) {
			const result = rollResults[index];
			if ( !result ) return;
			if ( roll.isCriticalSuccess ) result.classList.add("critical-success");
			else if ( roll.isCriticalFailure ) result.classList.add("critical-failure");
			if ( roll.isSuccess ) result.classList.add("success");
			else if ( roll.isFailure ) result.classList.add("failure");
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
		if ( (this.getFlag(game.system.id, "type") !== "activity") || !uuid ) return;

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
		if ( !this.rolls.every(r => r instanceof CONFIG.Dice.DamageRoll) ) return;
		if ( this.rolls.length > 1 ) {
			const total = this.rolls.reduce((t, r) => t + r.total, 0);
			html.querySelector(".message-content")?.insertAdjacentHTML("beforeend", `
				<div class="damage dice-roll">
				  <div class="dice-result">
					  <h4 class="dice-total damage-total">${game.i18n.localize("Total")}: ${total}</h4>
				  </div>
				</div>
			`);
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
		if ( !initiative ) {
			const rollIndex = this.rolls.findIndex(r => r instanceof CONFIG.Dice.ChallengeRoll);
			initiative = this.rolls[rollIndex]?.total;
		}

		const { exactMatch, tokenMatch, actorMatch } = Array.from(game.combats.map(c => Array.from(c.combatants)))
			.flat()
			.reduce((obj, combatant) => {
				if ( obj.exactMatch ) return obj;
				if ( combatant.sceneId === this.speaker.scene ) {
					if ( combatant.tokenId === this.speaker.token ) {
						obj.tokenMatch = combatant;
						if ( combatant.initiative === initiative ) obj.exactMatch = combatant;
					} else if ( combatant.actorId === this.speaker.actor ) obj.actorMatch = combatant;
				}
				return obj;
			}, {});
		return exactMatch ?? tokenMatch ?? actorMatch;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * How long should luck be able to be applied to rolls (in milliseconds).
	 * @type {number}
	 */
	static LUCK_CONTROL_PERIOD = 5 * 60 * 1000;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the luck controls on the chat card if necessary.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_renderLuckInterface(html) {
		// Grab the actor who performed the roll
		// TODO: Adjust this logic to work fully with unlinked tokens
		const actor = game.actors.get(this.speaker.actor);

		if ( !this._shouldDisplayLuckInterface(actor) ) return;

		// Add controls based on current status
		const createLuckPoints = (total, selected) => {
			let text = "";
			for ( const number of Array.fromRange(total, 1) ) {
				text += `<li class="luck-point${number <= selected ? " selected" : ""}"></li>\n`;
			}
			return text;
		};
		const content = html.querySelector(".message-content");
		const config = CONFIG.BlackFlag.luck;
		const luckAvailable = actor.system.attributes.luck.value;
		content.insertAdjacentHTML("beforeend", `
			<div class="luck-controls">
				<div class="luck-total">
					<span>Luck</span>
					<ol class="luck-points">
						${createLuckPoints(config.max, luckAvailable)}
					</ol>
				</div>
				<button data-action="luck-bonus" data-tooltip="${game.i18n.localize("BF.Luck.Action.Bonus")}">
					<i class="fa-solid fa-plus"></i>
					<ol class="luck-points cost">
						${createLuckPoints(config.costs.bonus)}
					</ol>
				</button>
				<button data-action="luck-reroll" data-tooltip="${game.i18n.localize("BF.Luck.Action.Reroll")}">
					<i class="fa-solid fa-clock-rotate-left"></i>
					<ol class="luck-points cost">
						${createLuckPoints(config.costs.reroll)}
					</ol>
				</button>
			</div>
		`);

		// Disable controls that don't have enough luck & add event listeners
		const bonusButton = html.querySelector('[data-action="luck-bonus"]');
		const rerollButton = html.querySelector('[data-action="luck-reroll"]');
		bonusButton.addEventListener("click", e => this._onLuckBonus(e, actor));
		rerollButton.addEventListener("click", e => this._onLuckReroll(e, actor));
		if ( luckAvailable < config.costs.bonus ) bonusButton.disabled = true;
		if ( luckAvailable < config.costs.reroll ) rerollButton.disabled = true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should the luck interface even be displayed?
	 * @param {BlackFlagActor} actor - Actor who performed the roll.
	 * @returns {boolean}
	 */
	_shouldDisplayLuckInterface(actor) {
		// Must have rolls to apply luck
		if ( !this.rolls?.length ) return false;

		// Only user who performed the roll should see the UI
		if ( this.user !== game.user ) return false;

		// Only PCs can spend luck
		if ( actor?.type !== "pc" ) return false;

		// Only display the UI if roll was within the past 5 minutes
		if ( this.timestamp < (Date.now() - this.constructor.LUCK_CONTROL_PERIOD) ) return false;

		// Only display initiative rolls if a combatant is found
		if ( this.getFlag("core", "initiativeRoll") ) return !!this.getCombatant();

		// Only certain roll types can be modified by luck
		const rollType = this.flags[game.system.id]?.roll?.type;
		return CONFIG.BlackFlag.luck.validRollTypes.has(rollType);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle increasing a roll result by spending luck.
	 * @param {ClickEvent} event - Triggering click event.
	 * @param {BlackFlagActor} actor - Actor who performed the roll.
	 * @returns {Promise}
	 */
	async _onLuckBonus(event, actor) {
		// Ensure there is enough luck on actor to spend
		const cost = CONFIG.BlackFlag.luck.costs.bonus;
		if ( actor.system.attributes.luck.value < cost ) {
			return ui.notifications.warn("BF.Luck.Warning.Insufficient", { localize: true });
		}

		// Fetch the roll
		const rollIndex = this.rolls.findIndex(r => r instanceof CONFIG.Dice.ChallengeRoll);
		const roll = this.rolls[rollIndex];
		if ( !roll ) return;
		const originalTotal = roll.total;

		// Update the roll with bonus
		let bonusTerm = roll.terms.find(t => t.options.luckBonus);
		if ( !bonusTerm ) {
			const operatorTerm = new OperatorTerm({ operator: "+" });
			await operatorTerm.evaluate({ async: true });
			roll.terms.push(operatorTerm);
			bonusTerm = new NumericTerm({ number: 0, options: { luckBonus: true } });
			await bonusTerm.evaluate({ async: true });
			roll.terms.push(bonusTerm);
		}
		bonusTerm.number += 1;
		roll._total = roll._evaluateTotal();
		roll.resetFormula();

		// Store the modified roll back as JSON
		const rollCollection = this.toObject().rolls;
		rollCollection[rollIndex] = JSON.stringify(roll.toJSON());
		const messageUpdates = { rolls: rollCollection };

		// Set flag to track luck spent
		const previousBonus = this.flags[game.system.id]?.luck?.bonus ?? 0;
		messageUpdates[`flags.${game.system.id}.luck.bonus`] = previousBonus + 1;

		// Spend luck on actor
		await actor.update({"system.attributes.luck.value": actor.system.attributes.luck.value - cost});

		// Update initiative if necessary
		if ( this.getFlag("core", "initiativeRoll") ) {
			await this.getCombatant(originalTotal)?.update({initiative: roll.total});
		}

		// Re-render the chat message
		await this.update(messageUpdates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle re-rolling a single die by spending luck.
	 * @param {ClickEvent} event - Triggering click event.
	 * @param {BlackFlagActor} actor - Actor who performed the roll.
	 * @returns {Promise}
	 */
	async _onLuckReroll(event, actor) {
		// Ensure there is enough luck on actor to spend
		const cost = CONFIG.BlackFlag.luck.costs.reroll;
		if ( actor.system.attributes.luck.value < cost ) {
			return ui.notifications.warn("BF.Luck.Warning.Insufficient", { localize: true });
		}

		// Only a single re-roll is allowed
		if ( this.flags[game.system.id]?.luck?.reroll ) {
			return ui.notifications.warn("BF.Luck.Warning.OnlyOneReroll", { localize: true });
		}

		// Fetch the roll
		const rollIndex = this.rolls.findIndex(r => r instanceof CONFIG.Dice.ChallengeRoll);
		const roll = this.rolls[rollIndex];
		if ( !roll ) return;
		const originalTotal = roll.total;

		// If more than one result is present, prompt for which should be re-rolled
		const die = roll.challengeDie;
		const resultValues = new Set();
		let results = die.results.filter(r => {
			if ( resultValues.has(r.result) ) return false;
			resultValues.add(r.result);
			return !r.rerolled;
		});
		let result = results[0];
		if ( resultValues.size > 1 ) {
			// Prompt for which die to re-roll
			result = await BlackFlagDialog.tooltipWait({ element: event.currentTarget }, {
				content: game.i18n.localize("BF.Luck.RerollPrompt"),
				buttons: results.reduce((obj, r) => {
					obj[r.result] = { label: r.result, callback: html => r };
					return obj;
				}, {}),
				render: true
			});
		}

		// Update the roll with a re-rolled value (somehow)
		result.active = true;
		die.reroll(`r1=${result.result}`);
		const rerolledDie = results.find(r => r.rerolled);
		if ( rerolledDie ) rerolledDie.luckReroll = true;
		// TODO: Play dice rolling sound?

		// After the re-roll, keep & drop modifiers should still be respected
		const keepDropModifiers = die.modifiers.reduce((arr, modifier) => {
			const key = Object.keys(die.constructor.MODIFIERS)
				.sort((a, b) => b.length - a.length)
				.find(c => modifier.startsWith(c));
			const command = die.constructor.MODIFIERS[key];
			if ( ["keep", "drop"].includes(command) ) arr.push({ modifier, command });
			return arr;
		}, []);
		if ( keepDropModifiers.length ) {
			die.results.filter(r => !r.rerolled).forEach(d => {
				d.active = true;
				d.discarded = false;
			});
			keepDropModifiers.forEach(({modifier, command}) => die[command](modifier));
		}
		roll._total = roll._evaluateTotal();

		// TODO: Ensure minimum roll modifier is still respected

		// Store the modified roll back as JSON
		const rollCollection = this.toObject().rolls;
		rollCollection[rollIndex] = JSON.stringify(roll.toJSON());
		const messageUpdates = { rolls: rollCollection };

		// Set flag to track luck spent
		messageUpdates[`flags.${game.system.id}.luck.reroll`] = true;

		// Spend luck on actor
		await actor.update({"system.attributes.luck.value": actor.system.attributes.luck.value - cost});

		// Update initiative if necessary
		if ( this.getFlag("core", "initiativeRoll") ) {
			await this.getCombatant(originalTotal)?.update({initiative: roll.total});
		}

		// Re-render the chat message
		await this.update(messageUpdates);
	}
}

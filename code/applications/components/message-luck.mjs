import BlackFlagDialog from "../dialog.mjs";
import MessageAssociatedElement from "./message-associated-element.mjs";

/**
 * Custom element for displaying luck controls on a chat message.
 */
export default class MessageLuckElement extends MessageAssociatedElement {
	/**
	 * How long should luck be able to be applied to rolls (in milliseconds).
	 * @type {number}
	 */
	static LUCK_CONTROL_PERIOD = 5 * 60 * 1000;

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();
		this.replaceChildren();
		this.#createLuckInterface();
		this.#hookID = Hooks.on("updateActor", this.#onUpdateActor.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	disconnectedCallback() {
		Hooks.off("updateActor", this.#hookID);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	#createLuckInterface() {
		// Add controls based on current status
		const createLuckPoints = (total, selected) => {
			let text = "";
			for (const number of Array.fromRange(total, 1)) {
				text += `<li class="luck-point${number <= selected ? " selected" : ""}"></li>\n`;
			}
			return text;
		};

		const config = CONFIG.BlackFlag.luck;
		const luckAvailable = this.actor.system.attributes.luck.value;

		this.innerHTML = `
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
		`;

		// Disable controls that don't have enough luck & add event listeners
		const bonusButton = this.querySelector('[data-action="luck-bonus"]');
		const rerollButton = this.querySelector('[data-action="luck-reroll"]');
		bonusButton.addEventListener("click", e => this.#onLuckBonus(e));
		rerollButton.addEventListener("click", e => this.#onLuckReroll(e));
		if (luckAvailable < config.costs.bonus) bonusButton.disabled = true;
		if (luckAvailable < config.costs.reroll) rerollButton.disabled = true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get actor() {
		// TODO: Adjust this logic to work fully with unlinked tokens
		return game.actors.get(this.message.speaker.actor);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * ID of the change listener.
	 * @type {number}
	 */
	#hookID;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should the luck interface even be displayed?
	 * @param {BlackFlagChatMessage} message - Message for which the luck could be added.
	 * @returns {boolean}
	 */
	static shouldDisplayLuckInterface(message) {
		// Grab the actor who performed the roll
		// TODO: Adjust this logic to work fully with unlinked tokens
		const actor = game.actors.get(message.speaker.actor);

		// Must have rolls to apply luck
		if (!message.rolls?.length) return false;

		// Only user who performed the roll should see the UI
		if (message.user !== game.user) return false;

		// Only PCs can spend luck
		if (actor?.type !== "pc") return false;

		// Only display the UI if roll was within the past 5 minutes
		if (message.timestamp < Date.now() - this.LUCK_CONTROL_PERIOD) return false;

		// Only display initiative rolls if a combatant is found
		if (message.getFlag("core", "initiativeRoll")) return !!message.getCombatant();

		// Only certain roll types can be modified by luck
		const rollType = message.flags[game.system.id]?.roll?.type;
		return CONFIG.BlackFlag.luck.validRollTypes.has(rollType);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle increasing a roll result by spending luck.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async #onLuckBonus(event) {
		const actor = this.actor;

		// Ensure there is enough luck on actor to spend
		const cost = CONFIG.BlackFlag.luck.costs.bonus;
		if (actor.system.attributes.luck.value < cost) {
			return ui.notifications.warn("BF.Luck.Warning.Insufficient", { localize: true });
		}

		// Fetch the roll
		const rollIndex = this.message.rolls.findIndex(r => r instanceof CONFIG.Dice.ChallengeRoll);
		const roll = this.message.rolls[rollIndex];
		if (!roll) return;
		const originalTotal = roll.total;

		// Update the roll with bonus
		let bonusTerm = roll.terms.find(t => t.options.luckBonus);
		if (!bonusTerm) {
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
		const rollCollection = this.message.toObject().rolls;
		rollCollection[rollIndex] = JSON.stringify(roll.toJSON());
		const messageUpdates = { rolls: rollCollection };

		// Set flag to track luck spent
		const previousBonus = this.message.flags[game.system.id]?.luck?.bonus ?? 0;
		messageUpdates[`flags.${game.system.id}.luck.bonus`] = previousBonus + 1;

		// Spend luck on actor
		await actor.update(
			{ "system.attributes.luck.value": actor.system.attributes.luck.value - cost },
			{ fromLuckCard: this.message.id }
		);

		// Update initiative if necessary
		if (this.message.getFlag("core", "initiativeRoll")) {
			await this.message.getCombatant(originalTotal)?.update({ initiative: roll.total });
		}

		// Re-render the chat message
		await this.message.update(messageUpdates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle re-rolling a single die by spending luck.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async #onLuckReroll(event) {
		const actor = this.actor;

		// Ensure there is enough luck on actor to spend
		const cost = CONFIG.BlackFlag.luck.costs.reroll;
		if (actor.system.attributes.luck.value < cost) {
			return ui.notifications.warn("BF.Luck.Warning.Insufficient", { localize: true });
		}

		// Only a single re-roll is allowed
		if (this.message.flags[game.system.id]?.luck?.reroll) {
			return ui.notifications.warn("BF.Luck.Warning.OnlyOneReroll", { localize: true });
		}

		// Fetch the roll
		const rollIndex = this.message.rolls.findIndex(r => r instanceof CONFIG.Dice.ChallengeRoll);
		const roll = this.message.rolls[rollIndex];
		if (!roll) return;
		const originalTotal = roll.total;

		// If more than one result is present, prompt for which should be re-rolled
		const die = roll.challengeDie;
		const resultValues = new Set();
		let results = die.results.filter(r => {
			if (resultValues.has(r.result)) return false;
			resultValues.add(r.result);
			return !r.rerolled;
		});
		let result = results[0];
		if (resultValues.size > 1) {
			// Prompt for which die to re-roll
			result = await BlackFlagDialog.tooltipWait(
				{ element: event.currentTarget },
				{
					content: game.i18n.localize("BF.Luck.RerollPrompt"),
					buttons: results.reduce((obj, r) => {
						obj[r.result] = { label: r.result, callback: html => r };
						return obj;
					}, {}),
					render: true
				}
			);
		}

		// Update the roll with a re-rolled value (somehow)
		result.active = true;
		die.reroll(`r1=${result.result}`);
		const rerolledDie = results.find(r => r.rerolled);
		if (rerolledDie) rerolledDie.luckReroll = true;
		// TODO: Play dice rolling sound?

		// After the re-roll, keep & drop modifiers should still be respected
		const keepDropModifiers = die.modifiers.reduce((arr, modifier) => {
			const key = Object.keys(die.constructor.MODIFIERS)
				.sort((a, b) => b.length - a.length)
				.find(c => modifier.startsWith(c));
			const command = die.constructor.MODIFIERS[key];
			if (["keep", "drop"].includes(command)) arr.push({ modifier, command });
			return arr;
		}, []);
		if (keepDropModifiers.length) {
			die.results
				.filter(r => !r.rerolled)
				.forEach(d => {
					d.active = true;
					d.discarded = false;
				});
			keepDropModifiers.forEach(({ modifier, command }) => die[command](modifier));
		}
		roll._total = roll._evaluateTotal();

		// TODO: Ensure minimum roll modifier is still respected

		// Store the modified roll back as JSON
		const rollCollection = this.message.toObject().rolls;
		rollCollection[rollIndex] = JSON.stringify(roll.toJSON());
		const messageUpdates = { rolls: rollCollection };

		// Set flag to track luck spent
		messageUpdates[`flags.${game.system.id}.luck.reroll`] = true;

		// Spend luck on actor
		await actor.update(
			{ "system.attributes.luck.value": actor.system.attributes.luck.value - cost },
			{ fromLuckCard: this.message.id }
		);

		// Update initiative if necessary
		if (this.message.getFlag("core", "initiativeRoll")) {
			await this.message.getCombatant(originalTotal)?.update({ initiative: roll.total });
		}

		// Re-render the chat message
		await this.message.update(messageUpdates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Watch for changes to luck on the associated actor.
	 * @param {BlackFlagActor} actor - Actor that was changed.
	 * @param {object} changes - Changes applied.
	 * @param {object} options - Options for the change.
	 * @param {string} userId - ID of the user who performed the change.
	 */
	#onUpdateActor(actor, changes, options, userId) {
		if (
			actor !== this.actor ||
			options.fromLuckCard === this.message.id ||
			!foundry.utils.hasProperty(changes, "system.attributes.luck.value")
		)
			return;
		if (this.constructor.shouldDisplayLuckInterface(this.message)) {
			this.replaceChildren();
			this.#createLuckInterface();
		} else {
			this.remove();
		}
	}
}

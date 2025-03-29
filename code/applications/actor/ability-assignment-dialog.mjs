import BFDocumentSheet from "../api/document-sheet.mjs";

/**
 * Dialog for choosing ability assignment mode and performing the assignment.
 */
export default class AbilityAssignmentDialog extends BFDocumentSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			buy: AbilityAssignmentDialog.#adjustPointBuy,
			confirm: AbilityAssignmentDialog.#confirmScoring,
			reset: AbilityAssignmentDialog.#resetAssignment,
			roll: AbilityAssignmentDialog.#rollScore,
			selectMethod: AbilityAssignmentDialog.#selectMethod,
			sell: AbilityAssignmentDialog.#adjustPointBuy
		},
		classes: ["ability-assignment-dialog"],
		form: {
			submitOnChange: true
		},
		position: {
			width: 700
		},
		sheetConfig: false
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		dialog: {
			template: "systems/black-flag/templates/actor/ability-assignment-dialog.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return game.i18n.localize("BF.AbilityAssignment.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.system = this.document.system;
		context.source = this.document.system._source;
		context.scoreCount = Object.keys(CONFIG.BlackFlag.abilities).length;
		switch (this.document.system.progression.abilities.method) {
			case "rolling":
				this.getRollingData(context);
				break;
			case "point-buy":
				this.getPointBuyData(context);
				break;
			case "standard-array":
			case "manual":
				this.getStandardArrayManualData(context);
				break;
		}
		context.allowManualAssignment = game.settings.get(game.system.id, "abilitySelectionManual") || game.user.isGM;
		context.allowRerolls = game.settings.get(game.system.id, "abilitySelectionReroll") || game.user.isGM;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare context data for rolling method.
	 * @param {object} context - Context being prepared.
	 */
	getRollingData(context) {
		const progression = this.document.system.progression.abilities;

		context.rolls = Array.fromRange(context.scoreCount).map(idx => {
			const roll = progression.rolls[idx] ?? null;
			const term = roll?.terms[0];
			const results = term?.results.map(r => ({
				result: term.getResultLabel(r),
				classes: term.getResultCSS(r).filterJoin(" ")
			}));
			return { roll, results };
		});
		context.sortedRolls = Array.from(progression.rolls.entries())
			.map(([index, roll]) => ({ index, roll }))
			.sort((lhs, rhs) => (rhs.roll?.total ?? Infinity) - (lhs.roll?.total ?? Infinity));

		context.scores = [];
		let bonusCount = 0;
		for (const [key, c] of Object.entries(CONFIG.BlackFlag.abilities)) {
			const value = progression.assignments[key] ?? null;
			const bonus = progression.bonuses[key] ?? null;
			if (bonus !== null) bonusCount++;
			context.scores.push({
				key,
				label: c.labels.full,
				value,
				bonus,
				maxBonus: CONFIG.BlackFlag.abilityAssignment.rolling.max - (progression.rolls[value]?.total ?? 0)
			});
		}

		const allBonuses = bonusCount >= CONFIG.BlackFlag.abilityAssignment.rolling.bonuses.length;
		context.ready = context.scores.every(s => s.value !== null) && allBonuses;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare context data for point-buy method.
	 * @param {object} context - Context being prepared.
	 */
	getPointBuyData(context) {
		const existingAssignments = this.document.system.progression.abilities.assignments;
		const config = CONFIG.BlackFlag.abilityAssignment.pointBuy;
		const sortedKeys = Object.keys(config.costs)
			.map(k => Number(k))
			.sort((lhs, rhs) => lhs - rhs);
		const minScore = sortedKeys.shift();
		const maxScore = sortedKeys.pop();
		const pluralRules = new Intl.PluralRules(game.i18n.lang);

		context.points = { max: config.points };
		context.points.spent = Object.values(existingAssignments).reduce(
			(spent, assignments) => spent + config.costs[minScore + assignments] ?? 0,
			0
		);
		context.points.remaining = context.points.max - context.points.spent;

		context.pointList = Array.fromRange(context.points.max).map(number => ({
			number: number + 1,
			spent: number >= context.points.remaining
		}));
		context.scores = [];
		for (const [key, c] of Object.entries(CONFIG.BlackFlag.abilities)) {
			const assignments = existingAssignments[key] ?? 0;
			const score = { key, label: c.labels.full, assignments };
			score.value = minScore + assignments;
			score.isMin = score.value === minScore;
			score.isMax = score.value === maxScore;
			score.existingCost = config.costs[score.value] ?? 0;
			score.nextCost = !score.isMax ? config.costs[score.value + 1] - score.existingCost : null;
			score.costDescription = score.isMax
				? "—"
				: game.i18n.format(`BF.AbilityAssignment.Method.PointBuy.Cost.Point[${pluralRules.select(score.nextCost)}]`, {
						number: score.nextCost
					});
			score.canAfford = score.nextCost !== null && score.nextCost <= context.points.remaining;
			context.scores.push(score);
		}

		context.ready = context.points.remaining === 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare context data for standard array & manual methods.
	 * @param {object} context - Context being prepared.
	 */
	getStandardArrayManualData(context) {
		context.scores = [];
		for (const [key, c] of Object.entries(CONFIG.BlackFlag.abilities)) {
			const value = this.document.system.progression.abilities.assignments[key] ?? null;
			context.scores.push({ key, label: c.labels.full, value });
		}
		context.ready = context.scores.every(s => s.value !== null);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);
		for (const element of this.element.querySelectorAll('.scores > fieldset [type="radio"]')) {
			element.addEventListener("change", this._onAssignmentChoice.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle assigning a value to an ability score in rolling & standard array methods.
	 * @param {Event} event - Triggering change event.
	 */
	async _onAssignmentChoice(event) {
		event.stopImmediatePropagation();
		const name = event.target.name;
		const key = event.target.closest("[data-key]").dataset.key;
		const value = Number(event.currentTarget.value);
		const updates = { [`system.progression.abilities.${name}.${key}`]: value };

		// Uncheck any other entries in this row
		const existingAssignments = this.document.system.progression.abilities[name];
		const otherChecked = Object.entries(existingAssignments).find(([k, v]) => k !== key && v === value)?.[0];
		if (otherChecked) {
			const value = existingAssignments[key];
			updates[`system.progression.abilities.${name}.${otherChecked}`] = name === "bonuses" ? null : value ?? null;
		}

		// Unset any previously-selected bonus
		if (name === "assignments") {
			updates[`system.progression.abilities.bonuses.${key}`] = null;
			if (otherChecked) updates[`system.progression.abilities.bonuses.${otherChecked}`] = null;
		}

		await this.document.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle buying & selling scores during point-buy.
	 * @this {AbilityAssignmentDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #adjustPointBuy(event, target) {
		const key = target.closest("[data-key]").dataset.key;
		const current = this.document.system.progression.abilities.assignments[key] ?? 0;
		await this.document.update({
			[`system.progression.abilities.assignments.${key}`]: target.dataset.action === "buy" ? current + 1 : current - 1
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Confirm scoring and set base ability scores.
	 * @this {AbilityAssignmentDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #confirmScoring(event, target) {
		const progression = this.document.system.progression.abilities;
		const updates = {};
		switch (progression.method) {
			case "rolling":
				for (const [key, idx] of Object.entries(progression.assignments)) {
					const bonus = CONFIG.BlackFlag.abilityAssignment.rolling.bonuses[progression.bonuses[key]] ?? 0;
					updates[`system.abilities.${key}.base`] = progression.rolls[idx].total + bonus;
				}
				break;
			case "point-buy":
				const minScore = Object.keys(CONFIG.BlackFlag.abilityAssignment.pointBuy.costs).reduce(
					(m, s) => (Number(s) < m ? Number(s) : m),
					Infinity
				);
				for (const key of Object.keys(CONFIG.BlackFlag.abilities)) {
					const assignments = progression.assignments[key] ?? 0;
					updates[`system.abilities.${key}.base`] = minScore + assignments;
				}
				break;
			case "standard-array":
				for (const [key, idx] of Object.entries(progression.assignments)) {
					updates[`system.abilities.${key}.base`] = CONFIG.BlackFlag.abilityAssignment.standardArray[idx];
				}
				break;
			case "manual":
				for (const [key, value] of Object.entries(progression.assignments)) {
					updates[`system.abilities.${key}.base`] = value;
				}
				break;
		}
		await this.document.update(updates);
		this.close();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle resting back to the start of the process.
	 * @this {AbilityAssignmentDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #resetAssignment(event, target) {
		const updates = { "system.progression.abilities.method": "" };
		Object.keys(this.document.system.progression.abilities.assignments).forEach(
			key => (updates[`system.progression.abilities.assignments.-=${key}`] = null)
		);
		Object.keys(this.document.system.progression.abilities.bonuses).forEach(
			key => (updates[`system.progression.abilities.bonuses.-=${key}`] = null)
		);
		await this.document.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll for an ability score and store the result.
	 * @this {AbilityAssignmentDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #rollScore(event, target) {
		const idx = target.closest("[data-index]").dataset.index;
		const roll = new Roll(CONFIG.BlackFlag.abilityAssignment.rolling.formula);
		await roll.evaluate();

		// Create chat message with roll results
		const cls = getDocumentClass("ChatMessage");
		const flavor = game.i18n.localize("BF.AbilityAssignment.RolledAbilityScore");
		const messageData = {
			flavor,
			title: `${flavor}: ${this.document.name}`,
			speaker: cls.getSpeaker({ actor: this.document }),
			user: game.user.id,
			content: "",
			sound: CONFIG.sounds.dice,
			rolls: [roll],
			"flags.blackFlag.type": "abilityScores"
		};
		const message = new cls(messageData);
		await cls.create(message.toObject(), { rollMode: game.settings.get("core", "rollMode") });

		// Save rolls
		const rollCollection = this.document.system.progression.abilities.rolls ?? [];
		while (rollCollection.length < idx) {
			rollCollection.push(null);
		}
		rollCollection[idx] = roll;
		await this.document.update({ "system.progression.abilities.rolls": rollCollection });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle selecting a specific assignment method.
	 * @this {AbilityAssignmentDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #selectMethod(event, target) {
		this.document.update({ "system.progression.abilities.method": target.dataset.method });
	}
}

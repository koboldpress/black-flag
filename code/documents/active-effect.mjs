import FormulaField from "../data/fields/formula-field.mjs";
import { numberFormat, staticID } from "../utils/_module.mjs";

/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class BlackFlagActiveEffect extends ActiveEffect {
	/**
	 * Status effect for the various conditions.
	 * @type {Record<string, string>}
	 */
	static ID = {
		ENCUMBERED: staticID("bfencumbered"),
		EXHAUSTION: staticID("bfexhaustion")
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Additional key paths to properties added during base data preparation that should be treated as formula fields.
	 * @type {Set<string>}
	 */
	static FORMULA_FIELDS = new Set([
		"system.attributes.encumbrance.bonuses.encumbered",
		"system.attributes.encumbrance.bonuses.heavilyEncumbered",
		"system.attributes.encumbrance.bonuses.maximum",
		"system.attributes.encumbrance.bonuses.overall",
		"system.attributes.encumbrance.multipliers.encumbered",
		"system.attributes.encumbrance.multipliers.heavilyEncumbered",
		"system.attributes.encumbrance.multipliers.maximum",
		"system.attributes.encumbrance.multipliers.overall",
		"system.traits.movement.multiplier"
	]);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static async _fromStatusEffect(statusId, { reference, ...effectData }, options) {
		if (!("description" in effectData) && reference) effectData.description = `@Embed[${reference} inline]`;
		return super._fromStatusEffect(statusId, effectData, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get isSuppressed() {
		if (!this.parent?.isEmbedded) return false;
		return this.suppressionReasons.length > 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * One or more reasons why this effect is suppressed.
	 * @type {string[]}
	 */
	get suppressionReasons() {
		const reasons = [];
		if (!this.parent) return reasons;
		if (this.parent.getFlag(game.system.id, "relationship.enabled") === false) {
			reasons.push("BF.Effect.SuppressionReason.Disabled");
		}
		if (this.parent.system.equippable && !this.parent.system.equipped) {
			reasons.push("BF.Effect.SuppressionReason.NotEquipped");
		}
		if (this.parent.system.attunement?.value === "required" && !this.parent.system.attuned) {
			reasons.push("BF.Effect.SuppressionReason.NotAttuned");
		}
		return reasons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		if (this.id !== this.constructor.ID.EXHAUSTION) return;

		// Change name and icon to match exhaustion level
		let level = this.getFlag("black-flag", "level");
		if (!Number.isFinite(level)) level = 1;
		this.img = `systems/black-flag/artwork/statuses/exhaustion-${level}.svg`;
		this.name = game.i18n.format("BF.Condition.Exhaustion.Numbered", { level: numberFormat(level) });
		if (level >= 6) this.statuses.add("dead");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Effect Application          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	apply(document, change) {
		// Properly handle formulas that don't exist as part of the data model
		if (this.constructor.FORMULA_FIELDS.has(change.key)) {
			const value = foundry.utils.getProperty(document, change.key) ?? null;
			const field = new FormulaField({ deterministic: true });
			const update = field.applyChange(value, null, change);
			foundry.utils.setProperty(document, change.key, update);
			return { [change.key]: update };
		}

		return super.apply(document, change);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create conditions that are applied alongside initial effect.
	 * @returns {Promise<BlackFlagActiveEffect[]>} - Created effects.
	 */
	async createRiderConditions() {
		const riders = new Set(
			this.statuses.reduce((arr, status) => {
				const r = CONFIG.statusEffects.find(e => e.id === status)?.riders ?? [];
				return arr.concat(r);
			}, [])
		);

		const created = [];
		for (const rider of riders) {
			const effect = await this.parent.toggleStatusEffect(rider, { active: true });
			if (effect instanceof BlackFlagActiveEffect) created.push(effect);
		}

		return created;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		if (userId === game.userId) {
			if (this.active && this.parent instanceof Actor) await this.createRiderConditions();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onUpdate(data, options, userId) {
		super._onUpdate(data, options, userId);
		const originalLevel = foundry.utils.getProperty(options, `${game.system.id}.originalExhaustion`);
		const newLevel = foundry.utils.getProperty(data, `flags.${game.system.id}.level`);
		const originalEncumbrance = foundry.utils.getProperty(options, `${game.system.id}.originalEncumbrance`);
		const newEncumbrance = data.statuses?.[0];
		const name = this.name;

		// Display proper scrolling status effects for exhaustion
		if (this.id === this.constructor.ID.EXHAUSTION && Number.isFinite(newLevel) && Number.isFinite(originalLevel)) {
			if (newLevel === originalLevel) return;
			if (newLevel < originalLevel)
				this.name = game.i18n.format("BF.Condition.Exhaustion.Numbered", {
					level: numberFormat(originalLevel)
				});
			this._displayScrollingStatus(newLevel > originalLevel);
			this.name = name;
		}

		// Display proper scrolling status effects for encumbrance
		else if (this.id === this.constructor.ID.ENCUMBERED && originalEncumbrance && newEncumbrance) {
			if (newEncumbrance === originalEncumbrance) return;
			const increase =
				!originalEncumbrance ||
				(originalEncumbrance === "encumbered" && newEncumbrance) ||
				newEncumbrance === "exceedingCarryingCapacity";
			if (!increase) this.name = CONFIG.BlackFlag.encumbrance.effects[originalEncumbrance].name;
			this._displayScrollingStatus(increase);
			this.name = name;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Levels Handling           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Register listeners for custom exhaustion handling in the TokenHUD.
	 */
	static registerHUDListeners() {
		Hooks.on("renderTokenHUD", this._onTokenHUDRender);
		document.addEventListener("click", this._onClickTokenHUD.bind(this), { capture: true });
		document.addEventListener("contextmenu", this._onClickTokenHUD.bind(this), { capture: true });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Adjust exhaustion icon display to match current level.
	 * @param {Application} app - The TokenHUD application.
	 * @param {jQuery} html - The TokenHUD HTML.
	 * @protected
	 */
	static _onTokenHUDRender(app, html) {
		const actor = app.object.actor;
		const level = foundry.utils.getProperty(actor, "system.attributes.exhaustion");
		if (Number.isFinite(level) && level > 0) {
			html.find('[data-status-id="exhaustion"]').css({
				objectPosition: "-100px",
				background: `url('systems/black-flag/artwork/statuses/exhaustion-${level}.svg') no-repeat center / contain`
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Implement custom exhaustion cycling when interacting with the Token HUD.
	 * @param {PointerEvent} event - The triggering event.
	 * @protected
	 */
	static _onClickTokenHUD(event) {
		const { target } = event;
		if (!target.classList?.contains("effect-control") || target.dataset?.statusId !== "exhaustion") return;
		const actor = canvas.hud.token.object?.actor;
		let level = foundry.utils.getProperty(actor ?? {}, "system.attributes.exhaustion");
		if (!Number.isFinite(level)) return;
		event.preventDefault();
		event.stopPropagation();
		if (event.button === 0) level++;
		else level--;
		actor.update({ "system.attributes.exhaustion": Math.clamp(level, 0, 6) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create an ActiveEffect instance from some status effect data.
	 * @param {string|object} effectData - The status effect ID or its data.
	 * @param {DocumentModificationContext} [options] - Additional options to pass to ActiveEffect instantiation.
	 * @returns {BlackFlagActiveEffect|void}
	 */
	static fromStatusEffect(effectData, options = {}) {
		if (typeof effectData === "string") effectData = CONFIG.statusEffects.find(e => e.id === effectData);
		if (foundry.utils.getType(effectData) !== "Object") return;
		const createData = {
			...foundry.utils.deepClone(effectData),
			_id: staticID(`bf${effectData.id}`),
			name: game.i18n.localize(effectData.name),
			statuses: [effectData.id, ...(effectData.statuses ?? [])]
		};
		this.migrateDataSafe(createData);
		this.cleanData(createData);
		return new this(createData, { keepId: true, ...options });
	}
}

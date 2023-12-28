import { numberFormat, staticID } from "../utils/_module.mjs";

/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class BlackFlagActiveEffect extends ActiveEffect {

	/**
	 * Status effect for the exhaustion condition.
	 * @type {string}
	 */
	static EXHAUSTION = staticID("bfexhaustion");

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedData() {
		super.prepareDerivedData();
		if ( this.id !== this.constructor.EXHAUSTION ) return;

		// Change name and icon to match exhaustion level
		let level = this.getFlag("black-flag", "level");
		if ( !Number.isFinite(level) ) level = 1;
		this.icon = `systems/black-flag/artwork/statuses/exhaustion-${level}.svg`;
		this.name = game.i18n.format("BF.Condition.Exhaustion.Numbered", { level: numberFormat(level) });
		if ( level >= 6 ) this.statuses.add("dead");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	apply(document, change) {
		// Grab DataField instance for target, if not found, fallback on default Foundry implementation
		const keyPath = change.key.replace("system.", "");
		const field = document.system.schema.getField(keyPath);
		if ( !change.key.startsWith("system.") || !field ) return super.apply(document, change);

		// Get the current value of the target field
		const current = foundry.utils.getProperty(document, change.key) ?? null;

		// Convert input using field's _bfCastEffectValue if it exists
		let delta;
		try {
			delta = field._bfCastDelta(this._parseOrString(change.value));
			field._bfValidateDelta(delta);
		} catch(err) {
			console.warn(
				`Actor ${document.name} [${document.id}] | Unable to parse active effect change `
				+ `for %c${change.key}%c "${change.value}": %c${err.message}`,
				"color: blue", "", "color: crimson"
			);
			return;
		}

		const MODES = CONST.ACTIVE_EFFECT_MODES;
		const changes = {};
		switch ( change.mode ) {
			case MODES.ADD:
				field._bfApplyAdd(document, change, current, delta, changes);
				break;
			case MODES.MULTIPLY:
				field._bfApplyMultiply(document, change, current, delta, changes);
				break;
			case MODES.OVERRIDE:
				field._bfApplyOverride(document, change, current, delta, changes);
				break;
			case MODES.UPGRADE:
				field._bfApplyUpgrade(document, change, current, delta, changes);
				break;
			case MODES.DOWNGRADE:
				field._bfApplyDowngrade(document, change, current, delta, changes);
				break;
			default:
				this._applyCustom(document, change, current, delta, changes);
				break;
		}

		// Apply all changes to the Document data
		foundry.utils.mergeObject(document, changes);
		return changes;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_parseOrString(raw) {
		if ( raw instanceof foundry.abstract.DataModel ) return raw;
		return super._parseOrString(raw);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_onUpdate(data, options, userId) {
		super._onUpdate(data, options, userId);
		const originalLevel = foundry.utils.getProperty(options, "blackFlag.originalExhaustion");
		const newLevel = foundry.utils.getProperty(data, "flags.black-flag.level");
		if ( (this.id === this.constructor.EXHAUSTION) && Number.isFinite(newLevel) && Number.isFinite(originalLevel) ) {
			if ( newLevel === originalLevel ) return;
			const name = this.name;
			if ( newLevel < originalLevel ) game.i18n.format("BF.Condition.Exhaustion.Numbered", {
				level: numberFormat(originalLevel)
			});
			this._displayScrollingStatus(newLevel > originalLevel);
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
		if ( Number.isFinite(level) && (level > 0) ) {
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
		if ( !target.classList?.contains("effect-control") || (target.dataset?.statusId !== "exhaustion") ) return;
		const actor = canvas.hud.token.object?.actor;
		let level = foundry.utils.getProperty(actor ?? {}, "system.attributes.exhaustion");
		if ( !Number.isFinite(level) ) return;
		event.preventDefault();
		event.stopPropagation();
		if ( event.button === 0 ) level++;
		else level--;
		actor.update({ "system.attributes.exhaustion": Math.clamped(level, 0, 6) });
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
	static fromStatusEffect(effectData, options={}) {
		if ( typeof effectData === "string" ) effectData = CONFIG.statusEffects.find(e => e.id === effectData);
		if ( foundry.utils.getType(effectData) !== "Object" ) return;
		const createData = {
			...foundry.utils.deepClone(effectData),
			_id: staticID(`bf${effectData.id}`),
			name: game.i18n.localize(effectData.name),
			statuses: [effectData.id, ...effectData.statuses ?? []]
		};
		this.migrateDataSafe(createData);
		this.cleanData(createData);
		return new this(createData, { keepId: true, ...options });
	}
}

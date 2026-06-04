import { staticID } from "../utils/_module.mjs";

/**
 * Extended version of `TokenDocument` class to support some system-specific functionality.
 */
export default class BlackFlagTokenDocument extends TokenDocument {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		super.prepareData();
		if (!this.hasDynamicRing) return;
		let size = this.baseActor?.system.traits?.size;
		if (!this.actorLink) {
			const deltaSize = this.delta.system.traits?.size;
			if (deltaSize) size = deltaSize;
		}
		if (!size) return;
		const scale = CONFIG.BlackFlag.actorSizes[size]?.dynamicTokenScale ?? 1;
		this.texture.scaleX = this._source.texture.scaleX * scale;
		this.texture.scaleY = this._source.texture.scaleY * scale;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Movement              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set up the system's movement action customization.
	 */
	static registerMovementActions() {
		for (const type of Object.keys(CONFIG.BlackFlag.movementTypes)) {
			const actionConfig = CONFIG.Token.movement.actions[type];
			if (!actionConfig) continue;
			actionConfig.getAnimationOptions = token => {
				const actorMovement = token?.actor?.system.traits?.movement?.types ?? {};
				if (!(type in actorMovement) || actorMovement[type]) return {};
				return { movementSpeed: CONFIG.Token.movement.defaultSpeed / 2 };
			};
			actionConfig.getCostFunction = (...args) => this.getMovementActionCostFunction(type, ...args);
		}
		CONFIG.Token.movement.actions.crawl.getCostFunction = token => {
			const noAutomation = !game.settings.get(game.system.id, "tokenMeasurementAutomation");
			const { actor } = token;
			const actorMovement = actor?.system.traits?.movement?.types;
			const hasMovement = actorMovement !== undefined;
			return noAutomation || !actor?.system.isCreature || !hasMovement
				? cost => cost
				: (cost, _from, _to, distance) => cost + distance;
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return the movement action cost function for a specific movement type.
	 * @param {string} type
	 * @param {TokenDocument5e} token
	 * @param {TokenMeasureMovementPathOptions} options
	 * @returns {TokenMovementActionCostFunction}
	 */
	static getMovementActionCostFunction(type, token, options) {
		const noAutomation = !game.settings.get(game.system.id, "tokenMeasurementAutomation");
		const { actor } = token;
		const actorMovement = actor?.system.traits?.movement?.types;
		const walkFallback = CONFIG.BlackFlag.movementTypes[type]?.walkFallback;
		const hasMovement = actorMovement !== undefined;
		const speed = actorMovement?.[type];
		return noAutomation || !actor?.system.isCreature || !hasMovement || speed || (!speed && !walkFallback)
			? cost => cost
			: (cost, _from, _to, distance) => cost + distance;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Ring Animations           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Flash the token ring based on damage, healing, or temp HP.
	 * @param {string} type - The key to determine the type of flashing.
	 */
	flashRing(type) {
		if (!this.rendered) return;
		const color = CONFIG.BlackFlag.tokenRingColors[type];
		if (!color) return;
		const options = {};
		if (type === "damage") {
			options.duration = 500;
			options.easing = foundry.canvas.placeables.tokens.TokenRing.easeTwoPeaks;
		}
		this.object.ring?.flashColor(Color.from(color), options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if any rings colors should be forced based on current status.
	 * @returns {{ [ring]: number, [background]: number }}
	 */
	getRingColors() {
		const colors = {};
		if (this.hasStatusEffect(CONFIG.specialStatusEffects.DEFEATED)) {
			colors.ring = CONFIG.BlackFlag.tokenRingColors.defeated;
		}
		return colors;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine what ring effects should be applied on top of any set by flags.
	 * @returns {string[]}
	 */
	getRingEffects() {
		const e = foundry.canvas.placeables.tokens.TokenRing.effects;
		const effects = [];
		if (this.hasStatusEffect(CONFIG.specialStatusEffects.INVISIBLE)) effects.push(e.INVISIBILITY);
		else if (this === game.combat?.combatant?.token) effects.push(e.RING_GRADIENT);
		return effects;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		const origin = this.actor?.getFlag(game.system.id, "summon.origin");
		if (origin) BlackFlag.registry.summons.untrack(origin.split(".Item.")[0], this.actor.uuid);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set up any hooks relevant to token rendering.
	 */
	static setupHooks() {
		Hooks.on("targetToken", BlackFlag.canvas.BlackFlagToken.onTargetToken);
	}
}

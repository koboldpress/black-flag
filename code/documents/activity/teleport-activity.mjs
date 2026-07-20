import { convertDistance, getSelectedTokens } from "../../utils/_module.mjs";
import { TeleportData } from "../../data/activity/teleport-data.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for teleporting a token.
 */
export default class TeleportActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "teleport",
				dataModel: TeleportData,
				icon: "systems/black-flag/artwork/activities/teleport.svg",
				title: "BF.TELEPORT.Title",
				hint: "BF.TELEPORT.Hint",
				usage: {
					actions: {
						planTeleport: TeleportActivity.#planTeleport
					}
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can this activity currently plan teleport movement?
	 * @type {boolean}
	 */
	get canPlanTeleport() {
		return (
			!Number.isFinite(this.system.distance.value) ||
			(this.system.distance.unit in CONFIG.BlackFlag.distanceUnits && this.system.distance.value > 0)
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_activationChatButtons(message) {
		return [
			{
				label: game.i18n.localize("BF.TELEPORT.Action.Teleport"),
				icon: '<i class="fa-solid fa-person-walking-dashed-line-arrow-right" inert></i>',
				dataset: {
					action: "planTeleport"
				}
			}
		].concat(super._activationChatButtons(message));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	shouldHideChatButton(button, message) {
		switch (button.dataset.action) {
			case "planTeleport":
				return !this.canPlanTeleport;
		}
		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef TeleportMovementResult
	 * @param {BFToken} token
	 * @param {{ id: string, origin: TokenPosition, destination: TokenPosition, waypoints: TokenMovementWaypoint[] }} plan
	 * @param {boolean} moved
	 */

	/**
	 * Handle planning teleport for selected tokens.
	 * @returns {Promise<TeleportMovementResult[]|null>}
	 */
	async planTeleport() {
		if (!this.canPlanTeleport) return null;

		const tokens = canvas.tokens?.controlled.length ? getSelectedTokens() : [];
		if (!tokens.length) {
			ui.notifications.warn("BF.Tokens.NoneSelected", { localize: true });
			return null;
		}

		const maxDistance = this.#getSceneMaxDistance();
		if (maxDistance <= 0) {
			ui.notifications.warn("BF.TELEPORT.Warning.InvalidDistance", { localize: true });
			return null;
		}

		const config = { maxDistance, tokens };

		/**
		 * A hook event that fires before teleport movement has been planned.
		 * @function blackFlag.preTeleport
		 * @memberof hookEvents
		 * @param {TeleportActivity} activity                          The activity that is performing the teleportation.
		 * @param {{ maxDistance: number, tokens: BlackFlagToken[] }} config  Information on the teleport to plan.
		 * @returns {boolean}  Explicitly return `false` to prevent teleporting.
		 */
		if (Hooks.call("blackFlag.preTeleport", this, config) === false) return;

		const plans = [];
		for (const token of config.tokens) {
			const plan = await token.planMovement({
				allowedActions: ["blink"],
				direct: true,
				maxDistance: config.maxDistance,
				preventDrop: true
			});
			if (!plan) continue;
			plans.push({ token, plan });
		}

		/**
		 * A hook event that fires after teleport movement has been planned, but before tokens have been moved.
		 * @function blackFlag.teleport
		 * @memberof hookEvents
		 * @param {TeleportActivity} activity                       The activity that is performing the teleportation.
		 * @param {Omit<TeleportMovementResult, "result">[]} plans  Plans for tokens that are to be moved.
		 * @returns {boolean}  Explicitly return `false` to prevent teleporting.
		 */
		if (Hooks.call("blackFlag.teleport", this, plans) === false) return;

		const results = await Promise.all(
			plans.map(({ token, plan }) => token.document.startMovement(plan.id).then(moved => ({ token, plan, moved })))
		);

		/**
		 * A hook event that fires after teleport movement has occurred.
		 * @function blackFlag.postTeleport
		 * @memberof hookEvents
		 * @param {TeleportActivity} activity         The activity that is performing the teleportation.
		 * @param {TeleportMovementResult[]} results  Plans for tokens that are to be moved.
		 */
		Hooks.callAll("blackFlag.postTeleport", this, results);

		return results;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the maximum teleport distance converted into the current scene's units.
	 * @returns {number|null}
	 */
	#getSceneMaxDistance() {
		if (!Number.isFinite(this.system.distance.value)) return Infinity;
		if (
			!(this.system.distance.unit in CONFIG.BlackFlag.distanceUnits) ||
			!(this.system.distance.value > 0) ||
			!(canvas.grid?.units in CONFIG.BlackFlag.distanceUnits)
		)
			return null;
		return convertDistance(this.system.distance.value, this.system.distance.unit, canvas.grid.units).value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle planning teleport movement from the chat card.
	 * @this {TeleportActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 * @returns {Promise<TeleportMovementResult[]|null>}
	 */
	static async #planTeleport(event, target, message) {
		return this.planTeleport();
	}
}

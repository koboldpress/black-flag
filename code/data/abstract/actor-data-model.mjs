import Proficiency from "../../documents/proficiency.mjs";
import BaseDataModel from "./base-data-model.mjs";

export default class ActorDataModel extends BaseDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareBaseData() {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data that needs to be prepared after embedded documents have been prepared,
	 * but before active effects are applied.
	 */
	prepareEmbeddedData() {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareDerivedData() {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare any final notifications. Called at the very end of the data preparation process.
	 */
	prepareNotifications() {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get embeddedDescriptionKeyPath() {
		return "biography.value";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this actor under the effect of this property from some status or due to its level of exhaustion?
	 * @param {string} key - A key in `CONFIG.BlackFlag.conditionEffects`.
	 * @returns {boolean} - Whether the actor is affected.
	 */
	hasConditionEffect(key) {
		const props = CONFIG.BlackFlag.conditionEffects[key] ?? new Set();
		const level = this.attributes?.exhaustion ?? null;
		const imms = this.traits?.condition?.immunities?.value ?? new Set();
		const applyExhaustion = level !== null && !imms.has("exhaustion");
		return props.some(k => {
			const l = Number(k.split("-").pop());
			return (this.parent.statuses.has(k) && !imms.has(k)) || (applyExhaustion && Number.isInteger(l) && level >= l);
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine the ability with the highest modifier from the provided list, or from all abilities.
	 * @param {string[]|Set<string>} [from] - Set of abilities to select from.
	 * @returns {string} - Ability with the highest modifier.
	 */
	selectBestAbility(from) {
		from ??= new Set(Object.keys(CONFIG.BlackFlag.abilities));
		return from.reduce((highest, key) =>
			(this.abilities?.[key]?.mod ?? -Infinity) > (this.abilities?.[highest]?.mod ?? -Infinity) ? key : highest
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct an initiative roll.
	 * @param {ChallengeRollOptions} [options] - Options for the roll.
	 * @returns {InitiativeRollProcessConfiguration}
	 */
	getInitiativeRollConfig(options = {}) {
		return {};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
	 * @param {object} [options]
	 * @param {boolean} [options.deterministic] - Whether to force deterministic values for data properties that could be
	 *                                            either a die term or a flat term.
	 * @returns {object}
	 */
	getRollData({ deterministic = false } = {}) {
		const rollData = { ...this };
		rollData.prof = new Proficiency(this.attributes?.proficiency ?? 0, 1);
		if (deterministic) rollData.prof = rollData.prof.flat;
		return rollData;
	}
}

import { CheckData } from "../../data/activity/check-data.mjs";
import Activity from "./activity.mjs";

export default class CheckActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "check",
				dataModel: CheckData,
				icon: "systems/black-flag/artwork/activities/check.svg",
				title: "BF.CHECK.Title",
				hint: "BF.CHECK.Hint",
				usage: {
					actions: {
						rollCheck: CheckActivity.#rollCheck
					}
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_activationChatButtons() {
		const buttons = [];
		const dc = this.system.check.dc.value;

		const SKILLS = CONFIG.BlackFlag.skills.localized;
		const TOOLS = CONFIG.BlackFlag.tools.localized;
		const VEHICLES = CONFIG.BlackFlag.vehicles.localized;

		const createButton = (abilityKey, associated) => {
			const ability = CONFIG.BlackFlag.abilities.localized[abilityKey];
			const checkType =
				associated in SKILLS ? "skill" : associated in TOOLS ? "tool" : associated in VEHICLES ? "vehicle" : "ability";
			const dataset = {
				ability: abilityKey,
				action: "rollCheck",
				visibility: this.system.check.visible ? "all" : undefined
			};
			if (dc) dataset.dc = dc;
			if (checkType !== "ability") dataset[checkType] = associated;

			let label = ability;
			let type;
			if (checkType === "skill") type = SKILLS[associated];
			else if (checkType === "tool") type = TOOLS[associated];
			else if (checkType === "vehicle") type = VEHICLES[associated];
			if (type) label = game.i18n.format("BF.Enricher.Check.Specific", { ability, type });

			buttons.push({
				label: dc
					? `
					<span class="visible-dc">${game.i18n.format("BF.Enricher.DC.Phrase", { dc, check: wrap(label) })}</span>
					<span class="hidden-dc">${wrap(label)}</span>
				`
					: wrap(label),
				// TODO: Icons
				dataset
			});
		};
		const wrap = check => game.i18n.format("BF.Enricher.Check.Short", { check });

		const associated = Array.from(this.system.check.associated);
		if (!associated.length && this.item.type === "tool") associated.push(this.item.system.type.base);
		if (associated.length)
			associated.forEach(a => {
				// TODO: Allow rolling without proper ability
				const ability = this.system.getAbility(a);
				if (ability) createButton(ability, a);
			});
		else if (this.system.check.ability) createButton(this.system.check.ability);

		return buttons.concat(super._activationChatButtons());
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle performing a check.
	 * @this {CheckActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static async #rollCheck(event, target, message) {
		const targets = this.getActionTargets();
		if (!targets.length) return; // TODO: Display UI warning here
		let { ability, dc, skill, tool, vehicle } = target.dataset;
		dc = parseInt(dc);
		const rollConfig = { ability, event, target: Number.isFinite(dc) ? dc : this.system.check.dc.value };
		const dialogConfig = {};
		const messageConfig = { data: {} };

		for (const token of targets) {
			messageConfig.data.speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token: token.document });
			if (skill) {
				await token.actor.rollSkill({ ...rollConfig, skill }, dialogConfig, messageConfig);
			} else if (tool) {
				await token.actor.rollTool({ ...rollConfig, tool }, dialogConfig, messageConfig);
			} else if (vehicle) {
				await token.actor.rollVehicle({ ...rollConfig, vehicle }, dialogConfig, messageConfig);
			} else {
				await token.actor.rollAbilityCheck(rollConfig, dialogConfig, messageConfig);
			}
		}
	}
}

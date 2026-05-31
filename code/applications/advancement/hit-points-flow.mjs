import { formatNumber } from "../../utils/_module.mjs";
import AdvancementFlow from "./advancement-flow-v2.mjs";

/**
 * Inline application that presents hit points selection upon level up.
 */
export default class HitPointsFlow extends AdvancementFlow {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		if (context.needsConfiguration)
			context.actions.push(
				{
					type: "submit",
					classes: "light-button",
					action: "takeAverage",
					label: `
					${_loc("BF.Advancement.HitPoints.Action.TakeAverage")}
					<strong>${formatNumber(this.advancement.average, { sign: true })}</strong>
				`
				},
				{
					html: `<span class="or">${_loc("BF.Advancement.HitPoints.Action.or")}</span>`
				},
				{
					type: "submit",
					classes: "light-button",
					action: "roll",
					label: `
					${_loc("BF.Roll.Action.RollSpecific", { type: _loc("BF.HitDie.Label[one]") })}
					<strong>d${this.advancement.configuration.denomination}</strong>
				`
				}
			);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareControlsContext(context, options) {
		context = await super._prepareControlsContext(context, options);
		context.showReverse = context.editable && this.levels.character !== 1;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _handleForm(event, form, formData) {
		const action = event.submitter.dataset.action;
		const level = this.advancement.relavantLevel(this.levels);

		// Take the average value
		if (action === "takeAverage") {
			return this.advancement.apply(this.levels, { [level]: "avg" });
		} else if (action === "roll") {
			const roll = new Roll(`1d${this.advancement.configuration.denomination}`);
			await roll.evaluate();

			// Create chat message with roll results
			const cls = getDocumentClass("ChatMessage");
			const flavor = _loc("BF.Roll.Action.RollSpecific", {
				type: _loc("BF.HitPoint.Label[other]")
			});
			const messageData = {
				flavor,
				title: `${flavor}: ${this.advancement.actor.name}`,
				speaker: cls.getSpeaker({ actor: this.advancement.actor }),
				user: game.user.id,
				content: "",
				sound: CONFIG.sounds.dice,
				rolls: [roll],
				"flags.blackFlag.type": "hitPoints"
			};
			const message = new cls(messageData);
			await cls.create(message.toObject(), { messageMode: CONFIG.Dice.BasicRoll.getMessageMode() });

			return this.advancement.apply(this.levels, { [level]: JSON.stringify(roll.toJSON()) });
		}
	}
}

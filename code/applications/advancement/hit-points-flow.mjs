import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that presents hit points selection upon level up.
 */
export default class HitPointsFlow extends AdvancementFlow {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/hit-points-flow.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData() {
		return foundry.utils.mergeObject(super.getData(), {
			denomination: this.advancement.configuration.denomination,
			isFirstLevel: this.levels.character === 1
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _updateObject(event, formData) {
		const action = event.submitter.dataset.action;
		const level = this.advancement.relavantLevel(this.levels);

		// Take the average value
		if (action === "take-average") {
			return this.advancement.apply(this.levels, { [level]: "avg" });
		} else if (action === "roll") {
			const roll = new Roll(`1d${this.advancement.configuration.denomination}`);
			await roll.evaluate();

			// Create chat message with roll results
			const cls = getDocumentClass("ChatMessage");
			const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", {
				type: game.i18n.localize("BF.HitPoint.Label[other]")
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
			await cls.create(message.toObject(), { rollMode: game.settings.get("core", "rollMode") });

			return this.advancement.apply(this.levels, { [level]: roll });
		}
	}
}

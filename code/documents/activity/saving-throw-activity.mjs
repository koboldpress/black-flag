import { SavingThrowData } from "../../data/activity/saving-throw-data.mjs";
import { numberFormat, simplifyBonus } from "../../utils/_module.mjs";
import DamageActivity from "./damage-activity.mjs";

export default class SavingThrowActivity extends DamageActivity {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "savingThrow",
		dataModel: SavingThrowData,
		icon: "systems/black-flag/artwork/activities/saving-throw.svg",
		title: "BF.Activity.SavingThrow.Title",
		hint: "BF.Activity.SavingThrow.Hint"
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the challenge column in the action table.
	 * @type {string}
	 */
	get challengeColumn() {
		if ( !this.system.dc.final ) return "";
		const layout = document.createElement("div");
		layout.classList.add("layout");
		layout.innerHTML = `<span class="dc">${numberFormat(this.system.dc.final)}</span>`;
		const ability = CONFIG.BlackFlag.abilities.localizedAbbreviations[this.savingThrowAbility];
		layout.innerHTML += `<span class="ability">${ability}</span>`;
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used to determine the DC of this ability.
	 * @type {string|null}
	 */
	get savingThrowAbility() {
		if ( this.system.dc.ability === "custom" ) return null;
		if ( this.system.dc.ability ) return this.system.dc.ability;
		return this.item.system.ability ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for item activation.
	 * @returns {object}
	 */
	async activationChatContext() {
		const context = await super.activationChatContext();
		context.buttons = {
			savingThrow: {
				label: game.i18n.localize("BF.Activity.SavingThrow.Title"),
				dataset: { action: "roll", method: "rollSavingThrow" }
			}
		};
		if ( this.hasDamage ) context.buttons.damage = {
			label: game.i18n.localize("BF.Damage.Label"),
			dataset: { action: "roll", method: "rollDamage" }
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll a saving throw.
	 * @param {ChallengeRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @param {BasicRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollSavingThrow(config={}, message={}, dialog={}) {
		// Determine DC based on settings & the actor to whom the activity belongs
		const rollData = this.item.getRollData({ deterministic: true });
		const ability = rollData.abilities?.[this.savingThrowAbility];
		if ( ability ) rollData.mod = ability.mod;
		const dc = this.system.dc.ability === "custom" ? simplifyBonus(this.system.dc.formula, rollData) : ability?.dc;

		// Pass on DC and rolling ability to `rollAbilitySave` on any selected actors/tokens
		for ( const target of this.getActionTargets() ) {
			const speaker = ChatMessage.getSpeaker({scene: canvas.scene, token: target.document});
			await target.actor.rollAbilitySave({
				ability: this.system.ability,
				event,
				options: { target: dc }
			}, {
				data: { speaker }
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	createDamageConfigs(config, rollData) {
		config = foundry.utils.mergeObject({
			options: {
				allowCritical: false
			}
		}, config);
		return super.createDamageConfigs(config, rollData);
	}
}

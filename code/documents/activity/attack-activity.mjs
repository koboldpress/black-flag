import { AttackData } from "../../data/activity/attack-data.mjs";
import { buildRoll, numberFormat } from "../../utils/_module.mjs";
import DamageActivity from "./damage-activity.mjs";

export default class AttackActivity extends DamageActivity {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "attack",
		dataModel: AttackData,
		icon: "systems/black-flag/artwork/activities/attack.svg",
		title: "BF.Activity.Attack.Title",
		hint: "BF.Activity.Attack.Hint"
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used to make attack rolls for this activity.
	 * @type {string|null}
	 */
	get attackAbility() {
		if ( this.system.ability === "none" ) return null;
		if ( this.system.ability ) return this.system.ability;
		return this.item.system.ability ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the challenge column in the action table.
	 * @type {string}
	 */
	get challengeColumn() {
		const layout = document.createElement("div");
		layout.classList.add("layout");
		layout.innerHTML = numberFormat(this.system.toHit, { sign: true });
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get hasDamage() {
		return super.hasDamage || (this.system.damage.includeBaseDamage && !!this.item.system.damage?.formula);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get modifierData() {
		return { type: "attack", ...super.modifierData };
	}

	// TODO: Prepare proper title like "Melee Weapon Attack"

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
			attack: {
				label: game.i18n.localize("BF.Activity.Attack.Title"),
				dataset: { action: "roll", method: "rollAttack" }
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
	 * Roll an attack.
	 * @param {ChallengeRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BaseMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @param {BaseDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollAttack(config={}, message={}, dialog={}) {
		// Determine which ability to use with the attack
		const ability = this.actor?.system.abilities[this.attackAbility];

		// TODO: Associate ammunition with the attack

		const rollData = this.item.getRollData();

		const { parts, data } = buildRoll({
			mod: ability?.mod,
			prof: this.item.system.proficiency?.hasProficiency ? this.item.system.proficiency.term : null,
			bonus: this.actor?.system.buildBonus(this.actor?.system.getModifiers(this.modifierData), { rollData })
		}, rollData);

		const rollConfig = foundry.utils.mergeObject({
			data,
			options: {
				// TODO: criticalSuccess: this.system.criticalThreshold
				minimum: this.actor?.system.buildMinimum(
					this.actor?.system.getModifiers(this.modifierData, "min"), { rollData }
				)
			}
		}, config);
		rollConfig.parts = parts.concat(config.parts ?? []);

		const messageConfig = foundry.utils.mergeObject({
			data: {
				title: `${this.name}: ${this.item.actor?.name ?? ""}`,
				flavor: this.name,
				speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
				"flags.black-flag.roll": {
					type: "attack",
					origin: this.uuid
				}
			}
		}, message);

		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers(this.modifierData, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

		/**
		 * A hook event that fires before an attack is rolled.
		 * @function blackFlag.preRollAttack
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity performing the attack.
		 * @param {ChallengeRollConfiguration} config - Configuration data for the pending roll.
		 * @param {BaseMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {BaseDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if ( Hooks.call("blackFlag.preRollAttack", this, rollConfig, messageConfig, dialogConfig) === false ) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, messageConfig, dialogConfig);
		if ( !rolls?.length ) return;

		/**
		 * A hook event that fires after an attack has been rolled.
		 * @function blackFlag.postRollAttack
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity performing the attack.
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 */
		Hooks.callAll("blackFlag.rollAttack", this, rolls);

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	createDamageConfigs(config, rollData) {
		const rollConfigs = super.createDamageConfigs(config, rollData);
		if ( this.system.damage.includeBaseDamage && this.item.system.damage ) {
			const ability = this.actor?.system.abilities[this.attackAbility];
			const damage = this.item.system.damage;
			const modifierData = { ...this.modifierData, type: "damage", damage, baseDamage: true };
			const { parts, data } = buildRoll({
				mod: ability?.mod,
				bonus: this.actor?.system.buildBonus(this.actor?.system.getModifiers(modifierData), { rollData })
			}, rollData);
			rollConfigs.unshift(foundry.utils.mergeObject({
				data,
				modifierData,
				parts: damage.custom ? [damage.custom] : [damage.formula, ...(parts ?? [])],
				options: {
					// TODO: Get critical settings
					damageType: damage.type,
					minimum: this.actor?.system.buildMinimum(
						this.actor?.system.getModifiers(modifierData, "min"), { rollData: rollData }
					)
				}
			}, config));
		}
		return rollConfigs;
	}
}

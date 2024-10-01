import { SaveData } from "../../data/activity/save-data.mjs";
import { numberFormat, simplifyBonus } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

export default class SaveActivity extends Activity {
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "save",
				dataModel: SaveData,
				icon: "systems/black-flag/artwork/activities/save.svg",
				title: "BF.SAVE.Title",
				hint: "BF.SAVE.Hint",
				usage: {
					actions: {
						rollDamage: SaveActivity.#rollDamage,
						rollSave: SaveActivity.#rollSave
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
	 * Contents of the challenge column in the action table.
	 * @type {string}
	 */
	get challengeColumn() {
		if (!this.system.save.dc.final) return "";
		const layout = document.createElement("div");
		layout.classList.add("layout");
		layout.innerHTML = `<span class="dc">${numberFormat(this.system.save.dc.final)}</span>`;
		const ability = CONFIG.BlackFlag.abilities.localizedAbbreviations[this.system.save.ability];
		layout.innerHTML += `<span class="ability">${ability}</span>`;
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used to determine the DC of this ability.
	 * @type {string|null}
	 */
	get dcAbility() {
		if (this.system.save.dc.ability === "custom") return null;
		if (this.system.save.dc.ability && this.system.save.dc.ability !== "spellcasting") {
			return this.system.save.dc.ability;
		}

		let ability = this.item.system.ability;
		if (!ability && this.actor && (this.isSpell || this.system.save.dc.ability === "spellcasting")) {
			const abilities = Object.values(this.actor.system.spellcasting?.origins ?? {}).reduce((set, o) => {
				set.add(o.ability);
				return set;
			}, new Set());
			ability = this.actor.system.selectBestAbility?.(abilities);
		}
		return ability ?? (this.isSpell ? "intelligence" : null);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get modifierData() {
		return {
			kind: "save",
			...super.modifierData
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_activationChatButtons() {
		const ability = CONFIG.BlackFlag.abilities.localizedAbbreviations[this.system.save.ability] ?? "";
		const dc = game.i18n.format("BF.Enricher.DC.Phrase", { dc: this.system.save.dc.final, check: ability });
		const buttons = [
			{
				label: `
				<span class="visible-dc">${game.i18n.format("BF.Enricher.Save.Long", { save: dc })}</span>
				<span class="hidden-dc">${game.i18n.format("BF.Enricher.Save.Long", { save: ability })}</span>
			`,
				dataset: {
					dc: this.system.save.dc.final,
					ability: this.system.save.ability,
					action: "rollSave",
					visibility: "all"
				}
			}
		];
		if (this.hasDamage)
			buttons.push({
				label: game.i18n.localize("BF.DAMAGE.Label"),
				icon: '<i class="fa-solid fa-burst" inert></i>',
				dataset: {
					action: "rollDamage"
				}
			});
		return buttons.concat(super._activationChatButtons());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display an activation chat message for this activity.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the created message.
	 * @returns {Promise<ChatMessage|ActivityMessageConfiguration>}
	 */
	async createActivationMessage(message = {}) {
		const messageConfig = foundry.utils.mergeObject(
			{
				"data.flags.black-flag.save": {
					ability: this.system.save.ability,
					dc: this.system.save.dc.final
				}
			},
			message
		);

		return super.createActivationMessage(messageConfig);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle performing a damage roll.
	 * @this {SaveActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static #rollDamage(event, target, message) {
		this.rollDamage({ event });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle performing an saving throw.
	 * @this {SaveActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static async #rollSave(event, target, message) {
		const targets = this.getActionTargets();
		if (!targets.length) return; // TODO: Display UI warning here
		const dc = parseInt(target.dataset.dc);
		for (const token of targets) {
			const speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token: token.document });
			await token.actor.rollAbilitySave(
				{
					ability: target.dataset.ability ?? this.system.save.ability,
					event,
					target: Number.isFinite(dc) ? dc : this.system.save.dc.final
				},
				{
					data: { speaker }
				}
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getDamageConfig(config = {}) {
		const rollConfig = super.getDamageConfig(config);

		rollConfig.critical ??= {};
		rollConfig.critical.allow ??= false;

		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Save ability, dc, and activity for the default save this item might have.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{ability: string, dc: string, activity: Activity}|null}
	 */
	getSaveDetails(options = {}) {
		const rollData = this.item.getRollData({ deterministic: true });
		const ability = rollData.abilities?.[this.dcAbility];
		if (ability) rollData.mod = ability.mod;
		const dc =
			this.system.save.dc.ability === "custom" ? simplifyBonus(this.system.save.dc.formula, rollData) : ability?.dc;
		return { ability: this.system.save.ability, dc, activity: this };
	}
}

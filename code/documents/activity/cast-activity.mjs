import { CastData } from "../../data/activity/cast-data.mjs";
import { staticID } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for casting spells.
 */
export default class CastActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Static ID used for the enchantment that modifies spell data.
	 */
	static ENCHANTMENT_ID = staticID("bfspellchanges");

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "cast",
				dataModel: CastData,
				icon: "systems/black-flag/artwork/activities/cast.svg",
				title: "BF.CAST.Title",
				hint: "BF.CAST.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Cached copy of the associated spell stored on the actor.
	 * @type {BlackFlagItem|void}
	 */
	get cachedSpell() {
		return this.actor?.sourcedItems
			.get(this.system.spell.uuid)
			?.find(i => i.getFlag(game.system.id, "cachedFor") === this.relativeUUID);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should this spell be listed in the actor's spellbook?
	 * @type {boolean}
	 */
	get displayInSpellbook() {
		return this.item.system.magicAvailable && this.system.spell.spellbook;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async activate(config = {}, dialog = {}, message = {}) {
		if (!this.item.isEmbedded || !this.item.isOwner || this.item.pack) return;

		/**
		 * A hook event that fires before a linked spell is used by a Cast activity.
		 * @function blackFlag.preUseLinkedSpell
		 * @memberof hookEvents
		 * @param {CastActivity} activity - Cast activity being used.
		 * @param {Partial<ActivityActivationConfiguration>} activationConfig - Configuration info for the activation.
		 * @param {Partial<ActivityDialogConfiguration>} dialogConfig - Configuration info for the usage dialog.
		 * @param {Partial<ActivityMessageConfiguration>} messageConfig - Configuration info for the created chat message.
		 * @returns {boolean}  Explicitly return `false` to prevent activity from being used.
		 */
		if (Hooks.call("blackFlag.preUseLinkedSpell", this, config, dialog, message) === false) return;

		let spell = this.cachedSpell;
		if (!spell) {
			[spell] = await this.actor.createEmbeddedDocuments("Item", [await this.getCachedSpellData()]);
		}

		const results = await spell.activate(config, dialog, message);

		/**
		 * A hook event that fires after a linked spell is used by a Cast activity.
		 * @function blackFlag.postUseLinkedSpell
		 * @memberof hookEvents
		 * @param {CastActivity} activity - Activity being activated.
		 * @param {Partial<ActivityUseConfiguration>} activationConfig - Configuration data for the activation.
		 * @param {ActivityUsageResults} results - Final details on the activation.
		 */
		if (results) Hooks.callAll("blackFlag.postUseLinkedSpell", this, config, results);

		return results;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the data for the cached spell to store on the actor.
	 * @returns {Promise<object|void>}
	 */
	async getCachedSpellData() {
		const originalSpell = await fromUuid(this.system.spell.uuid);
		if (!originalSpell) return;
		return originalSpell
			.clone({
				effects: [
					...originalSpell.effects.map(e => e.toObject()),
					{
						_id: this.constructor.ENCHANTMENT_ID,
						type: "enchantment",
						name: game.i18n.localize("BF.CAST.Enchantment.Name"),
						img: "systems/black-flag/artwork/activities/cast.svg",
						origin: this.uuid,
						changes: this.getSpellChanges()
					}
				],
				flags: {
					[game.system.id]: {
						cachedFor: this.relativeUUID
					}
				},
				_stats: { compendiumSource: this.system.spell.uuid }
			})
			.toObject();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create spell changes based on the activity's configuration.
	 * @returns {object[]}
	 */
	getSpellChanges() {
		const changes = [];
		const source = this.toObject();

		// Override spell details
		for (const type of ["activation", "duration", "range", "target"]) {
			if (!this[type].override) continue;
			const data = source[type];
			delete data.override;
			changes.push({
				key: `system.${type === "activation" ? "casting" : type}`,
				mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				value: JSON.stringify(data)
			});
		}

		// Set ability override
		if (this.system.spell.ability)
			changes.push({
				key: "flags.black-flag.relationship.origin.ability",
				mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				value: this.system.spell.ability
			});

		// Remove ignored properties
		for (const property of this.system.spell.properties) {
			changes.push({
				key: `system.${property in CONFIG.BlackFlag.spellComponents ? "components.required" : "tags"}`,
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: `-${property}`
			});
		}

		// Set challenge overrides
		const challenge = this.system.spell.challenge;
		if (challenge.override && challenge.attack)
			changes.push(
				{
					key: "activities[attack].system.attack.bonus",
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
					value: challenge.attack
				},
				{
					key: "activities[attack].system.attack.flat",
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
					value: true
				}
			);
		if (challenge.override && challenge.save)
			changes.push(
				{
					key: "activities[save].system.save.dc.ability",
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
					value: "custom"
				},
				{
					key: "activities[save].system.save.dc.formula",
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
					value: challenge.save
				}
			);

		return changes;
	}
}

import CastActivity from "../../../documents/activity/cast-activity.mjs";
import { numberFormat, replaceFormulaData, simplifyBonus } from "../../../utils/_module.mjs";
import { ActivityField } from "../../fields/activity-field.mjs";
import UsesField from "../../fields/uses-field.mjs";

/**
 * Data definition template for items with activities.
 *
 * @property {ActivityField} activities - Activities contained in this item.
 * @property {UsesField} uses - Uses and recovery details.
 */
export default class ActivitiesTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			activities: new ActivityField(),
			uses: new UsesField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should this item's actions be displayed on the actor sheet?
	 * @type {boolean}
	 */
	get displayActions() {
		return this.parent.enabled && (this.quantity !== 0);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate the "override" checkbox on spells.
	 * Added in 0.10.049
	 * @param {object} source - Candidate source data to migrate.
	 */
	static _migrateActivityActivationOverride(source) {
		if ( (source.type !== "spell") || foundry.utils.isEmpty(source.system?.activities)
			|| !source.system.casting?.type ) return;
		for ( const activity of Object.values(source.system.activities) ) {
			if ( !activity.activation || ("override" in activity.activation) ) continue;
			if ( activity.activation.type !== source.system.casting.type
				|| activity.activation.value !== source.system.casting.value
				|| activity.activation.condition !== source.system.casting.condition ) activity.activation.override = true;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare activities & uses formulas.
	 * Should be called during the `prepareFinalData` stage.
	 * @param {object} rollData
	 */
	prepareFinalActivities(rollData) {
		this.uses.prepareData(rollData);

		this.uses.max = simplifyBonus(replaceFormulaData(this.uses.max ?? "", rollData, {
			notifications: this.parent.notifications, key: "invalid-max-uses-formula", section: "auto",
			messageData: { name: this.parent.name, property: game.i18n.localize("BF.Uses.Maximum.DebugName") }
		}));
		// TODO: Add ability to have uses increase without clamping to max
		this.uses.value = Math.clamp(this.uses.max - this.uses.spent, 0, this.uses.max);

		Object.defineProperty(this.uses, "label", {
			get() {
				if ( this.max ) return `${numberFormat(this.value)} / ${numberFormat(this.max)}`;
				return "";
			},
			configurable: true,
			enumerable: false
		});

		for ( const activity of this.activities ) {
			activity.prepareFinalData();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any necessary actions when an item with activities is created.
	 * @param {object} data - The initial data object provided to the document creation request.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {string} userId - The id of the User requesting the document update.
	 */
	async onCreateActivities(data, options, userId) {
		if ( (userId !== game.user.id) || !this.parent.isEmbedded ) return;

		// If item has any Cast activities, create locally cached copies of the spells
		const spells = (await Promise.all(
			this.activities.byType("cast").map(a => !a.cachedSpell && a.getCachedSpellData())
		)).filter(_ => _);
		if ( spells.length ) this.parent.actor.createEmbeddedDocuments("Item", spells);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare any item or actor changes based on activity changes.
	 * @param {object} changed - The differential data that is changed relative to the document's prior values.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {User} user - The User requesting the document update.
	 */
	async preUpdateActivities(changed, options, user) {
		if ( !foundry.utils.hasProperty(changed, "system.activities") || !this.parent.isEmbedded ) return;

		// Track changes to cached spells on cast activities
		const removed = Object.entries(changed.system?.activities ?? {}).map(([key, data]) => {
			if ( key.startsWith("-=") ) {
				const id = key.replace("-=", "");
				return this.activities.get(id).cachedSpell?.id;
			} else if ( foundry.utils.hasProperty(data, "system.spell.uuid") ) {
				return this.activities.get(key)?.cachedSpell?.id;
			}
			return null;
		}).filter(_ => _);
		if ( removed.length ) foundry.utils.setProperty(options, "blackFlag.removedCachedItems", removed);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any additional updates when an item with activities is updated.
	 * @param {object} changed - The differential data that is changed relative to the document's prior values.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {string} userId - The id of the User requesting the document update.
	 */
	async onUpdateActivities(changed, options, userId) {
		if ( (userId !== game.user.id) || !this.parent.isEmbedded
			|| !foundry.utils.hasProperty(changed, "system.activities") ) return;

		// If any Cast activities were removed, or their spells changed, remove old cached spells
		if ( options.blackFlag?.removedCachedItems ) {
			await this.parent.actor.deleteEmbeddedDocuments("Item", options.blackFlag.removedCachedItems);
		}

		// Create any new cached spells & update existing ones as necessary
		const cachedInserts = [];
		for ( const id of Object.keys(changed.system.activities) ) {
			const activity = this.activities.get(id);
			if ( !(activity instanceof CastActivity) ) continue;
			const existingSpell = activity.cachedSpell;
			if ( existingSpell ) {
				const enchantment = existingSpell.effects.get(CastActivity.ENCHANTMENT_ID);
				await enchantment.update({ changes: activity.getSpellChanges() });
			} else cachedInserts.push(await activity.getCachedSpellData());
		}
		if ( cachedInserts.length ) await this.parent.actor.createEmbeddedDocuments("Item", cachedInserts);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any necessary cleanup when an item with activities is deleted.
	 * @param {object} options - Additional options which modify the deletion request.
	 * @param {string} userId - The id of the User requesting the document update.
	 */
	onDeleteActivities(options, userId) {
		if ( (userId !== game.user.id) || !this.parent.isEmbedded ) return;

		// If item has any Cast activities, clean up any cached spells
		const spellIds = this.activities.byType("cast").map(a => a.cachedSpell?.id).filter(_ => _);
		if ( spellIds.length ) this.parent.actor.deleteEmbeddedDocuments("Item", spellIds);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get any actions provided by activities on this item.
	 * @yields {object}
	 */
	*actions() {
		for ( const activity of this.activities ) {
			yield activity;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any item & activity uses recovery for a certain period.
	 * @param {string[]} periods - Recovery periods to check.
	 * @param {object} rollData - Roll data to use when evaluating recovery formulas.
	 * @returns {Promise<{ updates: object, rolls: BasicRoll[] }>}
	 */
	async recoverUses(periods, rollData) {
		const updates = {};
		const rolls = [];

		if ( this.uses.hasUses ) {
			const result = await this.uses.recoverUses(periods, rollData);
			if ( result ) {
				foundry.utils.mergeObject(updates, { "system.uses": result.updates });
				rolls.push(...result.rolls);
			}
		}

		for ( const activity of this.activities ) {
			if ( !activity.uses.hasUses ) continue;
			const result = await activity.uses.recoverUses(periods, rollData);
			if ( result ) {
				foundry.utils.mergeObject(updates, { [`system.activities.${activity.id}.uses`]: result.updates });
				rolls.push(...result.rolls);
			}
		}

		return { updates, rolls };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Adjust consumption types allowed in activities on this item.
	 * @param {{key: string, label: string, disabled: boolean}[]} types - All types available to activities.
	 * @returns {{key: string, label: string, disabled: boolean}[]}} - Adjusted types.
	 * @protected
	 */
	_validConsumptionTypes(types) {
		return types;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create one or more activity documents when this item is created.
	 * @param {object[]} data - Initial data for activity documents. Must include "type".
	 * @internal
	 */
	_createInitialActivities(data) {
		const activities = {};
		for ( const initialData of data ) {
			const ActivityClass = CONFIG.Activity.types[initialData.type].documentClass;
			if ( !initialData._id ) initialData._id = foundry.utils.randomID();
			activities[initialData._id] = new ActivityClass(initialData, { parent: this.parent }).toObject();
		}
		this.parent.updateSource({"system.activities": activities});
	}
}

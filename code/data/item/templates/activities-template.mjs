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

		this.uses.min = simplifyBonus(replaceFormulaData(this.uses.min ?? "", rollData, {
			notifications: this.parent.notifications, key: "invalid-min-uses-formula", section: "auto",
			messageData: { name: this.parent.name, property: game.i18n.localize("BF.Uses.Minimum.DebugName") }
		}));
		this.uses.max = simplifyBonus(replaceFormulaData(this.uses.max ?? "", rollData, {
			notifications: this.parent.notifications, key: "invalid-max-uses-formula", section: "auto",
			messageData: { name: this.parent.name, property: game.i18n.localize("BF.Uses.Maximum.DebugName") }
		}));
		this.uses.value = Math.clamp(this.uses.max - this.uses.spent, this.uses.min, this.uses.max);

		Object.defineProperty(this.uses, "label", {
			get() {
				if ( this.min ) return numberFormat(this.value);
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
	 * @returns {{updates: object, rolls: BasicRoll[]}}
	 */
	async recoverUses(periods, rollData) {
		const updates = {};
		const rolls = [];

		if ( this.uses.hasUses ) {
			const result = await this.uses.recoverUses(periods, rollData);
			if ( result ) {
				const update = { "system.uses": result.updates };
				foundry.utils.mergeObject(updates, update);
				rolls.push(...result.rolls);
			}
		}

		for ( const activity of this.activities ) {
			if ( !activity.uses.hasUses ) continue;
			const result = await activity.uses.recoverUses(periods, rollData);
			if ( result ) {
				updates.system ??= {};
				updates.system.activities ??= {};
				updates.system.activities[activity.id] = { uses: result.updates };
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

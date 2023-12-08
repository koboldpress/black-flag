import { numberFormat, replaceFormulaData, simplifyBonus } from "../../../utils/_module.mjs";
import { ActivityField } from "../../fields/activity-field.mjs";
import UsesField from "../../fields/uses-field.mjs";

/**
 * Data definition template for items with activities.
 */
export default class ActivitiesTemplate extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			activities: new ActivityField(),
			uses: new UsesField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareFinalUses() {
		const rollData = this.parent.getRollData();
		this.uses.min = simplifyBonus(replaceFormulaData(this.uses.min ?? "", rollData, {
			notifications: this.parent.notifications, key: "invalid-min-uses-formula", section: "auto",
			messageData: { name: this.parent.name, property: game.i18n.localize("BF.Uses.Minimum.DebugName") }
		}));
		this.uses.max = simplifyBonus(replaceFormulaData(this.uses.max ?? "", rollData, {
			notifications: this.parent.notifications, key: "invalid-max-uses-formula", section: "auto",
			messageData: { name: this.parent.name, property: game.i18n.localize("BF.Uses.Maximum.DebugName") }
		}));
		this.uses.value = Math.clamped(this.uses.max - this.uses.spent, this.uses.min, this.uses.max);

		Object.defineProperty(this.uses, "label", {
			get() {
				if ( this.min ) return numberFormat(this.value);
				if ( this.max ) return `${numberFormat(this.value)} / ${numberFormat(this.max)}`;
				return "";
			},
			configurable: true,
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareFinalActivities() {
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

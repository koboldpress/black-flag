import { numberFormat, replaceFormulaData, simplifyBonus } from "../../../utils/_module.mjs";
import { ActivityField } from "../../fields/activity-field.mjs";
import FormulaField from "../../fields/formula-field.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for items with activities.
 */
export default class ActivitiesTemplate extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			activities: new ActivityField(),
			uses: new SchemaField({
				spent: new NumberField({initial: 0, integer: true}),
				min: new FormulaField({deterministic: true}),
				max: new FormulaField({deterministic: true})
			}, {label: "BF.Uses.Label"})
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
			notifications: this.parent.notifications, key: "invalid-min-uses-formula", section: "auto",
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

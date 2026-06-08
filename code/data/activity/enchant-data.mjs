import ActivityDataModel from "../abstract/activity-data-model.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField, BooleanField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * @import { EnchantSystemData } from "./_types.mjs";
 */

/**
 * Configuration data for the enchant activity.
 * @extends {ActivityDataModel<EnchantSystemData>}
 * @mixes EnchantSystemData
 */
export class EnchantData extends ActivityDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.ENCHANT"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			autoSelf: new BooleanField(),
			effects: new ArrayField(new AppliedEffectField()),
			restrictions: new SchemaField({
				allowMagical: new BooleanField(),
				categories: new SetField(new StringField()),
				itemType: new StringField(),
				properties: new SetField(new StringField()),
				type: new SetField(new StringField())
				// TODO: Add freeform filtering
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Enchantments that have been applied by this activity.
	 * @type {BlackFlagActiveEffect[]}
	 */
	get appliedEnchantments() {
		return BlackFlag.registry.enchantments.applied(this.uuid);
	}
}

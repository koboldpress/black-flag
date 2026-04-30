import ActiveEffectDataModel from "../abstract/active-effect-data-model.mjs";

const { BooleanField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Standard active effects.
 */
export default class StandardEffectData extends ActiveEffectDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.EFFECT.STANDARD", "BF.EFFECT.RIDER"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "standard",
				localization: "BF.EFFECT.Type.Standard"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			...super.defineSchema(),
			magical: new BooleanField(),
			rider: new SchemaField({
				statuses: new SetField(new StringField())
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get applicableType() {
		return this.isRider || this.parent.riderOrigin?.disabled ? "" : "Actor";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this effect a rider for a non-applied enchantment?
	 * @type {boolean}
	 */
	get isRider() {
		return this.parent.parent?.flags[game.system.id]?.rider?.effects?.includes(this.parent.id);
	}
}

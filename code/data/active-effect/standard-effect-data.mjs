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
				type: "base",
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
		return this.isRider ? "" : "Actor";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this effect a rider for a non-applied enchantment?
	 * @type {boolean}
	 */
	get isRider() {
		return this.parent.parent?.flags[game.system.id]?.rider?.effects?.includes(this.parent.id);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();

		if (this.parent.id === this.parent.constructor.ID.EXHAUSTION) {
			let level = this.parent.getFlag("black-flag", "level");
			if (!Number.isFinite(level)) level = 1;
			this.parent.img = `systems/black-flag/artwork/statuses/exhaustion-${level}.svg`;
			this.parent.name = _loc("BF.Condition.Exhaustion.Numbered", { level: formatNumber(level) });
			if (level >= 6) this.parent.statuses.add("dead");
		}
	}
}

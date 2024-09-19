import BaseDataModel from "../abstract/base-data-model.mjs";

/**
 * Data definition for Enchantment active effects.
 */
export default class EchantmentData extends BaseDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.ENCHANTMENT"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "enchantment",
				localization: "BF.Effect.Type.Enchantment"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Has this enchantment been applied by another item, or was it directly created.
	 * @type {boolean}
	 */
	get isApplied() {
		return !!this.origin && this.origin !== this.parent.uuid;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		if (this.isApplied) {
			// TODO: Add to enchanted items registry
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		const result = await super._preCreate(data, options, user);
		if (result === false) return false;
		if (this.parent.parent instanceof Actor) {
			ui.notifications.error("BF.ENCHANTMENT.Warning.NotOnActor", { localize: true });
			return false;
		}
		// TODO: Validate enchantment restrictions
	}

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		if (this.isApplied) {
			// TODO: Remove from enchanted items registry
		}
	}
}

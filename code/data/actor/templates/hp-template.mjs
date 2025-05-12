const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for non-PC actors with hit points.
 *
 * @property {object} attributes
 * @property {object} attributes.hp
 * @property {number} attributes.hp.value - Current hit points.
 * @property {number} attributes.hp.max - Maximum hit points.
 * @property {number} attributes.hp.temp - Temporary hit points.
 * @property {number} attributes.hp.tempMax - Temporary max hit points.
 */
export default class HPTemplate extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			attributes: new SchemaField({
				hp: new SchemaField(
					{
						value: new NumberField({ required: true, min: 0, integer: true, label: "BF.HitPoint.Current.LabelLong" }),
						max: new NumberField({ required: true, min: 0, integer: true, label: "BF.HitPoint.Max.LabelLong" }),
						temp: new NumberField({ required: true, min: 0, integer: true, label: "BF.HitPoint.Temp.LabelLong" }),
						tempMax: new NumberField({ required: true, integer: true, label: "BF.HitPoint.TempMax.LabelLong" })
					},
					{ label: "BF.HitPoint.Label[other]" }
				)
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the hit points data during the `prepareDerivedData` stage.
	 */
	prepareDerivedHitPoints() {
		const hp = this.attributes.hp;
		hp.max ??= 0;
		if ((this.attributes.exhaustion ?? 0) >= 4) hp.max = Math.floor(hp.max * 0.5);
		hp.baseMax = hp.max;
		hp.max += hp.tempMax ?? 0;
		hp.value = Math.clamp(hp.value, 0, hp.max);
		hp.damage = hp.max - hp.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preUpdateHP(changed, options, user) {
		const changedMaxHP = foundry.utils.getProperty(changed, "system.attributes.hp.max");
		if (changedMaxHP !== undefined) {
			const maxHPDelta = changedMaxHP - this.attributes.hp.baseMax;
			foundry.utils.setProperty(changed, "system.attributes.hp.value", this.attributes.hp.value + maxHPDelta);
		}
	}
}

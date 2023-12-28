import BlackFlagActiveEffect from "../../../documents/active-effect.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for exhaustion.
 */
export default class ExhaustionTemplate extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			attributes: new SchemaField({
				exhaustion: new NumberField({
					initial: 0, min: 0, max: 6, integer: true, label: "BF.Condition.Exhaustion.Label"
				})
			}, {label: ""})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedExhaustionLevel() {
		
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preUpdateExhaustion(changed, options, user) {
		// Record previous exhaustion level.
		if ( Number.isFinite(foundry.utils.getProperty(changed, "system.attributes.exhaustion")) ) {
			foundry.utils.setProperty(options, "blackFlag.originalExhaustion", this.attributes.exhaustion);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_onUpdateExhaustion(data, options, userId) {
		if ( userId !== game.userId ) return;

		// TODO: Perform this as part of Actor._preUpdateOperation instead when it becomes available in v12
		const level = foundry.utils.getProperty(data, "system.attributes.exhaustion");
		if ( !Number.isFinite(level) ) return;
		let effect = this.parent.effects.get(BlackFlagActiveEffect.EXHAUSTION);
		if ( level < 1 ) return effect?.delete();
		else if ( effect ) {
			const originalExhaustion = foundry.utils.getProperty(options, "blackFlag.originalExhaustion");
			return effect.update({ "flags.black-flag.level": level }, { blackFlag: { originalExhaustion } });
		} else {
			effect = ActiveEffect.implementation.fromStatusEffect("exhaustion", { parent: this.parent });
			effect.updateSource({ "flags.black-flag.level": level });
			return ActiveEffect.implementation.create(effect, { parent: this.parent, keepId: true });
		}
	}
}

import FormulaField from "../fields/formula-field.mjs";

const { StringField } = foundry.data.fields;

/**
 * Data model for consumption targets.
 */
export default class ConsumptionTargetData extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			type: new StringField({label: "BF.Consumption.Type.Label"}),
			target: new StringField({label: "BF.Consumption.Target.Label"}),
			value: new FormulaField({initial: "1", label: "BF.Consumption.Amount.Label"}),
			scale: new FormulaField({label: "BF.Consumption.Scale.Label"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of valid targets within the current context.
	 * @type {{key: string, label: string}[]|null}
	 */
	get validTargets() {
		const type = CONFIG.BlackFlag.consumptionTypes[this.type];
		if ( !type?.validTargets ) return null;
		return type.validTargets(this.parent);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine which consumption types can be selected.
	 * @type {{key: string, label: string, disabled: boolean}[]}
	 */
	get validTypes() {
		const existingTypes = new Set(this.parent.consumption.targets.map(t => t.type));
		return Object.entries(CONFIG.BlackFlag.consumptionTypes).map(([key, config]) => ({
			key, label: config.label, disabled: existingTypes.has(key) && (this.type !== key)
		}));
	}
}

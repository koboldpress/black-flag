import FilterField from "./filter-field.mjs";
import FormulaField from "./formula-field.mjs";

/**
 * @typedef {object} Modifier
 * @property {string} type - Type of modifier (e.g. "bonus", "min", "note").
 * @property {FilterDescription[]} filter - Filter used to limit when this modifier is used.
 * @property {string} [formula] - If relevant, a formula.
 * @property {object} [note]
 * @property {number} [note.rollMode] - For "note" modifiers, which roll mode should be applied.
 * @property {string} [note.text] - For "note" modifiers, what note will be displayed during rolling.
 */

/**
 * Field that represents a set of actor modifiers.
 */
export default class ModifierField extends foundry.data.fields.ArrayField {
	constructor(options) {
		super(new foundry.data.fields.SchemaField({
			type: new foundry.data.fields.StringField(),
			filter: new FilterField(),
			formula: new FormulaField({required: false, initial: undefined}),
			note: new foundry.data.fields.SchemaField({
				rollMode: new foundry.data.fields.NumberField(),
				text: new foundry.data.fields.HTMLField()
			}, {required: false, initial: undefined})
		}), options);
	}
}

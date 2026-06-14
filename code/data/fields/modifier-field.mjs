import FilterField from "./filter-field.mjs";
import FormulaField from "./formula-field.mjs";

const { AnyField, ArrayField, HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * @typedef {object} Modifier
 * @property {string} type - Type of modifier (e.g. "bonus", "min", "critical-dice", "critical-threshold", "note").
 * @property {FilterDescription[]} filter - Filter used to limit when this modifier is used.
 * @property {string} [formula] - If relevant, a formula.
 * @property {object} [note]
 * @property {number} [note.rollMode] - For "note" modifiers, which roll mode should be applied.
 * @property {string} [note.text] - For "note" modifiers, what note will be displayed during rolling.
 */

/**
 * Field that represents a set of actor modifiers.
 */
export default class ModifierField extends ArrayField {
	constructor(options, context) {
		super(
			new SchemaField({
				filter: new FilterField(),
				formula: new FormulaField({ required: false, initial: undefined }),
				note: new SchemaField(
					{
						rollMode: new NumberField(),
						text: new HTMLField()
					},
					{ required: false, initial: undefined }
				),
				source: new AnyField({ persisted: false }),
				type: new StringField()
			}),
			options,
			context
		);
	}
}

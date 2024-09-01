const { ArrayField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Field for storing information about damage & condition resistances, immunities, and vulnerabilities.
 *
 * @property {Set<string>} value - Resistances regardless of source.
 * @property {Set<string>} nonmagical - Resistances to non-magical sources.
 * @property {string[]} custom - Special resistance information.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class ResistancesField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			value: new SetField(new StringField()),
			nonmagical: new SetField(new StringField()),
			custom: new ArrayField(new StringField()),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, options);
	}
}

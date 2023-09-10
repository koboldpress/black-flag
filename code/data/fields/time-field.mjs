/**
 * Field for storing client and server time.
 */
export default class TimeField extends foundry.data.fields.SchemaField {
	constructor(options) {
		super({
			client: new foundry.data.fields.NumberField(),
			world: new foundry.data.fields.NumberField()
		}, options);
	}
}

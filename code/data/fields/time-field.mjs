/**
 * Field for storing client and server time.
 */
export default class TimeField extends foundry.data.fields.SchemaField {
	constructor(options) {
		super({
			client: new foundry.data.fields.NumberField({initial: () => Date.now()}),
			world: new foundry.data.fields.NumberField({initial: () => game.time.worldTime})
		}, options);
	}
}

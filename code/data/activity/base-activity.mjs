import TypeField from "../fields/type-field.mjs";

/**
 * Data model for activities.
 */
export default class BaseActivity extends foundry.abstract.DataModel {

	/**
	 * Name of this activity type that will be stored in config and used for lookups.
	 * @type {string}
	 * @protected
	 */
	static get typeName() {
		return this.metadata?.name ?? this.name.replace(/Activity$/, "");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			_id: new foundry.data.fields.DocumentIdField({initial: () => foundry.utils.randomID()}),
			type: new foundry.data.fields.StringField({
				required: true, readOnly: true, initial: this.typeName, validate: v => v === this.typeName,
				validationError: `must be the same as the Activity type name ${this.typeName}`
			}),
			system: new TypeField({
				modelLookup: type => this.metadata.dataModel ?? null
			}),
			title: new foundry.data.fields.StringField({initial: undefined}),
			icon: new foundry.data.fields.FilePathField({initial: undefined, categories: ["IMAGE"]})
		};
	}
}

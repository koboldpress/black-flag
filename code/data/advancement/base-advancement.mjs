import IdentifierField from "../fields/identifier-field.mjs";
import TypeField from "../fields/type-field.mjs";

/**
 * Base data model for advancement.
 */
export default class BaseAdvancement extends foundry.abstract.DataModel {

	/**
	 * Name of this advancement type that will be stored in config and used for lookups.
	 * @type {string}
	 * @protected
	 */
	static get typeName() {
		return this.metadata?.name ?? this.name.replace(/Advancement$/, "");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			_id: new foundry.data.fields.DocumentIdField({initial: () => foundry.utils.randomID()}),
			type: new foundry.data.fields.StringField({
				required: true, readOnly: true, initial: this.typeName, validate: v => v === this.typeName,
				validationError: `must be the same as the Advancement type name ${this.typeName}`
			}),
			identifier: new IdentifierField({label: "BF.Identifier.Label"}),
			configuration: new TypeField({
				modelLookup: type => this.metadata.dataModels?.configuration ?? null
			}, {required: true}),
			level: new foundry.data.fields.NumberField({
				integer: true, initial: this.metadata?.multiLevel ? undefined : null, min: 0
			}),
			title: new foundry.data.fields.StringField({initial: undefined}),
			icon: new foundry.data.fields.FilePathField({initial: undefined, categories: ["IMAGE"]}),
			flags: new foundry.data.fields.ObjectField()
		};
	}
}

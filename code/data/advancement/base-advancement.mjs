import IdentifierField from "../fields/identifier-field.mjs";
import TypeField from "../fields/type-field.mjs";

const { DocumentIdField, FilePathField, NumberField, ObjectField, StringField } = foundry.data.fields;

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
			_id: new DocumentIdField({initial: () => foundry.utils.randomID()}),
			type: new StringField({
				required: true, readOnly: true, initial: this.typeName, validate: v => v === this.typeName,
				validationError: `must be the same as the Advancement type name ${this.typeName}`
			}),
			identifier: new IdentifierField({label: "BF.Identifier.Label"}),
			configuration: new TypeField({
				modelLookup: type => this.metadata.dataModels?.configuration ?? null
			}, {required: true}),
			level: new NumberField({
				integer: true, initial: this.metadata?.multiLevel ? undefined : null, min: 0
			}),
			title: new StringField({initial: undefined}),
			icon: new FilePathField({initial: undefined, categories: ["IMAGE"]}),
			flags: new ObjectField()
		};
	}
}

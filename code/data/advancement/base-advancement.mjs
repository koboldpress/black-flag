import IdentifierField from "../fields/identifier-field.mjs";
import TypeField from "../fields/type-field.mjs";

const { DocumentIdField, FilePathField, NumberField, ObjectField, SchemaField, StringField } = foundry.data.fields;

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
			level: new SchemaField({
				value: new NumberField({
					integer: true, initial: this.metadata?.multiLevel ? undefined : null, min: 0
				}),
				classIdentifier: new IdentifierField()
			}),
			title: new StringField({label: "BF.Advancement.Core.Title.Label"}),
			icon: new FilePathField({categories: ["IMAGE"], label: "BF.Advancement.Core.Icon.Label"}),
			flags: new ObjectField()
		};
	}
}

import IdentifierField from "../fields/identifier-field.mjs";
import TypeField from "../fields/type-field.mjs";

const { DocumentIdField, FilePathField, NumberField, ObjectField, SchemaField, StringField } = foundry.data.fields;

/**
 * Base data model for advancement.
 */
export default class BaseAdvancement extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Base type information for an advancement.
	 *
	 * @typedef {PseudoDocumentsMetadata} BaseAdvancementMetadata
	 * @property {string} type - Type of the advancement.
	 */

	/**
	 * @type {BaseAdvancementMetadata}
	 */
	static metadata = Object.freeze({
		name: "Advancement",
		collection: "advancement",
		label: "BF.Advancement.Label",
		type: "base"
	});

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Name of this advancement type that will be stored in config and used for lookups.
	 * @type {string}
	 * @protected
	 */
	static get typeName() {
		return this.metadata.type ?? this.name.replace(/Advancement$/, "");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			_id: new DocumentIdField({ initial: () => foundry.utils.randomID() }),
			configuration: new TypeField(
				{
					modelLookup: type => this.metadata.dataModels?.configuration ?? null
				},
				{ required: true }
			),
			flags: new ObjectField(),
			hint: new StringField(),
			icon: new FilePathField({ categories: ["IMAGE"], base64: false }),
			identifier: new IdentifierField(),
			level: new SchemaField({
				value: new NumberField({ integer: true, initial: this.metadata?.multiLevel ? undefined : null, min: 0 }),
				classIdentifier: new IdentifierField(),
				classRestriction: new StringField({ choices: ["original", "multiclass"] })
			}),
			title: new StringField(),
			type: new StringField({
				required: true,
				readOnly: true,
				initial: this.typeName,
				validate: v => v === this.typeName,
				validationError: `must be the same as the Advancement type name ${this.typeName}`
			})
		};
	}
}

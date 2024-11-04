export default class BaseDataModel extends foundry.abstract.TypeDataModel {
	/**
	 * Metadata that describes a system data type.
	 *
	 * @typedef {object} BaseDataMetadata
	 * @property {string} type - Name of type to which this system data model belongs.
	 * @property {string} [module] - For module-defined types, which module provides this type.
	 * @property {string} [category] - Which category in the create item dialog should this Document be listed?
	 * @property {string} localization - Base localization key for this type. This should be a localization key that
	 *                                   accepts plural types (e.g. `BF.Item.Type.Weapon` becomes
	 *                                   `BF.Item.Type.Weapon[few]` and `BF.Item.Type.Weapon[other]`).
	 * @property {string} [icon] - Font awesome icon string used for links to this type.
	 * @property {string} [img] - Default image used when creating a Document of this type.
	 */

	/**
	 * Metadata that describes a type.
	 * @type {BaseDataMetadata}
	 */
	static metadata = {};

	/**
	 * Metadata that describes a type.
	 * @type {BaseDataMetadata}
	 */
	get metadata() {
		return this.constructor.metadata;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Full type with module prefix if it is a module-defined type.
	 * @type {string}
	 */
	static get fullType() {
		return this.metadata.module ? `${this.metadata.module}.${this.metadata.type}` : this.metadata.type;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static _enableV10Validation = true;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Base templates used for construction.
	 * @type {*[]}
	 * @private
	 */
	static _schemaTemplates = [];

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A list of properties that should not be mixed-in to the final type.
	 * @type {Set<string>}
	 * @private
	 */
	static _immiscible = new Set(["length", "mixed", "name", "prototype", "migrateData", "defineSchema"]);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static defineSchema() {
		const schema = {};
		for (const template of this._schemaTemplates) {
			this.mergeSchema(schema, this[`${template.name}_defineSchema`]?.() ?? {});
		}
		return schema;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Merge two schema definitions together as well as possible.
	 * @param {DataSchema} a - First schema that forms the basis for the merge. *Will be mutated.*
	 * @param {DataSchema} b - Second schema that will be merged in, overwriting any non-mergeable properties.
	 * @returns {DataSchema} - Fully merged schema.
	 */
	static mergeSchema(a, b) {
		for (const key of Object.keys(b)) {
			if (!(key in a) || a[key].constructor !== b[key].constructor) {
				if (b[key] === false) delete a[key];
				else a[key] = b[key];
				continue;
			}
			const mergedOptions = { ...a[key].options, ...b[key].options };
			if (b[key] instanceof foundry.data.fields.SchemaField) {
				const fields = this.mergeSchema(a[key].fields, b[key].fields);
				Object.values(fields).forEach(f => (f.parent = undefined));
				a[key] = new b[key].constructor(fields, mergedOptions);
				continue;
			}
			switch (b[key].constructor) {
				case foundry.data.fields.ArrayField:
				case foundry.data.fields.SetField:
					const elementOptions = foundry.utils.mergeObject(a[key].element.options, b[key].element.options);
					const ElementType = (b[key].element || a[key].element).constructor;
					a[key] = new b[key].constructor(new ElementType(elementOptions), mergedOptions);
					break;
				case BlackFlag.data.fields.MappingField:
					mergedOptions.extraFields = this.mergeSchema(
						a[key].options.extraFields ?? {},
						b[key].options.extraFields ?? {}
					);
					const modelOptions = foundry.utils.mergeObject(a[key].model.options, b[key].model.options);
					const ModelType = (b[key].model || a[key].model).constructor;
					a[key] = new b[key].constructor(new ModelType(modelOptions), mergedOptions);
					break;
				default:
					a[key] = new b[key].constructor(mergedOptions);
			}
		}
		return a;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mix multiple templates with the base type.
	 * @param {...*} templates - Template classes to mix.
	 * @returns {typeof SystemDataModel} - Final prepared type.
	 */
	static mixin(...templates) {
		const Base = class extends this {};
		Object.defineProperty(Base, "_schemaTemplates", {
			value: Object.seal([...this._schemaTemplates, ...templates]),
			writable: false,
			configurable: false
		});

		for (const template of templates) {
			let defineSchema;

			// Take all static methods and fields from template and mix in to base class
			for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(template))) {
				if (key === "defineSchema") defineSchema = descriptor;
				if (this._immiscible.has(key)) continue;
				Object.defineProperty(Base, key, { ...descriptor, enumerable: true });
			}

			// Take all instance methods and fields from template and mix in to base class
			for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(template.prototype))) {
				if (["constructor"].includes(key)) continue;
				Object.defineProperty(Base.prototype, key, { ...descriptor, enumerable: true });
			}

			// Copy over defineSchema with a custom name
			if (defineSchema) {
				Object.defineProperty(Base, `${template.name}_defineSchema`, defineSchema);
			}
		}

		return Base;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether this class mixes in a specific template.
	 * @param {*} template
	 * @returns {boolean}
	 */
	static mixes(template) {
		if (foundry.utils.getType(template) === "string") {
			return this._schemaTemplates.find(t => t.name === template) !== undefined;
		} else {
			return this._schemaTemplates.includes(template);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Key path to the description used for default embeds.
	 * @type {string|null}
	 */
	get embeddedDescriptionKeyPath() {
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Helper method to get all enumerable methods, inherited or own, for this class.
	 * @param {object} options
	 * @param {string} [options.startingWith] - Optional filtering string.
	 * @param {string} [options.notEndingWith] - Exclude any method that ends with this suffix.
	 * @param {boolean} [options.prototype=true] - Whether the prototype should be checked or the class.
	 * @returns {string[]} - Array of method keys.
	 */
	static _getMethods({ startingWith, notEndingWith, prototype = true }) {
		let keys = [];
		for (const key in prototype ? this.prototype : this) {
			keys.push(key);
		}
		for (let cls of [this, ...foundry.utils.getParentClasses(this)].reverse()) {
			if (["Base", "BaseDataModel", "DataModel"].includes(cls.name)) continue;
			if (prototype) cls = cls.prototype;
			keys.push(...Object.getOwnPropertyNames(cls));
		}
		if (startingWith) keys = keys.filter(key => key.startsWith(startingWith) && key !== startingWith);
		if (notEndingWith) keys = keys.filter(key => !key.endsWith(notEndingWith));
		return keys;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		this._getMethods({ startingWith: "migrate", notEndingWith: "Data", prototype: false }).forEach(k =>
			this[k](source)
		);
		return super.migrateData(source);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data related to this DataModel itself, before any embedded Documents or derived data is computed.
	 */
	prepareBaseData() {
		this.constructor._getMethods({ startingWith: "prepareBase", notEndingWith: "Data" }).forEach(k => this[k]());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data that needs to be prepared after embedded documents have been prepared,
	 * but before active effects are applied.
	 */
	prepareEmbeddedData() {
		this.constructor._getMethods({ startingWith: "prepareEmbedded", notEndingWith: "Data" }).forEach(k => this[k]());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply transformations or derivations to the values of the source data object.
	 */
	prepareDerivedData() {
		this.constructor._getMethods({ startingWith: "prepareDerived", notEndingWith: "Data" }).forEach(k => this[k]());
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Embeds & Tooltips          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Render a rich tooltip for this document.
	 * @param {EnrichmentOptions} [enrichmentOptions={}] - Options for text enrichment.
	 * @returns {{ content: string, classes: string[] }|null}
	 */
	async richTooltip(enrichmentOptions = {}) {
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(config, options = {}) {
		const keyPath = this.embeddedDescriptionKeyPath;
		if (!keyPath || !foundry.utils.hasProperty(this, keyPath)) return null;
		const enriched = await TextEditor.enrichHTML(foundry.utils.getProperty(this, keyPath), {
			...options,
			relativeTo: this.parent
		});
		const container = document.createElement("div");
		container.innerHTML = enriched;
		return container.children;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-creation logic for this system data.
	 * @param {object} data - The initial data object provided to the document creation request.
	 * @param {object} options - Additional options which modify the creation request.
	 * @param {User} user - The User requesting the document creation.
	 * @returns {boolean} - Return false to prevent document creation.
	 * @protected
	 */
	async _preCreate(data, options, user) {
		for (const name of this.constructor._getMethods({ startingWith: "_preCreate" })) {
			if ((await this[name](data, options, user)) === false) return false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-update logic for this system data.
	 * @param {object} changed - The differential data that is changed relative to the documents prior values.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {User} user - The User requesting the document update.
	 * @returns {boolean} - Return false to prevent document update.
	 * @protected
	 */
	async _preUpdate(changed, options, user) {
		for (const name of this.constructor._getMethods({ startingWith: "_preUpdate" })) {
			if ((await this[name](changed, options, user)) === false) return false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-deletion logic for this system data.
	 * @param {object} options - Additional options which modify the deletion request.
	 * @param {User} user - The User requesting the document deletion.
	 * @returns {boolean} - Return false to prevent document deletion.
	 * @protected
	 */
	async _preDelete(options, user) {
		for (const name of this.constructor._getMethods({ startingWith: "_preDelete" })) {
			if ((await this[name](options, user)) === false) return false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Post-creation logic for this system data.
	 * @param {object} data - The initial data object provided to the document creation request.
	 * @param {object} options - Additional options which modify the creation request.
	 * @param {string} userId - The id of the User requesting the document update.
	 * @protected
	 */
	_onCreate(data, options, userId) {
		this.constructor._getMethods({ startingWith: "_onCreate" }).forEach(k => this[k](data, options, userId));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Post-update logic for this system data.
	 * @param {object} changed - The differential data that was changed relative to the documents prior values.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {string} userId - The id of the User requesting the document update.
	 * @protected
	 */
	_onUpdate(changed, options, userId) {
		this.constructor._getMethods({ startingWith: "_onUpdate" }).forEach(k => this[k](changed, options, userId));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Post-deletion logic for this system data.
	 * @param {object} options - Additional options which modify the deletion request
	 * @param {string} userId - The id of the User requesting the document update
	 * @protected
	 */
	_onDelete(options, userId) {
		this.constructor._getMethods({ startingWith: "_onDelete" }).forEach(k => this[k](options, userId));
	}
}

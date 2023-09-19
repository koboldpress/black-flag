export default class BaseDataModel extends foundry.abstract.DataModel {

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
	 * @property {string} [image] - Default image used when creating a Document of this type.
	 */

	/**
	 * Metadata that describes a type.
	 * @type {BaseDataMetadata}
	 */
	static metadata = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	static _enableV10Validation = true;

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
	static _getMethods({ startingWith, notEndingWith, prototype=true }) {
		let keys = [];
		for ( const key in (prototype ? this.prototype : this) ) { keys.push(key); }
		for ( let cls of [this, ...foundry.utils.getParentClasses(this)].reverse() ) {
			if ( ["Base", "BaseDataModel", "DataModel"].includes(cls.name) ) continue;
			if ( prototype ) cls = cls.prototype;
			keys.push(...Object.getOwnPropertyNames(cls));
		}
		if ( startingWith ) keys = keys.filter(key => key.startsWith(startingWith));
		if ( notEndingWith ) keys = keys.filter(key => !key.endsWith(notEndingWith));
		return keys;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Migrations              */
	/* <><><><> <><><><> <><><><> <><><><> */

	static migrateData(source) {
		this._getMethods({ startingWith: "migrate", notEndingWith: "Data", prototype: false }).forEach(k => this[k](source));
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
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-creation logic for this system data.
	 * @param {object} data - The initial data object provided to the document creation request.
	 * @param {object} options - Additional options which modify the creation request.
	 * @param {User} user - The User requesting the document creation.
	 * @protected
	 */
	async _preCreate(data, options, user) {
		for ( const name of this.constructor._getMethods({ startingWith: "_preCreate" }) ) {
			await this[name](data, options, user);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-update logic for this system data.
	 * @param {object} changed - The differential data that is changed relative to the documents prior values.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {User} user - The User requesting the document update.
	 * @protected
	 */
	async _preUpdate(changed, options, user) {
		for ( const name of this.constructor._getMethods({ startingWith: "_preUpdate" }) ) {
			await this[name](changed, options, user);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-deletion logic for this system data.
	 * @param {object} options - Additional options which modify the deletion request.
	 * @param {User} user - The User requesting the document deletion.
	 * @protected
	 */
	async _preDelete(options, user) {
		for ( const name of this.constructor._getMethods({ startingWith: "_preDelete" }) ) {
			await this[name](options, user);
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

import AdvancementConfig from "../../applications/advancement/advancement-config.mjs";
import AdvancementFlow from "../../applications/advancement/advancement-flow.mjs";
import BaseAdvancement from "../../data/advancement/base-advancement.mjs";

/**
 * Error that can be thrown during the advancement update preparation process.
 */
class AdvancementError extends Error {
	constructor(...args) {
		super(...args);
		this.name = "AdvancementError";
	}
}

/**
 * Abstract base class which various advancement types can subclass.
 * @param {object} [data={}] - Raw data stored in the advancement object.
 * @param {object} [options={}] - Options which affect DataModel construction.
 * @abstract
 */
export default class Advancement extends BaseAdvancement {
	constructor(data, {parent=null, ...options}={}) {
		if ( parent instanceof Item ) parent = parent.system;
		super(data, {parent, ...options});

		/**
		 * A collection of Application instances which should be re-rendered whenever this document is updated.
		 * The keys of this object are the application ids and the values are Application instances. Each
		 * Application in this object will have its render method called by {@link Document#render}.
		 * @type {[key: string]: Application}
		 */
		Object.defineProperty(this, "apps", {
			value: {},
			writable: false,
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_initialize(options) {
		super._initialize(options);
		return this.prepareData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static ERROR = AdvancementError;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Information on how an advancement type is configured.
	 *
	 * @typedef {object} AdvancementMetadata
	 * @property {string} name - Type name of the advancement.
	 * @property {object} [dataModels]
	 * @property {DataModel} [dataModels.configuration] - Data model used for validating configuration data.
	 * @property {DataModel} [dataModels.value] - Data model used for validating value data.
	 * @property {number} order - Number used to determine default sorting order of advancement items.
	 * @property {string} icon - Icon used for this advancement type if no user icon is specified.
	 * @property {string} title - Title to be displayed if no user title is specified.
	 * @property {string} hint - Description of this type shown in the advancement selection dialog.
	 * @property {object} identifier
	 * @property {string} identifier.configurable - Should this identifier be customizable for this advancement type?
	 * @property {string} identifier.hint - Hint that is shown with the identifier.
	 * @property {boolean} multiLevel - Can this advancement affect more than one level? If this is set to true,
	 *                                  the level selection control in the configuration window is hidden and the
	 *                                  advancement should provide its own implementation of `Advancement#levels`
	 *                                  and potentially its own level configuration interface.
	 * @property {object} apps
	 * @property {*} apps.config - Subclass of AdvancementConfig that allows for editing of this advancement type.
	 * @property {*} apps.flow - Subclass of AdvancementFlow that is displayed while fulfilling this advancement.
	 */

	/**
	 * Configuration information for this advancement type.
	 * @type {AdvancementMetadata}
	 */
	static get metadata() {
		return {
			order: 100,
			icon: "icons/svg/upgrade.svg",
			title: game.i18n.localize("BF.Advancement.Core.Title"),
			hint: "",
			identifier: {
				configurable: false,
				hint: ""
			},
			multiLevel: false,
			apps: {
				config: AdvancementConfig,
				flow: AdvancementFlow
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Unique identifier for this advancement within its item.
	 * @type {string}
	 */
	get id() {
		return this._id;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Unique ID for this advancement on an actor.
	 * @type {string}
	 */
	get relativeID() {
		return `${this.item.id}.${this.id}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Globally unique identifier for this advancement.
	 * @type {string}
	 */
	get uuid() {
		return `${this.item.uuid}.Advancement.${this.id}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item to which this advancement belongs.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.parent.parent;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor to which this advancement's item belongs, if the item is embedded.
	 * @type {BlackFlagActor|null}
	 */
	get actor() {
		return this.item.parent ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of levels in which this advancement object should be displayed. Will be a list of class levels if this
	 * advancement is being applied to classes or subclasses, otherwise a list of character levels.
	 * @returns {number[]}
	 */
	get levels() {
		return this.level !== undefined ? [this.level] : [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can this advancement be set to "any level".
	 * @type {boolean}
	 */
	get supportsAnyLevel() {
		return !["class", "subclass"].includes(this.item.type);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Value data for this advancement stored on an actor.
	 * @type {DataModel|object}
	 */
	get value() {
		const value = foundry.utils.getProperty(this.actor, this.valueKeyPath) ?? {};
		const DataModel = this.constructor.metadata.dataModels?.value;
		if ( !DataModel || value instanceof DataModel ) return value;
		return new DataModel(value, { parent: this });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Key path under which the value data is stored on the actor.
	 * @type {string}
	 */
	get valueKeyPath() {
		return `system.progression.advancement.${this.relativeID}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data for the Advancement.
	 */
	prepareData() {
		this.title = this.title || this.constructor.metadata.title;
		this.icon = this.icon || this.constructor.metadata.icon;
		this.identifier = this.identifier || this.title.slugify({strict: true});
		if ( !this.constructor.metadata.multiLevel ) this.level ??= this.supportsAnyLevel ? 0 : 1;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare any warnings that should be displayed on the actor.
	 * @param {AdvancementLevels} levels - Levels for which the warning should be generated.
	 * @param {NotificationCollection} notifications - Collection into which notifications should be set.
	 * @abstract
	 */
	prepareWarnings(levels, notifications) {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Has the player made choices for this advancement at the specified level?
	 * @param {AdvancementLevels} levels - Level for which to check configuration.
	 * @returns {boolean} - Have any available choices been made?
	 */
	configuredForLevel(levels) {
		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Value used for sorting this advancement at a certain level.
	 * @param {AdvancementLevels} levels - Level for which this entry is being sorted.
	 * @returns {string} - String that can be used for sorting.
	 */
	sortingValueForLevel(levels) {
		return `${this.constructor.metadata.order.paddedString(4)} ${this.titleForLevel(levels)}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Title displayed in advancement list for a specific level.
	 * @param {AdvancementLevels} levels - Level for which to generate a title.
	 * @param {object} [options={}]
	 * @param {object} [options.flow=false] - Is this title being used in an advancement flow?
	 * @returns {string} - HTML title with any level-specific information.
	 */
	titleForLevel(levels, { flow=false }={}) {
		return this.title;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Summary content displayed beneath the title in the advancement list.
	 * @param {AdvancementLevels} levels - Level for which to generate the summary.
	 * @param {object} [options={}]
	 * @param {object} [options.flow=false] - Is this summary being used in an advancement flow?
	 * @returns {string} - HTML content of the summary.
	 */
	summaryForLevel(levels, { flow=false }={}) {
		return "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Render all of the Application instances which are connected to this advancement.
	 * @param {boolean} [force=false] - Force rendering
	 * @param {object} [context={}] - Optional context
	 */
	render(force=false, context={}) {
		for ( const app of Object.values(this.apps) ) app.render(force, context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove unnecessary keys from the context before passing it through to the update update.
	 * @param {DocumentModificationContext} context
	 * @returns {DocumentModificationContext}
	 * @internal
	 */
	static _clearedDocumentModificationContext(context) {
		context = foundry.utils.deepClone(context);
		delete context.parent;
		delete context.pack;
		delete context.keepId;
		delete context.keepEmbeddedIds;
		delete context.renderSheet;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create multiple Documents using provided input data.
	 * Data is provided as an array of objects where each individual object becomes one new Document.
	 * See Foundry's Document#createDocuments documentation for more information.
	 *
	 * @param {object[]} data - An array of data objects used to create multiple documents.
	 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the creation workflow.
	 * @returns {Promise<Advancement[]>} - An array of created Document instances.
	 */
	static async createDocuments(data=[], context={}) {
		if ( !context.parent ) throw new Error("Cannot create advancements without a parent.");
		const updates = data.reduce((updates, data) => {
			if ( !context.keepId || !data._id ) data._id = foundry.utils.randomID();
			updates[data._id] = data;
			const c = CONFIG.Advancement.types[data.type];
			if ( !c?.validItemTypes.has(context.parent.type) || !c?.documentClass.availableForItem(context.parent) ) {
				throw new Error(`${data.type} advancement cannot be added to ${context.parent.name}`);
			}
			return updates;
		}, {});
		await context.parent.update({"system.advancement": updates}, this._clearedDocumentModificationContext(context));
		const documents = Object.keys(updates).map(id => context.parent.getEmbeddedDocument("Advancement", id));
		if ( context.renderSheet ) documents.forEach(d => (new d.constructor.metadata.apps.config(d)).render(true));
		return documents;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update multiple Document instances using provided differential data.
	 * Data is provided as an array of objects where each individual object updates one existing Document.
	 * See Foundry's Document#updateDocuments documentation for more information.
	 *
	 * @param {object[]} updates - An array of differential data objects, each used to update a single Document.
	 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the update workflow.
	 * @returns {Promise<Document[]>} - An array of updated Document instances.
	 */
	static async updateDocuments(updates=[], context={}) {
		if ( !context.parent ) throw new Error("Cannot update advancements without a parent.");
		updates = updates.reduce((updates, data) => {
			if ( !data._id ) throw new Error("ID must be provided when updating an advancement");
			updates[data._id] = data;
			return updates;
		}, {});
		await context.parent.update({"system.advancement": updates}, this._clearedDocumentModificationContext(context));
		return Object.keys(updates).map(id => context.parent.getEmbeddedDocument("Advancement", id));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Delete one or multiple existing Documents using an array of provided ids.
	 * Data is provided as an array of string ids for the documents to delete.
	 * See Foundry's Document#deleteDocuments documentation for more information.
	 *
	 * @param {string[]} ids - An array of string ids for the documents to be deleted.
	 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the deletion workflow.
	 * @returns {Promise<Document[]>} - An array of deleted Document instances.
	 */
	static async deleteDocuments(ids, context={}) {
		if ( !context.parent ) throw new Error("Cannot delete advancements without a parent.");
		const { updates, documents } = ids.reduce(({ updates, documents }, id) => {
			documents.push(context.parent.getEmbeddedDocument("Advancement", id));
			updates[`system.advancement.-=${id}`] = null;
			return { updates, documents };
		}, { updates: {}, documents: [] });
		await context.parent.update(updates, this._clearedDocumentModificationContext(context));
		return documents;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update this advancement.
	 * @param {object} [data={}] - Updates to apply to this advancement.
	 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the update workflow.
	 * @returns {Promise<Advancement>} - This advancement after updates have been applied.
	 */
	async update(data={}, context={}) {
		await this.item.updateEmbeddedDocuments("Advancement", [{ ...data, _id: this.id }], context);
		if ( context.render !== false ) this.render();
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update this advancement's data on the item without performing a database commit.
	 * @param {object} updates - Updates to apply to this advancement.
	 * @returns {Advancement} - This advancement after updates have been applied.
	 */
	updateSource(updates) {
		super.updateSource(updates);
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update this advancement's value data stored on the actor.
	 * @param {object} [updates={}] - A differential data object.
	 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the update workflow.
	 * @returns {Promise<Advancement>} - Updated advancement instance.
	 */
	async updateValue(updates={}, context={}) {
		if ( !this.parent.isEmbedded ) throw new Error("Cannot update values for an advancement not stored on an actor.");
		await this.parent.actor.update({[`system.progression.advancement.${this.valueID}`]: updates}, context);
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can an advancement of this type be added to the provided item?
	 * @param {BlackFlagItem} item - Item to check against.
	 * @returns {boolean} - Should this be enabled as an option on the {@link AdvancementSelection} dialog?
	 */
	static availableForItem(item) {
		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Serialize salient information for this Advancement when dragging it.
	 * @returns {object} - An object of drag data.
	 */
	toDragData() {
		const dragData = { type: "Advancement" };
		if ( this.id ) dragData.uuid = this.uuid;
		else dragData.data = this.toObject();
		return dragData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef {object} AdvancementLevels
	 *
	 * @property {number} character - Character levels for advancement being applied.
	 * @property {number} class - Levels in whatever class was advanced at current level.
	 */

	/**
	 * Dynamic changes this advancement applies to the actor during data preparation. Changes will be made
	 * after base data is prepared any before active effects are applied using a mechanism similar to active
	 * effects. By default changes will be made in advancement order, but if priority is provided it can be
	 * used to adjust the order.
	 * @param {AdvancementLevels} levels - Levels being applied.
	 * @returns {EffectChangeData[]}
	 * @abstract
	 */
	changes(levels) { }

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Locally apply this advancement to the actor.
	 * @param {AdvancementLevels} levels - Levels being advanced.
	 * @param {object} [data] - Data from the advancement form.
	 * @param {object} options
	 * @param {boolean} [options.initial=false] - Is this the initial application?
	 * @abstract
	 */
	async apply(levels, data, { initial=false }={}) { }

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Locally remove this advancement's changes from the actor.
	 * @param {AdvancementLevels} levels - Levels being removed.
	 * @abstract
	 */
	async reverse(levels) { }

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Select the relevant level from the provided levels data.
	 * @param {AdvancementLevels} levels
	 * @returns {string}
	 */
	relavantLevel(levels) {
		return ["class", "subclass"].includes(this.item.type) ? levels.class : levels.character;
	}
}

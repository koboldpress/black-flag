/**
 * A mixin which extends a DataModel to provide a CRUD-layer similar to normal Documents.
 * @param {typeof DataModel} Base - The base DataModel to be mixed.
 * @returns {typeof PseudoDocument}
 * @mixin
 */
export default function PseudoDocumentMixin(Base) {
	/**
	 * PseudoDocument class for new document types that can be embedded in items.
	 * @param {object} [data={}] - Raw data stored in the pseudo document object.
	 * @param {object} [options={}] - Options which affect DataModel construction.
	 * @abstract
	 */
	return class PseudoDocument extends Base {
		constructor(data, {parent=null, ...options}={}) {
			if ( parent instanceof Item ) parent = parent.system;
			super(data, {parent, ...options});

			/**
			 * A collection of Application instances which should be re-rendered whenever this PseudoDocument is updated.
			 * The keys of this object are the application ids and the values are Application instances. Each
			 * Application in this object will have its render method called by {@link PseudoDocument#render}.
			 * @type {[key: string]: Application}
			 */
			Object.defineProperty(this, "apps", {
				value: {},
				writable: false,
				enumerable: false
			});

			/**
			 * A cached reference to the FormApplication instance used to configure this PseudoDocument.
			 */
			Object.defineProperty(this, "_sheet", { value: null, writable: true, enumerable: false });
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		_initialize(options) {
			super._initialize(options);
			if ( !game._documentsReady ) return;
			return this.prepareData();
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Model Configuration         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Configuration information for PseudoDocuments.
		 *
		 * @typedef {object} PseudoDocumentsMetadata
		 * @property {string} name - Base type name of this PseudoDocument (e.g. "Activity", "Advancement").
		 * @property {string} collection - Location of the collection of pseudo documents within system data.
		 */

		/**
		 * Configuration information for PseudoDocuments.
		 * @type {PseudoDocumentsMetadata}
		 */
		get metadata() {
			return this.constructor.metadata;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * The named collection to which this PseudoDocument belongs.
		 * @type {string}
		 */
		static get collectionName() {
			return this.metadata.collection;
		}

		/**
		 * The named collection to which this PseudoDocument belongs.
		 * @type {string}
		 */
		get collectionName() {
			return this.constructor.collectionName;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * The canonical name of this PseudoDocument type, for example "Actor".
		 * @type {string}
		 */
		static get documentName() {
			return this.metadata.name;
		}

		/**
		 * The canonical name of this PseudoDocument type, for example "Actor".
		 * @type {string}
		 */
		get documentName() {
			return this.constructor.documentName;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Instance Properties         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Unique identifier for this PseudoDocument within its item.
		 * @type {string}
		 */
		get id() {
			return this._id;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Unique ID for this PseudoDocument on an actor.
		 * @type {string}
		 */
		get relativeID() {
			return `${this.item.id}.${this.id}`;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Globally unique identifier for this PseudoDocument.
		 * @type {string}
		 */
		get uuid() {
			return `${this.item.uuid}.${this.documentName}.${this.id}`;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Item to which this PseudoDocument belongs.
		 * @type {BlackFlagItem}
		 */
		get item() {
			return this.parent.parent;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Actor to which this PseudoDocument's item belongs, if the item is embedded.
		 * @type {BlackFlagActor|null}
		 */
		get actor() {
			return this.item.parent ?? null;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Lazily obtain a FormApplication instance used to configure this PseudoDocument, or null if no sheet is available.
		 * @type {FormApplication|null}
		 */
		get sheet() {
			if ( !this._sheet ) {
				const cfg = CONFIG[this.documentName].types;
				const cls = cfg[this.type]?.sheetClasses?.config ?? cfg[CONST.BASE_DOCUMENT_TYPE].sheetClasses.config;
				if ( !cls ) return null;
				this._sheet = new cls(this, {editable: this.item.isOwner});
			}
			return this._sheet;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Preparation Methods         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Prepare data for the PseudoDocument.
		 */
		prepareData() {}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Perform preliminary operations before an Advancement is created.
		 * @param {object} data - The initial data object provided to the document creation request.
		 * @returns {boolean|void} - A return value of false indicates the creation operation should be cancelled.
		 * @protected
		 */
		_preCreate(data) {}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*           Display Methods           */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Render all of the Application instances which are connected to this PseudoDocument.
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
		 * Validate that a PseudoDocument can be created.
		 * @param {object} data - Data for creating a single PseudoDocument.
		 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the creation workflow.
		 * @throws
		 */
		static _validateDocumentCreation(data, context) {}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Create multiple PseudoDocuments using provided input data.
		 * Data is provided as an array of objects where each individual object becomes one new PseudoDocument.
		 * See Foundry's Document#createDocuments documentation for more information.
		 *
		 * @param {object[]} data - An array of data objects used to create multiple PseudoDocuments.
		 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the creation workflow.
		 * @returns {Promise<PseudoDocument[]>} - An array of created PseudoDocuments instances.
		 */
		static async createDocuments(data=[], context={}) {
			if ( !context.parent ) throw new Error("Cannot create pseudo documents without a parent.");
			const updates = data.reduce((updates, data) => {
				if ( !context.keepId || !data._id ) data._id = foundry.utils.randomID();
				const c = CONFIG[this.documentName].types[data.type];
				const createData = foundry.utils.deepClone(data);
				const created = new c.documentClass(data, {parent: context.parent});
				if ( created._preCreate(createData) !== false ) {
					updates[data._id] = created.toObject();
					this._validateDocumentCreation(data, context);
				}
				return updates;
			}, {});
			await context.parent.update(
				{[`system.${this.collectionName}`]: updates},
				this._clearedDocumentModificationContext(context)
			);
			const documents = Object.keys(updates).map(id =>
				context.parent.getEmbeddedDocument(this.documentName, id)
			);
			if ( context.renderSheet ) documents.forEach(d => d.sheet.render(true));
			return documents;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Update multiple PseudoDocuments instances using provided differential data.
		 * Data is provided as an array of objects where each individual object updates one existing PseudoDocuments.
		 * See Foundry's Document#updateDocuments documentation for more information.
		 *
		 * @param {object[]} updates - An array of differential data objects, each used to update a single PseudoDocuments.
		 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the update workflow.
		 * @returns {Promise<PseudoDocument[]>} - An array of updated PseudoDocuments instances.
		 */
		static async updateDocuments(updates=[], context={}) {
			if ( !context.parent ) throw new Error("Cannot update pseudo documents without a parent.");
			updates = updates.reduce((updates, data) => {
				if ( !data._id ) throw new Error("ID must be provided when updating an pseudo document");
				updates[data._id] = data;
				return updates;
			}, {});
			await context.parent.update(
				{[`system.${this.collectionName}`]: updates},
				this._clearedDocumentModificationContext(context)
			);
			return Object.keys(updates).map(id => context.parent.getEmbeddedDocument(this.documentName, id));
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Delete one or multiple existing Documents using an array of provided ids.
		 * Data is provided as an array of string ids for the PseudoDocuments to delete.
		 * See Foundry's Document#deleteDocuments documentation for more information.
		 *
		 * @param {string[]} ids - An array of string ids for the PseudoDocuments to be deleted.
		 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the deletion workflow.
		 * @returns {Promise<PseudoDocument[]>} - An array of deleted PseudoDocument instances.
		 */
		static async deleteDocuments(ids, context={}) {
			if ( !context.parent ) throw new Error("Cannot delete pseudo documents without a parent.");
			const { updates, documents } = ids.reduce(({ updates, documents }, id) => {
				documents.push(context.parent.getEmbeddedDocument(this.documentName, id));
				updates[`system.${this.collectionName}.-=${id}`] = null;
				return { updates, documents };
			}, { updates: {}, documents: [] });
			await context.parent.update(updates, this._clearedDocumentModificationContext(context));
			return documents;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Update this PseudoDocument.
		 * @param {object} [data={}] - Updates to apply to this PseudoDocument.
		 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the update workflow.
		 * @returns {Promise<PseudoDocument>} - This PseudoDocument after updates have been applied.
		 */
		async update(data={}, context={}) {
			await this.item.updateEmbeddedDocuments(this.documentName, [{ ...data, _id: this.id }], context);
			if ( context.render !== false ) this.render();
			return this;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Update this PseudoDocument's data on the item without performing a database commit.
		 * @param {object} updates - Updates to apply to this PseudoDocument.
		 * @returns {PseudoDocument} - This PseudoDocument after updates have been applied.
		 */
		updateSource(updates) {
			super.updateSource(updates);
			return this;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Delete this PseudoDocument, removing it from the database.
		 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the deletion workflow.
		 * @returns {Promise<PseudoDocument>} - The deleted PseudoDocument instance.
		 */
		async delete(context={}) {
			const deleted = await this.item.deleteEmbeddedDocuments(this.documentName, [this.id], context);
			return deleted.shift();
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Present a Dialog form to confirm deletion of this PseudoDocument.
		 * @param {object} [options] - Positioning and sizing options for the resulting dialog.
		 * @returns {Promise<PseudoDocument>} - A Promise which resolves to the deleted PseudoDocument.
		 */
		async deleteDialog(options={}) {
			const type = game.i18n.localize(this.metadata.title);
			return Dialog.confirm({
				title: `${game.i18n.format("DOCUMENT.Delete", {type})}: ${this.name}`,
				content: `<h4>${game.i18n.localize("AreYouSure")}</h4><p>${
					game.i18n.format("SIDEBAR.DeleteWarning", {type})}</p>`,
				yes: this.delete.bind(this),
				options: options
			});
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Serialize salient information for this PseudoDocument when dragging it.
		 * @returns {object} - An object of drag data.
		 */
		toDragData() {
			const dragData = { type: this.documentName };
			if ( this.id ) dragData.uuid = this.uuid;
			else dragData.data = this.toObject();
			return dragData;
		}
	};
}

import EmbedMixin from "./embed.mjs";

/**
 * A mixin which extends a DataModel to provide a CRUD-layer similar to normal Documents.
 * @template {DataModel} T
 * @param {typeof DataModel} Base - The base DataModel to be mixed.
 * @returns {typeof PseudoDocument}
 * @mixin
 */
export default function PseudoDocumentMixin(Base) {
	class PseudoDocument extends EmbedMixin(Base) {
		constructor(data, { parent = null, ...options } = {}) {
			if (parent instanceof Item) parent = parent.system;
			super(data, { parent, ...options });
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Mapping of PseudoDocument UUID to the apps they should re-render.
		 * @type {Map<string, Set<string>>}
		 * @internal
		 */
		static _apps = new Map();

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Existing sheets of a specific type for a specific document.
		 * @type {Map<[PseudoDocument, typeof Application], Application>}
		 */
		static _sheets = new Map();

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Model Configuration         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Configuration information for PseudoDocuments.
		 *
		 * @typedef {object} PseudoDocumentsMetadata
		 * @property {string} name - Base type name of this PseudoDocument (e.g. "Activity", "Advancement").
		 * @property {string} collection - Location of the collection of pseudo documents within system data.
		 * @property {string} type - Sub-type of PseudoDocument.
		 * @property {string} label - Localized name for this PseudoDocument type.
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
			const id = this.id ?? this._source.id;
			if (!this.item || !id) return null;
			return `${this.item.uuid}.${this.documentName}.${id}`;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Item to which this PseudoDocument belongs.
		 * @type {BlackFlagItem}
		 */
		get item() {
			return this.parent?.parent;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Actor to which this PseudoDocument's item belongs, if the item is embedded.
		 * @type {BlackFlagActor|null}
		 */
		get actor() {
			return this.item?.parent ?? null;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Lazily obtain a FormApplication instance used to configure this PseudoDocument, or null if no sheet is available.
		 * @type {FormApplication|null}
		 */
		get sheet() {
			const cfg = CONFIG[this.documentName].types;
			const cls = cfg[this.type]?.sheetClasses?.config ?? cfg[CONST.BASE_DOCUMENT_TYPE].sheetClasses.config;
			if (!cls) return null;
			const def = `${this.uuid}!${cls.name}`;
			if (!this.constructor._sheets.has(def)) {
				this.constructor._sheets.set(def, new cls(this, { editable: this.item.isOwner }));
			}
			return this.constructor._sheets.get(def);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Prepare a data object which defines the data schema used by dice roll commands against this Activity.
		 * @param {object} [options]
		 * @param {boolean} [options.deterministic] - Whether to force deterministic values for data properties that could
		 *                                            be either a die term or a flat term.
		 * @returns {object}
		 */
		getRollData(options) {
			return this.item.getRollData(options);
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Preparation Methods         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Perform preliminary operations before an PseudoDocument is created.
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
		render(force = false, context = {}) {
			for (const app of this.constructor._apps.get(this.uuid) ?? []) app.render(force, context);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Register an application to respond to updates to a certain document.
		 * @param {PseudoDocument} doc - Pseudo document to watch.
		 * @param {Application} app - Application to update.
		 * @internal
		 */
		static _registerApp(doc, app) {
			if (!this._apps.has(doc.uuid)) this._apps.set(doc.uuid, new Set());
			this._apps.get(doc.uuid).add(app);
		}

		/**
		 * Remove an application from the render registry.
		 * @param {PseudoDocument} doc - Pseudo document being watched.
		 * @param {Application} app - Application to stop watching.
		 */
		static _unregisterApp(doc, app) {
			this._apps.get(doc?.uuid)?.delete(app);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _buildEmbedHTML(config, options = {}) {
			return this.toEmbedContents?.(config, options) ?? null;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Convert this Document to some HTML display for embedding purposes.
		 * @param {DocumentHTMLEmbedConfig} config - Configuration for embedding behavior.
		 * @param {EnrichmentOptions} [options] - The original enrichment options for cases where the Document embed content
		 *                                        also contains text that must be enriched.
		 * @returns {Promise<HTMLElement|HTMLCollection|null>}
		 */
		async toEmbedContents(config, options) {
			return null;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*           Editing Methods           */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Remove unnecessary keys from the context before passing it through to the update.
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
		static async createDocuments(data = [], context = {}) {
			if (!context.parent) throw new Error("Cannot create pseudo documents without a parent.");
			const updates = data.reduce((updates, data) => {
				if (!context.keepId || !data._id) data._id = foundry.utils.randomID();
				const c = CONFIG[this.documentName].types[data.type];
				const createData = foundry.utils.deepClone(data);
				const created = new c.documentClass(data, { parent: context.parent });
				if (created._preCreate(createData) !== false) {
					updates[data._id] = created.toObject();
					this._validateDocumentCreation(data, context);
				}
				return updates;
			}, {});
			await context.parent.update(
				{ [`system.${this.collectionName}`]: updates },
				this._clearedDocumentModificationContext(context)
			);
			const documents = Object.keys(updates).map(id => context.parent.getEmbeddedDocument(this.documentName, id));
			if (context.renderSheet) documents.forEach(d => d.sheet.render(true));
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
		static async updateDocuments(updates = [], context = {}) {
			if (!context.parent) throw new Error("Cannot update pseudo documents without a parent.");
			updates = updates.reduce((updates, data) => {
				if (!data._id) throw new Error("ID must be provided when updating an pseudo document");
				const c =
					CONFIG[this.documentName].types[
						data.type ?? context.parent.getEmbeddedDocument(this.documentName, data._id)?.type
					];
				const removals = Object.entries(foundry.utils.flattenObject(data)).reduce((obj, [k, v]) => {
					if (v instanceof foundry.data.operators.ForcedDeletion) obj[k] = _del;
					return obj;
				}, {});
				updates[data._id] = foundry.utils.mergeObject(
					c?.documentClass.cleanData(foundry.utils.expandObject(data), { partial: true }) ?? data,
					removals
				);
				return updates;
			}, {});
			await context.parent.update(
				{ [`system.${this.collectionName}`]: updates },
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
		static async deleteDocuments(ids, context = {}) {
			if (!context.parent) throw new Error("Cannot delete pseudo documents without a parent.");
			const closing = [];
			const { updates, documents } = ids.reduce(
				({ updates, documents }, id) => {
					const doc = context.parent.getEmbeddedDocument(this.documentName, id);
					closing.push(Promise.allSettled(doc.constructor._apps.get(doc.uuid)?.map(a => a.close()) ?? []));
					documents.push(doc);
					updates[`system.${this.collectionName}.${id}`] = _del;
					return { updates, documents };
				},
				{ updates: {}, documents: [] }
			);
			await Promise.allSettled(closing);
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
		async update(data = {}, context = {}) {
			await this.item.updateEmbeddedDocuments(this.documentName, [{ type: this.type, ...data, _id: this.id }], context);
			if (context.render !== false) this.render();
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
		async delete(context = {}) {
			const deleted = await this.item.deleteEmbeddedDocuments(this.documentName, [this.id], context);
			return deleted.shift();
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Present a Dialog form to confirm deletion of this PseudoDocument.
		 * @param {object} [options] - Positioning and sizing options for the resulting dialog.
		 * @returns {Promise<PseudoDocument>} - A Promise which resolves to the deleted PseudoDocument.
		 */
		async deleteDialog({ sheet, ...options } = {}) {
			const type = _loc(this.metadata.title);
			const config = foundry.utils.mergeObject(
				{
					content: `<p><strong>${_loc("COMMON.AreYouSure")}</strong> ${_loc("SIDEBAR.DeleteWarning", {
						type
					})}</p>`,
					yes: { callback: () => this.delete() },
					position: { width: 400 },
					window: {
						title: `${_loc("DOCUMENT.Delete", { type })}: ${this.name || this.title}`
					}
				},
				options
			);
			if (sheet) return sheet._confirmDialog(config);
			return BlackFlag.applications.api.BFDialog.confirm(config);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Serialize salient information for this PseudoDocument when dragging it.
		 * @returns {object} - An object of drag data.
		 */
		toDragData() {
			const dragData = { type: this.documentName, data: this.toObject() };
			if (this.id) dragData.uuid = this.uuid;
			return dragData;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*           Flag Operations           */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Get the value of a flag for this PseudoDocument.
		 * @param {string} scope - The flag scope which namespaces the key.
		 * @param {string} key - The flag key.
		 * @returns {*} - The flag value.
		 */
		getFlag(scope, key) {
			const scopes = Item.database.getFlagScopes();
			if (!scopes.includes(scope)) throw new Error(`Flag scope "${scope}" is not valid or not currently active.`);
			return foundry.utils.getProperty(this.flags?.[scope], key);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Assign a flag to this PseudoDocument.
		 * @param {string} scope - The flag scope which namespaces the key.
		 * @param {string} key - The flag key.
		 * @param {*} value - The flag value.
		 * @returns {Promise<PseudoDocument>} - A Promise resolving to the updated PseudoDocument.
		 */
		async setFlag(scope, key, value) {
			const scopes = Item.database.getFlagScopes();
			if (!scopes.includes(scope)) throw new Error(`Flag scope "${scope}" is not valid or not currently active.`);
			return this.update({ flags: { [scope]: { [key]: value } } });
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Remove a flag assigned to the PseudoDocument.
		 * @param {string} scope - The flag scope which namespaces the key.
		 * @param {string} key - The flag key.
		 * @returns {Promise<Document>} - The updated document instance.
		 */
		async unsetFlag(scope, key) {
			const scopes = Item.database.getFlagScopes();
			if (!scopes.includes(scope)) throw new Error(`Flag scope "${scope}" is not valid or not currently active.`);
			return this.update({ [["flags", scope, key].join(".")]: _del });
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*       Importing and Exporting       */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Create a content link for this PseudoDocument.
		 * @param {object} [options] - Additional options to configure how the link is constructed.
		 * @param {Record<string>} [options.attrs] -  Attributes to set on the link.
		 * @param {Record<string>} [options.dataset] - Custom data- attributes to set on the link.
		 * @param {string[]} [options.classes] - Additional classes to add to the link. The `content-link` class is added
		 *                                       by default.
		 * @param {string} [options.name] - A name to use for the Document, if different from the Document's name.
		 * @param {string} [options.icon] - A font-awesome icon class to use as the icon, if different to the
		 *                                  Document's configured sidebarIcon.
		 * @returns {HTMLAnchorElement}
		 */
		toAnchor({ attrs = {}, dataset = {}, classes = [], name, icon } = {}) {
			// Build dataset
			const documentConfig = CONFIG[this.documentName];
			const documentName = _loc(`DOCUMENT.BF.${this.documentName}`);
			let anchorIcon = icon ?? documentConfig.sidebarIcon ?? "fas fa-suitcase";
			dataset = foundry.utils.mergeObject(
				{
					uuid: this.uuid,
					id: this.id,
					type: this.documentName,
					pack: this.item.pack,
					tooltip: documentName
				},
				dataset
			);

			// If this is a typed document, add the type to the dataset
			if (this.type) {
				const typeLabel = documentConfig.typeLabels?.[this.type];
				const typeName = game.i18n.has(typeLabel) ? `${_loc(typeLabel)}` : "";
				dataset.tooltip = typeName
					? _loc("DOCUMENT.TypePageFormat", { type: typeName, page: documentName })
					: documentName;
				anchorIcon = icon ?? documentConfig.typeIcons?.[this.type] ?? documentConfig.sidebarIcon ?? anchorIcon;
			}

			// Construct Link
			const a = document.createElement("a");
			a.classList.add("content-link", ...classes);
			Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v));
			for (const [k, v] of Object.entries(dataset)) {
				if (v !== null) a.dataset[k] = v;
			}
			a.innerHTML = `<i class="${anchorIcon}"></i>`;
			a.append(name ?? this.name ?? this.title);
			return a;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle clicking on a content link for this document.
		 * @param {MouseEvent} event - The triggering click event.
		 * @returns {any}
		 * @protected
		 */
		_onClickDocumentLink(event) {
			return this.sheet.render(true);
		}
	}
	return PseudoDocument;
}

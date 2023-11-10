/**
 * Base configuration application for advancements that can be extended by other types to implement custom
 * editing interfaces.
 *
 * @param {Advancement} advancement - The advancement item being edited.
 * @param {object} [options={}] - Additional options passed to FormApplication.
 * @param {string} [options.dropKeyPath=null] - Path within advancement configuration where dropped items are stored.
 *                                              If populated, will enable default drop & delete behavior.
 */
export default class AdvancementConfig extends FormApplication {
	constructor(advancement, options={}) {
		super(advancement, options);
		this.#advancementId = advancement.id;
		this.item = advancement.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ID of the advancement being created or edited.
	 * @type {string}
	 */
	#advancementId;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Stored information about the current drag event.
	 * @type {{ listener: boolean, time: number|null, payload: object|null, valid: boolean }}
	 */
	#dragData = { listener: false, time: null, payload: null, valid: null };

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Parent item to which this advancement belongs.
	 * @type {BlackFlagItem}
	 */
	item;

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config"],
			template: "systems/black-flag/templates/advancement/advancement-config.hbs",
			width: 400,
			height: "auto",
			submitOnChange: true,
			closeOnSubmit: false,
			dropKeyPath: null
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The advancement being created or edited.
	 * @type {Advancement}
	 */
	get advancement() {
		return this.item.system.advancement.get(this.#advancementId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does the drop target support multiple documents?
	 * @type {boolean|null}
	 */
	get multiDrop() {
		if ( !this.options.dropKeyPath ) return null;
		const field = this.advancement.metadata.dataModels?.configuration?.schema.getField(this.options.dropKeyPath);
		return field instanceof foundry.data.fields.ArrayField;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		const type = game.i18n.localize(this.advancement.metadata.title);
		return `${game.i18n.format("BF.Advancement.Config.Title", { item: this.item.name })}: ${type}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async close(options={}) {
		await super.close(options);
		delete this.advancement.apps[this.appId];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	getData() {
		const levels = Array.fromRange(CONFIG.BlackFlag.maxLevel, 1).map(l => [l, l]);
		if ( this.advancement.supportsAnyLevel ) {
			levels.unshift([0, game.i18n.localize("BF.Advancement.Core.Level.Any.Short")]);
		}
		const context = {
			CONFIG: CONFIG.BlackFlag,
			configuration: this.advancement.configuration,
			source: this.advancement.toObject(),
			advancement: this.advancement,
			default: {
				title: game.i18n.localize(this.advancement.metadata.title),
				icon: this.advancement.metadata.icon,
				identifier: this.advancement.title.slugify({ strict: true }),
				identifierHint: this.advancement.metadata.identifier.hint
			},
			levels: Object.fromEntries(levels),
			showIdentifier: this.advancement.metadata.identifier.configurable,
			showLevelSelector: !this.advancement.metadata.multiLevel
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	render(force=false, options={}) {
		this.advancement.apps[this.appId] = this;
		return super.render(force, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		// Remove an item from the list
		if ( this.options.dropKeyPath ) {
			for ( const element of html.querySelectorAll('[data-action="delete"]') ) {
				element.addEventListener("click", this._onItemDelete.bind(this));
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		let updates = foundry.utils.expandObject(formData);
		if ( updates.configuration ) {
			updates.configuration = await this.prepareConfigurationUpdate(updates.configuration);
		}
		await this.advancement.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any changes to configuration data before it is saved to the advancement.
	 * @param {object} configuration - Configuration object.
	 * @returns {object} - Modified configuration.
	 */
	async prepareConfigurationUpdate(configuration) {
		return configuration;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Drag & Drop for Item Pools     */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle deleting an existing Item entry from the Advancement.
	 * @param {Event} event - The originating click event.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 * @protected
	 */
	async _onItemDelete(event) {
		event.preventDefault();
		const uuidToDelete = event.currentTarget.closest("[data-item-uuid]")?.dataset.itemUuid;
		if ( !uuidToDelete ) return;
		let updates;
		if ( this.multiDrop ) {
			const items = foundry.utils.getProperty(this.advancement.configuration, this.options.dropKeyPath);
			updates = { configuration: await this.prepareConfigurationUpdate({
				[this.options.dropKeyPath]: items.filter(i => i.uuid !== uuidToDelete)
			}) };
		} else {
			updates = {[`configuration.${this.options.dropKeyPath}`]: null};
		}
		await this.advancement.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_canDragDrop() {
		return this.isEditable;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDragOver(event) {
		// TODO: Convert to _onDragEnter listener

		const dropTarget = event.target.closest(".drop-area");
		if ( !dropTarget ) return;

		const diff = Date.now() - this.#dragData.time;
		this.#dragData.time = Date.now();

		if ( !this.#dragData.listener ) {
			dropTarget.addEventListener("dragleave", this._onDragLeave.bind(this), { once: true });
			this.#dragData.listener = true;
		}

		const data = TextEditor.getDragEventData(event);
		if ( !this.#dragData.payload
			|| !foundry.utils.isEmpty(foundry.utils.diffObject(data, this.#dragData.payload))
			|| diff > 10000 ) {
			try {
				const item = await Item.implementation.fromDropData(data);
				this._validateDroppedItem(event, item);
				this.#dragData.payload = data;
				this.#dragData.valid = true;
			} catch(err) {
				this.#dragData.valid = false;
			}
		}
		dropTarget.classList.add(this.#dragData.valid ? "valid" : "invalid");
		event.dataTransfer.dropEffect = this.#dragData.valid ? "copy" : "all";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove drag target highlight when drag leaves.
	 * @param {DragEvent} event
	 */
	async _onDragLeave(event) {
		this.#dragData.listener = false;
		const dropTarget = event.target?.closest(".drop-area");
		if ( !dropTarget ) return;
		dropTarget.classList.remove("valid");
		dropTarget.classList.remove("invalid");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDrop(event) {
		this._onDragLeave(event);

		if ( !this.options.dropKeyPath ) throw new Error(
			"AdvancementConfig#options.dropKeyPath must be configured or #_onDrop must be overridden to support"
			+ " drag and drop on advancement config items."
		);

		// Try to extract the data
		const data = TextEditor.getDragEventData(event);

		if ( data?.type !== "Item" ) return false;
		const item = await Item.implementation.fromDropData(data);

		try {
			this._validateDroppedItem(event, item);
		} catch(err) {
			return ui.notifications.error(err.message);
		}

		let existingItems = foundry.utils.getProperty(this.advancement.configuration, this.options.dropKeyPath);
		if ( !this.multiDrop ) existingItems = [{uuid: existingItems}];

		// Abort if this uuid exists already
		if ( existingItems.find(i => i.uuid === item.uuid) ) {
			ui.notifications.warn("BF.Advancement.Config.Warning.Duplicate", {localize: true});
			return null;
		}
		// TODO: Allow dragging to re-order entries

		const newValue = this.multiDrop ? [...existingItems, { uuid: item.uuid }] : item.uuid;
		await this.advancement.update({[`configuration.${this.options.dropKeyPath}`]: newValue});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Called when an item is dropped to validate the Item before it is saved. An error should be thrown
	 * if the item is invalid.
	 * @param {Event} event - Triggering drop event.
	 * @param {BlackFlagItem} item - The materialized Item that was dropped.
	 * @throws An error if the item is invalid.
	 * @protected
	 */
	_validateDroppedItem(event, item) {
		// Abort if this uuid is the parent item
		if ( item.uuid === this.item.uuid ) {
			throw new Error(game.i18n.localize("BF.Advancement.Config.Warning.Recursive"));
		}
	}
}

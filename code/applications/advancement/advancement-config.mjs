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
	 * Indicates that a `dragleave` listener is currently registered to the drop area.
	 * @type {boolean}
	 */
	#dragLeaveListener = false;

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

	get title() {
		const type = this.advancement.constructor.metadata.title;
		return `${game.i18n.format("BF.Advancement.Config.Title", { item: this.item.name })}: ${type}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async close(options={}) {
		await super.close(options);
		delete this.advancement.apps[this.appId];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData() {
		const levels = Object.fromEntries(Array.fromRange(CONFIG.BlackFlag.maxLevel, 1).map(l => [l, l]));
		// TODO: Allow "any level" for non-class items
		const context = {
			CONFIG: CONFIG.BlackFlag,
			configuration: this.advancement.configuration,
			source: this.advancement.toObject(),
			advancement: this.advancement,
			default: {
				title: this.advancement.constructor.metadata.title,
				icon: this.advancement.constructor.metadata.icon,
				identifier: this.advancement.title.slugify({ strict: true }),
				identifierHint: this.advancement.constructor.metadata.identifier.hint
			},
			levels,
			showIdentifier: this.advancement.constructor.metadata.identifier.configurable,
			showLevelSelector: !this.advancement.constructor.metadata.multiLevel
		};
		return context;
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

	render(force=false, options={}) {
		this.advancement.apps[this.appId] = this;
		return super.render(force, options);
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
	 * Helper method to take an object and apply updates that remove any empty keys.
	 * @param {object} object - Object to be cleaned.
	 * @returns {object} - Copy of object with only non false-ish values included and others marked
	 *                     using `-=` syntax to be removed by update process.
	 * @protected
	 */
	static _cleanedObject(object) {
		return Object.entries(object).reduce((obj, [key, value]) => {
			if ( value ) obj[key] = value;
			else obj[`-=${key}`] = null;
			return obj;
		}, {});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Drag & Drop for Item Pools     */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle deleting an existing Item entry from the Advancement.
	 * @param {Event} event - The originating click event.
	 * @returns {Promise<Item5e>} - The updated parent Item after the application re-renders.
	 * @protected
	 */
	async _onItemDelete(event) {
		event.preventDefault();
		const uuidToDelete = event.currentTarget.closest("[data-item-uuid]")?.dataset.itemUuid;
		if ( !uuidToDelete ) return;
		const items = foundry.utils.getProperty(this.advancement.configuration, this.options.dropKeyPath);
		const updates = { configuration: await this.prepareConfigurationUpdate({
			[this.options.dropKeyPath]: items.filter(i => i.uuid !== uuidToDelete)
		}) };
		await this.advancement.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_canDragDrop() {
		return this.isEditable;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDragOver(event) {
		// If over a drop target, highlight it and display preview in area
		const dropTarget = event.target.closest(".drop-target");
		if ( !dropTarget ) return;

		dropTarget.classList.add("drag-over");

		if ( !this.#dragLeaveListener ) {
			dropTarget.addEventListener("dragleave", this._onDragLeave.bind(this), { once: true });
			this.#dragLeaveListener = true;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove drag target highlight when drag leaves.
	 * @param {DragEvent} event
	 */
	async _onDragLeave(event) {
		this.#dragLeaveListener = false;
		const dropTarget = event.target.closest(".drop-target");
		if ( !dropTarget ) return;
		dropTarget.classList.remove("drag-over");
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

		const existingItems = foundry.utils.getProperty(this.advancement.configuration, this.options.dropKeyPath);

		// Abort if this uuid is the parent item
		if ( item.uuid === this.item.uuid ) {
			return ui.notifications.error(game.i18n.localize("BF.Advancement.Config.Warning.Recursive"));
		}

		// Abort if this uuid exists already
		if ( existingItems.find(i => i.uuid === item.uuid) ) {
			return ui.notifications.warn(game.i18n.localize("BF.Advancement.Config.Warning.Duplicate"));
		}
		// TODO: Allow dragging to re-order entries

		await this.advancement.update({
			[`configuration.${this.options.dropKeyPath}`]: [...existingItems, { uuid: item.uuid }]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Called when an item is dropped to validate the Item before it is saved. An error should be thrown
	 * if the item is invalid.
	 * @param {Event} event - Triggering drop event.
	 * @param {Item5e} item - The materialized Item that was dropped.
	 * @throws An error if the item is invalid.
	 * @protected
	 */
	_validateDroppedItem(event, item) {}

}

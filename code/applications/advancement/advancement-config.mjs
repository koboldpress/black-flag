import PseudoDocumentSheet from "../api/pseudo-document-sheet.mjs";

/**
 * Base configuration application for advancements that can be extended by other types to implement custom
 * editing interfaces.
 *
 * @param {Advancement} advancement - The advancement item being edited.
 * @param {object} [options={}] - Additional options passed to FormApplication.
 * @param {string} [options.dropKeyPath=null] - Path within advancement configuration where dropped items are stored.
 *                                              If populated, will enable default drop & delete behavior.
 */
export default class AdvancementConfig extends PseudoDocumentSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["advancement-config"],
		actions: {
			deleteDropped: AdvancementConfig.#onDeleteDropped
		},
		dragDropHandlers: {
			dragenter: AdvancementConfig.#onDragEnter,
			dragleave: AdvancementConfig.#onDragLeave,
			drop: AdvancementConfig.#onDrop
		},
		dropKeyPath: null,
		position: {
			width: 400,
			height: "auto"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The advancement being created or edited.
	 * @type {Advancement}
	 */
	get advancement() {
		return this.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does the drop target support multiple documents?
	 * @type {boolean|null}
	 */
	get multiDrop() {
		if (!this.options.dropKeyPath) return null;
		const field = this.advancement.metadata.dataModels?.configuration?.schema.getField(this.options.dropKeyPath);
		return field instanceof foundry.data.fields.ArrayField;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		const type = game.i18n.localize(this.advancement.metadata.title);
		return `${game.i18n.format("BF.Advancement.Config.Title", { item: this.item.name })}: ${type}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onFirstRender(context, options) {
		super._onFirstRender(context, options);
		let columns = [];
		const created = [];
		if (this.options.classes.includes("two-column")) columns = ["left", "right"];
		else if (this.options.classes.includes("three-column")) columns = ["left", "center", "right"];
		const content = this.element.querySelector(".window-content");
		for (const column of columns) {
			const div = document.createElement("div");
			div.classList.add(`column-${column}`);
			div.replaceChildren(...content.querySelectorAll(`& > .${column}-column`));
			if (div.children.length) created.push(div);
		}
		created.reverse().forEach(c => content.insertAdjacentElement("afterbegin", c));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const levels = [
			[0, game.i18n.localize("BF.Advancement.Core.Level.Any.Short")],
			...Array.fromRange(CONFIG.BlackFlag.maxLevel, 1).map(l => [l, l])
		].slice(this.advancement.minimumLevel);
		const context = await super._prepareContext(options);
		context.configuration = this.advancement.configuration;
		context.source = this.advancement.toObject();
		context.advancement = this.advancement;
		context.default = {
			title: game.i18n.localize(this.advancement.metadata.title),
			icon: this.advancement.metadata.icon,
			identifier: this.advancement.title.slugify({ strict: true }),
			identifierHint: this.advancement.metadata.identifier.hint
		};
		context.levels = Object.fromEntries(levels);
		context.showClassIdentifier = this.item.system.metadata?.category === "features";
		context.showClassRestriction = this.item.type === "class" || !!this.advancement.level.classIdentifier;
		context.showHint = this.advancement.metadata.configurableHint;
		context.showIdentifier = this.advancement.metadata.identifier.configurable;
		context.showLevelSelector = !this.advancement.metadata.multiLevel;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _processSubmitData(event, form, submitData) {
		submitData.configuration ??= {};
		submitData.configuration = await this.prepareConfigurationUpdate(submitData.configuration, submitData);
		if (submitData.level?.classIdentifier && submitData.level?.value === 0) {
			submitData.level.value = 1;
		}
		await this.advancement.update(submitData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any changes to configuration data before it is saved to the advancement.
	 * @param {object} configuration - Configuration object.
	 * @param {object} submitData - Processed and validated form data to be used for a document update.
	 * @returns {object} - Modified configuration.
	 */
	async prepareConfigurationUpdate(configuration, submitData) {
		return configuration;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Drag & Drop            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle deleting an existing Item entry from the Advancement.
	 * @this {AdvancementConfig}
	 * @param {Event} event - The originating click event.
	 * @param {HTMLElement} target - The button that was clicked.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 */
	static async #onDeleteDropped(event, target) {
		event.preventDefault();
		const uuidToDelete = target.closest("[data-item-uuid]")?.dataset.itemUuid;
		if (!uuidToDelete) return;
		let updates;
		if (this.multiDrop) {
			const items = foundry.utils.getProperty(this.advancement.configuration, this.options.dropKeyPath);
			updates = {
				configuration: await this.prepareConfigurationUpdate({
					[this.options.dropKeyPath]: items.filter(i => i.uuid !== uuidToDelete)
				})
			};
		} else {
			updates = { [`configuration.${this.options.dropKeyPath}`]: null };
		}
		await this.advancement.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add drag target highlight when drag enters drop area.
	 * @this {AdvancementConfig}
	 * @param {Event} event - Triggering event.
	 * @param {DragDrop} dragDrop - The drag event manager.
	 */
	static async #onDragEnter(event, dragDrop) {
		const dropTarget = event.target.closest(".drop-area");
		if (!dropTarget) return;
		dragDrop.enterDragArea(event, dropTarget);

		const { data } = dragDrop.getDragData(event);
		let valid = true;
		if (data?.type !== "Item") valid = false;
		else {
			try {
				const item = await Item.implementation.fromDropData(data);
				this._validateDroppedItem(event, item);
			} catch (err) {
				valid = false;
			}
		}

		dropTarget.classList.add(valid ? "valid" : "invalid");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove drag target highlight when drag leaves.
	 * @this {AdvancementConfig}
	 * @param {Event} event - Triggering event.
	 * @param {DragDrop} dragDrop - The drag event manager.
	 */
	static async #onDragLeave(event, dragDrop) {
		dragDrop.exitDragArea(event, area => {
			if (!area.classList.contains("drop-area")) return false;
			area.classList.remove("valid");
			area.classList.remove("invalid");
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle dropping an entry onto the app.
	 * @this {AdvancementConfig}
	 * @param {Event} event - Triggering event.
	 * @param {DragDrop} dragDrop - The drag event manager.
	 * @returns {Promise}
	 */
	static async #onDrop(event, dragDrop) {
		if (!this.options.dropKeyPath)
			throw new Error(
				"AdvancementConfig#options.dropKeyPath must be configured or #_onDrop must be overridden to support" +
					" drag and drop on advancement config items."
			);
		const dropArea = event.target.closest(".drop-area");
		if (dropArea) {
			dropArea.classList.remove("valid");
			dropArea.classList.remove("invalid");
		}

		// Try to extract the data
		const { data } = dragDrop.getDragData(event);

		if (data?.type !== "Item") return;

		try {
			const item = await Item.implementation.fromDropData(data);
			this._validateDroppedItem(event, item);

			let existingItems = foundry.utils.getProperty(this.advancement.configuration, this.options.dropKeyPath);
			if (!this.multiDrop) existingItems = [{ uuid: existingItems }];

			// Abort if this uuid exists already
			if (existingItems.find(i => i.uuid === item.uuid)) {
				ui.notifications.warn("BF.Advancement.Config.Warning.Duplicate", { localize: true });
				return;
			}
			// TODO: Allow dragging to re-order entries

			const newValue = this.multiDrop ? [...existingItems, { uuid: item.uuid }] : item.uuid;
			await this.advancement.update({ [`configuration.${this.options.dropKeyPath}`]: newValue });
		} catch (err) {
			ui.notifications.error(err.message);
			return;
		} finally {
			dragDrop.finishDragEvent(event);
		}
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
		if (item.uuid === this.item.uuid) {
			throw new Error(game.i18n.localize("BF.Advancement.Config.Warning.Recursive"));
		}
	}
}

import { EquipmentEntryData } from "../../data/advancement/equipment-data.mjs";
import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for equipment.
 */
export default class EquipmentConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["equipment", "form-list"],
		actions: {
			addEntry: EquipmentConfig.#onAddEntry,
			deleteEntry: EquipmentConfig.#onDeleteEntry
		},
		dragDropHandlers: {
			dragstart: EquipmentConfig.#onDragStart,
			drop: EquipmentConfig.#onDrop
		},
		dragSelectors: [".drag-bar"],
		position: {
			width: 480
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		equipment: {
			template: "systems/black-flag/templates/advancement/equipment-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = foundry.utils.mergeObject(
			await super._prepareContext(options),
			{
				showClassRestriction: false,
				showLevelSelector: false
			},
			{ inplace: false }
		);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		await super._preparePartContext(partId, context, options);
		if (partId === "equipment") await this._prepareEquipmentContext(context, options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the equipment listing.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareEquipmentContext(context, options) {
		const processEntry = async (entry, depth = 1) => {
			const data = {
				id: entry._id,
				entry,
				depth,
				groupType: entry.type in EquipmentEntryData.GROUPING_TYPES,
				validGroupTypes: depth < 3 ? EquipmentEntryData.GROUPING_TYPES : null,
				validOptionTypes: EquipmentEntryData.OPTION_TYPES
			};
			if (entry.type in EquipmentEntryData.GROUPING_TYPES) {
				data.children = await Promise.all(entry.children.map(c => processEntry(c, depth + 1)));
			} else if (entry.type === "linked") {
				data.linked = fromUuidSync(entry.key);
				data.showRequireProficiency = ["armor", "tool", "weapon"].includes(data.linked?.type);
			}
			return data;
		};

		context.entries = await Promise.all(
			this.advancement.configuration.pool
				.filter(e => !e.group)
				.sort((lhs, rhs) => lhs.sort - rhs.sort)
				.map(e => processEntry(e))
		);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding a new entry.
	 * @this {EquipmentConfig}
	 * @param {PointerEvent} event - The originating click event.
	 * @param {HTMLElement} target - The target of the click event.
	 */
	static #onAddEntry(event, target) {
		this.submit({
			updateData: {
				action: "addEntry",
				depth: Number(target.closest("[data-depth]")?.dataset.depth ?? 0) + 1,
				entryId: target.closest("[data-entry-id]")?.dataset.entryId
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing a entry.
	 * @this {EquipmentConfig}
	 * @param {PointerEvent} event - The originating click event.
	 * @param {HTMLElement} target - The target of the click event.
	 */
	static #onDeleteEntry(event, target) {
		this.submit({
			updateData: {
				action: "deleteEntry",
				entryId: target.closest("[data-entry-id]")?.dataset.entryId
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const data = super._processFormData(event, form, formData);
		data.configuration ??= {};
		data.configuration.pool = Object.values(data.pool ?? {});
		return data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareConfigurationUpdate(configuration, submitData) {
		switch (submitData.action) {
			case "addEntry":
				const highestSort = configuration.pool.reduce((sort, i) => (i.sort > sort ? i.sort : sort), 0);
				configuration.pool.push({
					_id: foundry.utils.randomID(),
					group: submitData.entryId,
					sort: highestSort + CONST.SORT_INTEGER_DENSITY,
					type: submitData.depth < 3 && !submitData.linkedUuid ? "OR" : "linked",
					key: submitData.linkedUuid
				});
				break;
			case "deleteEntry":
				const deleteIds = new Set();
				const getDeleteIds = entry => {
					deleteIds.add(entry._id);
					entry.children?.forEach(c => getDeleteIds(c));
				};
				getDeleteIds(this.advancement.configuration.pool.find(i => i._id === submitData.entryId));
				configuration.pool = configuration.pool.filter(e => !deleteIds.has(e._id));
				break;
		}
		return configuration;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Begin dragging an equipment entry.
	 * @this {EquipmentConfig}
	 * @param {Event} event - Triggering event.
	 * @param {DragDrop} dragDrop - The drag event manager.
	 */
	static #onDragStart(event, dragDrop) {
		const entry = event.target.closest("[data-entry-id]");
		if (!entry) return;
		dragDrop.beginDragEvent(event, {
			type: "equipment-entry",
			uuid: this.document.uuid,
			entryId: entry.dataset.entryId
		});
		const box = entry.getBoundingClientRect();
		event.dataTransfer.setDragImage(entry, box.width - 6, box.height / 2);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle dropping an equipment entry or an item.
	 * @this {EquipmentConfig}
	 * @param {Event} event - Triggering event.
	 * @param {DragDrop} dragDrop - The drag event manager.
	 * @returns {Promise}
	 */
	static async #onDrop(event, dragDrop) {
		const { data } = dragDrop.getDragData(event);

		// Handle re-ordering of the list
		if (data?.entryId && data.uuid === this.document.uuid) return this.#onSortEntry(event, data);

		// Handle dropping linked items
		if (data?.type !== "Item") return;
		const item = await Item.implementation.fromDropData(data);

		// Validate that this is a equipment item
		const metadata = item.system.constructor.metadata ?? {};
		if (metadata.category !== "equipment" && metadata.type !== "currency") {
			ui.notifications.error(
				game.i18n.format("BF.Advancement.Equipment.Warning.ItemTypeInvalid", {
					type: game.i18n.localize(CONFIG.Item.typeLabels[item.type])
				})
			);
			return;
		}

		// Determine where this was dropped
		const closestDrop = event.target.closest(
			'[data-entry-type="AND"], [data-entry-type="OR"], [data-entry-type="linked"]'
		);
		const { entryId, entryType } = closestDrop?.dataset ?? {};

		// If no closest entry, create at top level, or if closest is a group, create inside that group
		if (!entryId || entryType in EquipmentEntryData.GROUPING_TYPES)
			this.submit({
				updateData: {
					action: "addEntry",
					entryId,
					linkedUuid: item.uuid
				}
			});
		// If closest entry is linked, set its key to be this uuid
		else if (entryType === "linked")
			this.submit({
				updateData: {
					[`pool.${entryId}.key`]: item.uuid
				}
			});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle sorting an equipment entry.
	 * @param {Event} event - Triggering event.
	 * @param {object} data - Drag data.
	 */
	#onSortEntry(event, data) {
		const dropArea = event.target.closest("[data-entry-id]");
		const dragEntry = this.document.configuration.pool.find(e => e._id === data?.entryId);
		const dropEntry = this.document.configuration.pool.find(e => e._id === dropArea?.dataset.entryId);

		// If drag entry & drop entry are the same, or drop entry is drag entry's group, do nothing
		if (dropEntry?._id === dragEntry._id || dropEntry?._id === dragEntry.group) return;

		let updateData;
		let sortBefore;
		let target;

		// If drop entry is a group, move drag entry into it
		if (dropEntry?.type in EquipmentEntryData.GROUPING_TYPES) {
			let depth = Number(dropArea.dataset.depth) + 1;
			if (dragEntry.children?.length) {
				depth += 1;
				if (dragEntry.children.some(c => c.type in EquipmentEntryData.GROUPING_TYPES)) depth += 1;
			}
			if (depth > 3) {
				ui.notifications.warn("BF.Advancement.Equipment.Warning.Depth", { localize: true });
				return;
			}
			updateData = { [`pool.${dragEntry._id}.group`]: dropEntry._id };
			target = dropEntry.children.pop();
		}

		// If drag entry and drop entry are int he same group, perform relative sort
		else if (dropEntry && dropEntry.group === dragEntry.group) {
			target = dropEntry;
		}

		// If dropped outside any entry, move to the top level and sort to top or bottom of list
		else if (!dropEntry) {
			updateData = { [`pool.${dragEntry._id}.group`]: null };
			const box = this.element.getBoundingClientRect();
			sortBefore = event.clientY - box.y < box.height * 0.75;
			const sortedEntries = this.document.configuration.pool
				.filter(e => !e.group)
				.sort((lhs, rhs) => lhs.sort - rhs.sort);
			target = sortBefore ? sortedEntries.shift() : sortedEntries.pop();
		}

		// If they are in different groups, move entry to new group and then sort
		else if (dropEntry.group !== dragEntry.group) {
			updateData = { [`pool.${dragEntry._id}.group`]: dropEntry.group };
			target = dropEntry;
		}

		if (target && target !== dragEntry) {
			updateData ??= {};
			const siblings = this.document.configuration.pool.filter(s => s._id !== dragEntry._id);
			const sortUpdates = SortingHelpers.performIntegerSort(dragEntry, { target, siblings, sortBefore });
			for (const update of sortUpdates) {
				updateData[`pool.${update.target._id}.sort`] = update.update.sort;
			}
		}

		if (updateData) this.submit({ updateData });
	}
}

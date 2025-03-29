import BlackFlagItem from "../../documents/item.mjs";

/**
 * Compendium with added support for item containers.
 */
export default class BlackFlagItemCompendium extends foundry.applications.sidebar.apps.Compendium {
	/** @inheritDoc */
	async _onRender(context, options) {
		await super._onRender(context, options);
		let items = this.collection;
		if (this.collection.index) {
			if (!this.collection._reindexing) this.collection._reindexing = this.collection.getIndex();
			await this.collection._reindexing;
			items = this.collection.index;
		}
		for (const item of items) {
			if (items.has(item.system.container)) {
				this._element?.querySelector(`[data-entry-id="${item._id}"]`)?.remove();
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _handleDroppedEntry(target, data) {
		// Obtain the dropped Document
		let item = await Item.fromDropData(data);
		if (!item) return;

		// Create item and its contents if it doesn't already exist here
		if (!this._entryAlreadyExists(item)) {
			const contents = await item.system.contents;
			if (contents?.size) {
				const toCreate = await BlackFlagItem.createWithContents([item], {
					transformAll: item => item.toCompendium(item)
				});
				const folder = target?.closest("[data-folder-id]")?.dataset.folderId;
				if (folder) toCreate.map(d => (d.folder = folder));
				[item] = await BlackFlagItem.createDocuments(toCreate, { pack: this.collection.collection, keepId: true });
			}
		}

		// Otherwise, if it is within a container, take it out
		else if (item.system.container) await item.update({ "system.container": null });

		// Let parent method perform sorting
		super._handleDroppedEntry(target, item.toDragData());
	}
}

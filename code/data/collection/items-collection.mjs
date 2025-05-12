import BlackFlagItem from "../../documents/item.mjs";

/**
 * Custom items collection to hide items in containers automatically.
 */
export default class BlackFlagItems extends (foundry.documents?.collections?.Items ?? Items) {
	_getVisibleTreeContents(entry) {
		return this.contents.filter(c => c.visible && !this.has(c.system?.container));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async importFromCompendium(pack, id, updateData = {}, options = {}) {
		const created = await super.importFromCompendium(pack, id, updateData, options);

		const item = await pack.getDocument(id);
		const contents = await item.system.contents;
		if (contents) {
			const fromOptions = foundry.utils.mergeObject({ clearSort: false }, options);
			const toCreate = await BlackFlagItem.createWithContents(contents, {
				container: created,
				keepId: options.keepId,
				transformAll: item => this.fromCompendium(item, fromOptions)
			});
			await BlackFlagItem.createDocuments(toCreate, { fromCompendium: true, keepId: true });
		}

		return created;
	}
}

import { GrantSpellsConfigurationData, GrantSpellsValueData } from "../../data/advancement/grant-spells-data.mjs";
import GrantFeaturesAdvancement from "./grant-features-advancement.mjs";

/**
 * Advancement that automatically gives the player a set of spells.
 */
export default class GrantSpellsAdvancement extends GrantFeaturesAdvancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "grantSpells",
				dataModels: {
					configuration: GrantSpellsConfigurationData,
					value: GrantSpellsValueData
				},
				order: 45,
				icon: "systems/black-flag/artwork/advancement/grant-spells.svg",
				title: "BF.Advancement.GrantSpells.Title",
				hint: "BF.Advancement.GrantSpells.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static VALID_TYPES = new Set(["spell"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		const addUuids = new Set();
		const updateUuids = new Set();
		const mode = this.configuration.spell.mode;
		for (const { uuid } of Object.values(this.configuration.pool)) {
			const existing = this.actor.sourcedItems.get(uuid);
			if (existing?.getFlag("black-flag", "relationship.mode") === mode) updateUuids.add(uuid);
			else addUuids.add(uuid);
		}
		const added = [...(await this.createItems(addUuids, { data })), ...(await this.updateItems(updateUuids, { data }))];
		return await this.actor.update({ [`${this.valueKeyPath}.added`]: added }, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		const keyPath = this.storagePath(this.relavantLevel(levels));
		const deleteIds = [];
		const updates = [];
		for (const added of foundry.utils.getProperty(this.value, keyPath) ?? []) {
			if (added.modified)
				updates.push({
					_id: added.document.id,
					...this.configuration.spell.getReverseChanges(added.document, data)
				});
			else deleteIds.push(added.document.id);
		}
		await this.actor.deleteEmbeddedDocuments("Item", deleteIds, { render: false });
		await this.actor.updateEmbeddedDocuments("Item", updates, { render: false });
		return await this.actor.update(
			{
				[`${this.valueKeyPath}.${keyPath.replace(/(\.|^)([\w\d]+)$/, "$1-=$2")}`]: null
			},
			{ render }
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async createItemData(uuid, options = {}) {
		options.changes = foundry.utils.mergeObject(
			this.configuration.spell.getApplyChanges(options.data),
			options.changes ?? {}
		);
		return super.createItemData(uuid, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update existing spells on the actor with the proper flags.
	 * @param {string[]} uuids - Source UUIDs for items to update.
	 * @param {object} [options={}]
	 * @param {object} [options.data] - Data from the advancement process.
	 * @param {boolean} [options.render=false] - Should the update re-render the actor?
	 * @returns {object[]} - Array of data for storing in value.
	 */
	async updateItems(uuids, { data, render = false } = {}) {
		const items = [];
		const updated = [];
		for (const uuid of uuids) {
			const itemID = this.actor.sourcedItems.get(uuid)?.id;
			if (!itemID) continue;
			items.push({ _id: itemID, ...this.configuration.spell.getApplyChanges(data) });
			updated.push({ document: itemID, modified: true, uuid });
		}
		await this.actor.updateEmbeddedDocuments("Item", items, { render });
		return updated;
	}
}

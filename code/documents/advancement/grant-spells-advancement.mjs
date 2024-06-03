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
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	warningKey(levels) {
		return `${this.relativeID}.${levels.class}.no-spellcasting-ability`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareWarnings(levels, notifications) {
		if (this.configuredForLevel(levels)) return;
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`,
			section: "progression",
			level: "warn",
			message: game.i18n.localize("BF.Advancement.GrantSpells.Notification.Ability")
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	configuredForLevel(levels) {
		return this.configuration.spell.ability.size <= 1 || this.value.ability;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data = {}, { initial = false, render = true } = {}) {
		if (initial && this.configuration.spell.ability.size > 1 && !data?.ability) return;
		data.ability ??= this.configuration.spell.ability.first();
		const addUuids = new Set();
		const updateIds = new Set();
		const mode = this.configuration.spell.mode;
		for (const { uuid } of Object.values(this.configuration.pool)) {
			const existing = this.actor.sourcedItems.get(uuid);
			const match = existing?.find(e => e.getFlag("black-flag", "relationship.mode") === mode);
			if (match) updateIds.add(match.id);
			else addUuids.add(uuid);
		}
		const added = [...(await this.createItems(addUuids, { data })), ...(await this.updateItems(updateIds, { data }))];
		return await this.actor.update(
			{
				[this.valueKeyPath]: {
					ability: data.ability,
					[this.storagePath(this.relavantLevel(levels))]: added
				}
			},
			{ render }
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		const keyPath = this.storagePath(this.relavantLevel(levels));
		const deleteIds = [];
		const updates = [];
		for (const added of foundry.utils.getProperty(this.value, keyPath) ?? []) {
			if (!added.document) continue;
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
				[this.valueKeyPath]: {
					ability: null,
					[keyPath.replace(/(\.|^)([\w\d]+)$/, "$1-=$2")]: null
				}
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
	 * @param {string[]} ids - IDs of items to update.
	 * @param {object} [options={}]
	 * @param {object} [options.data] - Data from the advancement process.
	 * @param {boolean} [options.render=false] - Should the update re-render the actor?
	 * @returns {object[]} - Array of data for storing in value.
	 */
	async updateItems(ids, { data, render = false } = {}) {
		const items = [];
		const updated = [];
		for (const id of ids) {
			const item = this.actor.items.get(id);
			const sourceId = item.flags["black-flag"]?.sourceId ?? item._stats.compendiumSource ?? item.flags.core?.sourceId;
			items.push({ _id: id, ...this.configuration.spell.getApplyChanges(data) });
			updated.push({ document: id, modified: true, uuid: sourceId });
		}
		await this.actor.updateEmbeddedDocuments("Item", items, { render });
		return updated;
	}
}

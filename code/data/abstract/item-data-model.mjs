import BaseDataModel from "./base-data-model.mjs";

export default class ItemDataModel extends BaseDataModel {
	/**
	 * @typedef {object} ItemRegistrationConfiguration
	 * @property {boolean} cached - Should a cached version of this item type be made ready?
	 */

	/**
	 * Metadata that describes an item data type.
	 *
	 * @typedef {BaseDataMetadata} ItemDataMetadata
	 * @property {string} [accentColor] - Accent color to use if none is specified by system data.
	 * @property {boolean|ItemRegistrationConfig} [register] - Register all items of this type within the central list.
	 */

	/**
	 * Metadata that describes a type.
	 * @type {ItemDataMetadata}
	 */
	static metadata = {};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tags that should be displayed in chat.
	 * @type {Map<string, string>}
	 */
	get chatTags() {
		return this.parent.chatTags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item type specific scaling increase.
	 * @type {number|null}
	 */
	get scaling() {
		return this.parent.getFlag(game.system.id, "scaling") ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should this Document run final data preparation on its own, or wait for another Document to call those methods?
	 * @type {boolean}
	 */
	get shouldPrepareFinalData() {
		return !this.parent.isEmbedded;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();
		if (this.parent.isEmbedded) {
			const sourceId =
				this.parent.flags["black-flag"]?.sourceId ??
				this.parent._stats.compendiumSource ??
				this.parent.flags.core?.sourceId;
			if (sourceId) {
				if (!this.parent.actor.sourcedItems?.has(sourceId)) {
					this.parent.actor.sourcedItems?.set(sourceId, new Set());
				}
				this.parent.actor.sourcedItems?.get(sourceId).add(this.parent);
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		if (this.shouldPrepareFinalData) this.prepareFinalData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Final data preparation steps performed on Items after parent actor has been fully prepared.
	 */
	prepareFinalData() {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Embeds                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(config, options = {}) {
		if (!foundry.utils.hasProperty(this, "description.value")) return null;
		const description = foundry.utils.getProperty(this, "description.value");
		const enriched = await TextEditor.enrichHTML(description, {
			...options,
			relativeTo: this.parent
		});
		const section = document.createElement("section");
		section.innerHTML = enriched;
		return section.children;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare a data object which defines the data schema used by dice roll commands against this Item.
	 * @param {object} [options]
	 * @param {boolean} [options.deterministic] - Whether to force deterministic values for data properties that could be
	 *                                            either a die term or a flat term.
	 * @returns {object}
	 */
	getRollData(options = {}) {
		if (!this.parent.actor) return {};
		const rollData = { ...this.parent.actor.getRollData(options), item: { ...this } };
		return rollData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Clear "relationship" flags when moved
		if ("_id" in data && !options.keepRelationship) {
			this.parent.updateSource({ "flags.black-flag.-=relationship": null });
		}
	}
}

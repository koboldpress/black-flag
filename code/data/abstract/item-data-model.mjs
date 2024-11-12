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
	 * @property {string} [tooltipTemplate]
	 */

	/**
	 * Metadata that describes a type.
	 * @type {ItemDataMetadata}
	 */
	static metadata = Object.freeze({
		tooltipTemplate: "systems/black-flag/templates/item/item-tooltip.hbs"
	});

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Magical bonus to attacks.
	 * @returns {number|null}
	 */
	get attackMagicalBonus() {
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Modes that can be used when making an attack with this item.
	 * @type {FormSelectOption[]}
	 */
	get attackModes() {
		return [];
	}

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
	 * Magical bonus to damage.
	 * @returns {number|null}
	 */
	get damageMagicalBonus() {
		return this.attackMagicalBonus;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get embeddedDescriptionKeyPath() {
		return "description.value";
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

	/**
	 * Compendium source.
	 * @type {string}
	 */
	get _compendiumSource() {
		return this.parent.flags[game.system.id]?.sourceId ?? this.parent._stats.compendiumSource;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();
		if (this.parent.isEmbedded) {
			const sourceId = this._compendiumSource;
			if (sourceId) {
				if (!this.parent.actor.sourcedItems?.has(sourceId)) {
					this.parent.actor.sourcedItems?.set(sourceId, new Set());
				}
				this.parent.actor.sourcedItems?.get(sourceId).add(this.parent);
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Final data preparation steps performed on Items after parent actor has been fully prepared.
	 */
	prepareFinalData() {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Embeds & Tooltips          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async richTooltip(enrichmentOptions = {}) {
		if (!this.metadata.tooltipTemplate) return null;
		return {
			content: await renderTemplate(this.metadata.tooltipTemplate, await this.getTooltipData(enrichmentOptions)),
			classes: ["black-flag", "black-flag-tooltip", "item-tooltip"]
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch the context used to render this item's rich tooltip.
	 * @param {EnrichmentOptions} enrichmentOptions - Options for text enrichment.
	 * @returns {Promise<object>}
	 */
	async getTooltipData(enrichmentOptions = {}) {
		const description = foundry.utils.getProperty(this, this.embeddedDescriptionKeyPath) ?? "";
		const rollData = this.parent.getRollData();
		const context = {
			item: this.parent,
			description: await TextEditor.enrichHTML(description, {
				rollData,
				relativeTo: this.parent,
				...enrichmentOptions
			}),
			tags: Array.from(this.chatTags.entries())
				.map(([key, label]) => ({ key, label }))
				.filter(t => t.label)
		};
		return context;
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
		const rollData = { ...(this.parent.actor?.getRollData(options) ?? {}), item: { ...this } };
		return rollData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any type-specific preparation on the activity activation chat context.
	 * @param {object} context - Rendering context being prepared.
	 */
	async prepareActivationChatContext(context) {}

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

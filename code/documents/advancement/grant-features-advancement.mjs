import GrantFeaturesConfig from "../../applications/advancement/grant-features-config.mjs";
import { GrantFeaturesConfigurationData, GrantFeaturesValueData } from "../../data/advancement/grant-features-data.mjs";
import { linkForUUID } from "../../utils/document.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that automatically gives the player a set of features.
 */
export default class GrantFeaturesAdvancement extends Advancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "grantFeatures",
			dataModels: {
				configuration: GrantFeaturesConfigurationData,
				value: GrantFeaturesValueData
			},
			order: 40,
			icon: "systems/black-flag/artwork/advancement/grant-features.svg",
			title: game.i18n.localize("BF.Advancement.GrantFeatures.Title"),
			hint: game.i18n.localize("BF.Advancement.GrantFeatures.Hint"),
			apps: {
				config: GrantFeaturesConfig
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item types that can be granted by this advancement.
	 * @type {Set<string>}
	 */
	static VALID_TYPES = new Set(["feature"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	configuredForLevel(level) {
		return !foundry.utils.isEmpty(this.value.added);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	summaryForLevel(level, { flow=false }={}) {
		// Link to compendium items
		if ( !flow || !this.configuredForLevel(level) ) {
			return this.configuration.pool.reduce((html, item) => html + linkForUUID(item.uuid), " ");
		}

		// Link to items on the actor
		return this.value.added.map(data =>
			data.document?.toAnchor({classes: ["content-link"]}).outerHTML ?? " "
		).join("");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Location where the added items are stored for the specified level.
	 * @param {number} level - Level being advanced.
	 * @returns {string}
	 */
	storagePath(level) {
		return "added";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create items on the actor with the proper flags.
	 * @param {string[]} uuids - UUIDs of items to create.
	 * @param {object[]} [existing] - Existing granted items.
	 * @returns {object[]} - Array of data for storing in value.
	 */
	async createItems(uuids, existing) {
		const items = [];
		const added = existing ?? [];
		for ( const uuid of uuids ) {
			const source = await fromUuid(uuid);
			if ( !source ) continue;
			const id = foundry.utils.randomID();
			items.push(source.clone({
				_id: id,
				folder: null,
				sort: null,
				"flags.black-flag.sourceId": uuid,
				"flags.black-flag-advancementOrigin": `${this.item.id}.${this.id}`
			}, {keepId: true}).toObject());
			added.push({ document: id, uuid });
		}
		await this.actor.createEmbeddedDocuments("Item", items, {keepId: true, render: false});
		return added;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async apply(levels, data, { initial=false }={}) {
		const added = await this.createItems(Object.values(this.configuration.pool).map(d => d.uuid));
		// TODO: Choose character or class level depending on item type
		return await this.actor.update({[`${this.valueKeyPath}.${this.storagePath(levels.character)}`]: added});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async reverse(levels) {
		// TODO: Choose character or class level depending on item type
		const keyPath = this.storagePath(levels.character);
		const deleteIds = (foundry.utils.getProperty(this.value, keyPath) ?? []).map(d => d.document.id);
		await this.actor.deleteEmbeddedDocuments("Item", deleteIds, {render: false});
		return await this.actor.update({[`${this.valueKeyPath}.${keyPath.replace(/(\.|^)([\w\d]+)$/, "$1-=$2")}`]: null});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Verify that the provided item can be used with this advancement based on the configuration.
	 * @param {BlackFlagItem} item - Item that needs to be tested.
	 * @param {object} config
	 * @param {boolean} [config.strict=true] - Should an error be thrown when an invalid type is encountered?
	 * @returns {boolean} - Is this type valid?
	 * @throws An error if the item is invalid and strict is `true`.
	 */
	_validateItemType(item, { strict=true }={}) {
		if ( this.constructor.VALID_TYPES.has(item.type) ) return true;
		const type = game.i18n.localize(CONFIG.Item.typeLabels[item.type]);
		if ( strict ) throw new Error(game.i18n.format("BF.Advancement.Config.Warning.Invalid", { type }));
		return false;
	}
}

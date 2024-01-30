import { GrantFeaturesConfigurationData, GrantFeaturesValueData } from "../../data/advancement/grant-features-data.mjs";
import { linkForUUID } from "../../utils/document.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that automatically gives the player a set of features.
 */
export default class GrantFeaturesAdvancement extends Advancement {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "grantFeatures",
		dataModels: {
			configuration: GrantFeaturesConfigurationData,
			value: GrantFeaturesValueData
		},
		order: 40,
		icon: "systems/black-flag/artwork/advancement/grant-features.svg",
		title: "BF.Advancement.GrantFeatures.Title",
		hint: "BF.Advancement.GrantFeatures.Hint"
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item types that can be granted by this advancement.
	 * @type {Set<string>}
	 */
	static VALID_TYPES = new Set(["feature"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	configuredForLevel(levels) {
		return !foundry.utils.isEmpty(this.value.added);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async toEmbedContents(config, options) {
		if ( config.list === false ) return super.toEmbedContents(config, options);

		const list = config.style === "list";
		const h = list ? "strong" : config.header ?? "h6";

		const features = await Promise.all(this.configuration.pool.map(async f => {
			const item = await fromUuid(f.uuid);
			return [item, await TextEditor.enrichHTML(item.system.description.value, {
				...options, relativeTo: this, _embedDepth: (options._embedDepth ?? 0) + 1, async: true
			})];
		}));

		const container = document.createElement(list ? "ul" : "section");
		container.classList = config.classes ?? "embedded-features";
		for ( const [item, description] of features ) {
			const entry = document.createElement(list ? "li" : "div");
			const header = config.link ? `<a class="content-link" data-uuid="${item.uuid}">${item.name}</a>` : item.name;
			entry.innerHTML = `<${h}>${header}</${h}>\n${description}`;
			container.insertAdjacentElement("beforeend", entry);
		}

		return container;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	summaryForLevel(levels, { flow=false }={}) {
		// Link to compendium items
		if ( !flow || !this.configuredForLevel(this.relavantLevel(levels)) ) return this.configuration.pool.map(item =>
			`<span class="choice-entry">${linkForUUID(item.uuid)}</span>`
		).join(" ");

		// Link to items on the actor
		return this.value.added.map(data =>
			`<span class="choice-entry">${data.document?.toAnchor({classes: ["content-link"]}).outerHTML ?? " "}</span>`
		).join(" ");
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
	 * @param {object} [options={}]
	 * @param {boolean} [options.render=false] - Should the update re-render the actor?
	 * @returns {object[]} - Array of data for storing in value.
	 */
	async createItems(uuids, existing, { render=false }={}) {
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
		await this.actor.createEmbeddedDocuments("Item", items, {keepId: true, render});
		return added;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async apply(levels, data, { initial=false, render=true }={}) {
		const added = await this.createItems(Object.values(this.configuration.pool).map(d => d.uuid));
		return await this.actor.update({
			[`${this.valueKeyPath}.${this.storagePath(this.relavantLevel(levels))}`]: added
		}, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async reverse(levels, data, { render=true }={}) {
		const keyPath = this.storagePath(this.relavantLevel(levels));
		const deleteIds = (foundry.utils.getProperty(this.value, keyPath) ?? []).map(d => d.document.id);
		await this.actor.deleteEmbeddedDocuments("Item", deleteIds, {render: false});
		return await this.actor.update({
			[`${this.valueKeyPath}.${keyPath.replace(/(\.|^)([\w\d]+)$/, "$1-=$2")}`]: null
		}, { render });
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

import PhysicalTemplate from "../data/item/templates/physical-template.mjs";
import { slugify } from "../utils/text.mjs";
import DocumentMixin from "./mixins/document.mjs";
import NotificationsCollection from "./notifications.mjs";

export default class BlackFlagItem extends DocumentMixin(Item) {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Accent color used for certain parts of the UI.
	 * @type {string}
	 */
	get accentColor() {
		if ( this.system.color ) return this.system.color;
		return this.system.metadata?.accentColor ?? "var(--bf-blue);";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item that contains this item, if it is in a container. Returns a promise if the item is located
	 * in a compendium pack.
	 * @type {BlackFlagItem|Promise<BlackFlagItem>|void}
	 */
	get container() {
		if ( !this.system.container ) return;
		if ( this.isEmbedded ) return this.actor.items.get(this.system.container);
		if ( this.pack ) return game.packs.get(this.pack).getDocument(this.system.container);
		return game.items.get(this.system.container);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this item currently enabled? Non-enabled items won't display in the actions list.
	 * @type {boolean}
	 */
	get enabled() {
		return this.flags["black-flag"]?.relationship?.enabled !== false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get identifier() {
		if ( this.system.identifier?.value ) return this.system.identifier.value;
		return slugify(this.name, {strict: true});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Collection of notifications that should be displayed on the actor sheet.
	 */
	notifications = this.notifications;

	/* <><><><> <><><><> <><><><> <><><><> */

	get pseudoDocumentHierarchy() {
		const hierarchy = {};
		for ( const [fieldName, field] of this.system.schema.entries() ) {
			if ( field.constructor.hierarchical ) hierarchy[fieldName] = field;
		}
		Object.defineProperty(this, "pseudoDocumentHierarchy", {value: Object.freeze(hierarchy), writable: false});
		return this.pseudoDocumentHierarchy;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		this.notifications = new NotificationsCollection();
		super.prepareData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedDocuments() {
		super.prepareEmbeddedDocuments();
		for ( const collectionName of Object.keys(this.pseudoDocumentHierarchy ?? {}) ) {
			for ( const e of this.getEmbeddedCollection(collectionName) ) {
				e.prepareData();
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get advancement for this item.
	 * @param {number|AdvancementLevels} levels - Level for which to get the advancement.
	 * @yields {Advancement}
	 */
	*advancementForLevel(levels=0) {
		if ( foundry.utils.getType(levels) === "number" ) {
			for ( const advancement of this.system.advancement?.byLevel(levels) ?? [] ) {
				yield advancement;
			}
		} else {
			for ( const advancement of this.system.advancement ?? [] ) {
				const level = advancement.relavantLevel(levels);
				if ( advancement.levels.includes(level) ) yield advancement;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async deleteDialog(options={}) {
		// Display custom delete dialog when deleting a container with contents
		const count = await this.system.contentsCount;
		if ( count ) {
			return Dialog.confirm({
				title: `${game.i18n.format("DOCUMENT.Delete", {
					type: game.i18n.localize("BF.Item.Type.Container[one]")
				})}: ${this.name}`,
				content: `<h4>${game.i18n.localize("AreYouSure")}</h4>
					<p>${game.i18n.format("BF.Container.Delete.Message", {count})}</p>
					<label>
						<input type="checkbox" name="deleteContents">
						${game.i18n.localize("BF.Container.Delete.Contents")}
					</label>`,
				yes: html => {
					const deleteContents = html.querySelector('[name="deleteContents"]').checked;
					this.delete({ deleteContents });
				},
				options: { ...options, jQuery: false }
			});
		}

		return super.deleteDialog(options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getRollData({ deterministic=false }={}) {
		if ( !this.actor ) return {};
		const actorRollData = this.actor.getRollData({ deterministic });
		const rollData = {
			...actorRollData,
			item: this.toObject(false).system
		};

		const abilityKey = this.system.ability;
		if ( abilityKey && ("abilities" in rollData) ) {
			rollData.mod = rollData.abilities[abilityKey]?.mod ?? 0;
		}

		return rollData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Embedded Operations         */
	/* <><><><> <><><><> <><><><> <><><><> */

	static getCollectionName(name) {
		if ( name === "Activity" ) name = "activities";
		if ( name === "Advancement" ) name = "advancement";
		if ( ["activities", "advancement"].includes(name) ) return name;
		return super.getCollectionName(name);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getEmbeddedCollection(embeddedName) {
		const collectionName = this.constructor.getCollectionName(embeddedName);
		const field = this.pseudoDocumentHierarchy[collectionName];
		return field ? this.system[collectionName] : super.getEmbeddedCollection(embeddedName);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare creation data for the provided items and any items contained within them. The data created by this method
	 * can be passed to `createDocuments` with `keepId` always set to true to maintain links to container contents.
	 * @param {BlackFlagItem[]} items - Items to create.
	 * @param {object} [context={}] - Context for the item's creation.
	 * @param {BlackFlagItem} [context.container] - Container in which to create the item.
	 * @param {boolean} [context.keepId=false] - Should IDs be maintained?
	 * @param {Function} [context.transformAll] - Method called on provided items and their contents.
	 * @param {Function} [context.transformFirst] - Method called only on provided items.
	 * @returns {Promise<object[]>} - Data for items to be created.
	 */
	static async createWithContents(items, { container, keepId=false, transformAll, transformFirst }={}) {
		let depth = 0;
		if ( container ) {
			depth = 1 + (await container.system.allContainers()).length;
			if ( depth > PhysicalTemplate.MAX_DEPTH ) {
				ui.notifications.warn(game.i18n.format("BF.Container.Warning.MaxDepth", { depth: PhysicalTemplate.MAX_DEPTH }));
				return;
			}
		}

		const createItemData = async (item, containerId, depth) => {
			let newItemData = transformAll ? await transformAll(item) : item;
			if ( transformFirst && (depth === 0) ) newItemData = await transformFirst(newItemData);
			if ( !newItemData ) return;
			if ( newItemData instanceof Item ) newItemData = newItemData.toObject();
			foundry.utils.mergeObject(newItemData, {"system.container": containerId} );
			if ( !keepId ) newItemData._id = foundry.utils.randomID();

			created.push(newItemData);

			const contents = await item.system.contents;
			if ( contents && (depth < PhysicalTemplate.MAX_DEPTH) ) {
				for ( const doc of contents ) await createItemData(doc, newItemData._id, depth + 1);
			}
		};

		const created = [];
		for ( const item of items ) await createItemData(item, container?.id, depth);
		return created;
	}
}

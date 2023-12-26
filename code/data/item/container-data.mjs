import ContainerSheet from "../../applications/item/container-sheet.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import { PhysicalTemplate } from "./templates/_module.mjs";

const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Container items.
 * @mixes PhysicalTemplate
 */
export default class ContainerData extends ItemDataModel.mixin(PhysicalTemplate) {

	static get metadata() {
		return {
			type: "container",
			category: "equipment",
			localization: "BF.Item.Type.Container",
			icon: "fa-solid fa-box-open",
			sheet: {
				application: ContainerSheet,
				label: "BF.Sheet.Default.Container"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			// type: new SchemaField({
			// 	value: new StringField({initial: "melee", label: "BF.Weapon.Type.Label"}),
			// 	category: new StringField({label: "BF.Equipment.Category.Label"}),
			// 	base: new StringField({label: "BF.Equipment.Base.Label"})
			// }),
			properties: new SetField(new StringField(), {
				label: "BF.Property.Label[other]"
			}),
			capacity: new SchemaField({
				count: new NumberField({min: 0, integer: true}),
				volume: new SchemaField({
					value: new NumberField({min: 0}),
					units: new StringField({initial: "foot"}) // Represents cubic feet
				}),
				weight: new SchemaField({
					value: new NumberField({min: 0}),
					units: new StringField({initial: "pound"})
				})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	// TODO: Temp patch until currency is properly added
	get currencyWeight() { return 0; }

	/**
	 * Get all of the items contained in this container. A promise if item is within a compendium.
	 * @type {Collection<BlackFlagItem>|Promise<Collection<BlackFlagItem>>}
	 */
	get contents() {
		if ( !this.parent ) return new foundry.utils.Collection();

		// If in a compendium, fetch using getDocuments and return a promise
		if ( this.parent.pack && !this.parent.isEmbedded ) {
			const pack = game.packs.get(this.parent.pack);
			return pack.getDocuments({system: { container: this.parent.id }}).then(d =>
				new foundry.utils.Collection(d.map(d => [d.id, d]))
			);
		}

		// Otherwise use local document collection
		return (this.parent.isEmbedded ? this.parent.actor.items : game.items).reduce((collection, item) => {
			if ( item.system.container === this.parent.id ) collection.set(item.id, item);
			return collection;
		}, new foundry.utils.Collection());
	}

	/* -------------------------------------------- */

	/**
	 * Get all of the items in this container and any sub-containers. A promise if item is within a compendium.
	 * @type {Collection<BlackFlagItem>|Promise<Collection<BlackFlagItem>>}
	 */
	get allContainedItems() {
		if ( !this.parent ) return new foundry.utils.Collection();
		if ( this.parent.pack ) return this.#allContainedItems();

		return this.contents.reduce((collection, item) => {
			collection.set(item.id, item);
			if ( item.type === "container" ) item.system.allContainedItems.forEach(i => collection.set(i.id, i));
			return collection;
		}, new foundry.utils.Collection());
	}

	/**
	 * Asynchronous helper method for fetching all contained items from a compendium.
	 * @returns {Promise<Collection<BlackFlagItem>>}
	 */
	async #allContainedItems() {
		return (await this.contents).reduce(async (promise, item) => {
			const collection = await promise;
			collection.set(item.id, item);
			if ( item.type === "container" ) (await item.system.allContainedItems).forEach(i => collection.set(i.id, i));
			return collection;
		}, new foundry.utils.Collection());
	}

	/* -------------------------------------------- */

	/**
	 * Fetch a specific contained item.
	 * @param {string} id - ID of the item to fetch.
	 * @returns {BlackFlagItem|Promise<BlackFlagItem>} - Item if found.
	 */
	getContainedItem(id) {
		if ( this.parent?.isEmbedded ) return this.parent.actor.items.get(id);
		if ( this.parent?.pack ) return game.packs.get(this.parent.pack)?.getDocument(id);
		return game.items.get(id);
	}

	/* -------------------------------------------- */

	/**
	 * Number of items contained in this container including items in sub-containers. Result is a promise if item
	 * is within a compendium.
	 * @type {number|Promise<number>}
	 */
	get contentsCount() {
		const reducer = (count, item) => count + item.system.quantity;
		const items = this.allContainedItems;
		if ( items instanceof Promise ) return items.then(items => items.reduce(reducer, 0));
		return items.reduce(reducer, 0);
	}

	/* -------------------------------------------- */

	/**
	 * Weight of the items in this container. Result is a promise if item is within a compendium.
	 * @type {number|Promise<number>}
	 */
	get contentsWeight() {
		if ( this.parent?.pack && !this.parent?.isEmbedded ) return this.#contentsWeight();
		return this.contents.reduce((weight, item) => weight + item.system.totalWeight, this.currencyWeight);
	}

	/**
	 * Asynchronous helper method for calculating the weight of items in a compendium.
	 * @returns {Promise<number>}
	 */
	async #contentsWeight() {
		const contents = await this.contents;
		return contents.reduce(async (weight, item) => await weight + await item.system.totalWeight, this.currencyWeight);
	}

	/* -------------------------------------------- */

	/**
	 * The weight of this container with all of its contents. Result is a promise if item is within a compendium.
	 * @type {number|Promise<number>}
	 */
	get totalWeight() {
		if ( this.properties.has("weightlessContents") ) return this.weight.value;
		const containedWeight = this.contentsWeight;
		if ( containedWeight instanceof Promise ) return containedWeight.then(c => this.weight.value + c);
		return this.weight.value + containedWeight;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseQuantity() {
		this.quantity = 1;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onUpdateFolder(changed, options, userId) {
		// Keep contents folder synchronized with container
		if ( (game.user.id === userId) && foundry.utils.hasProperty(changed, "folder") ) {
			const contents = await this.contents;
			await Item.updateDocuments(contents.map(c => ({ _id: c.id, folder: changed.folder })), {
				parent: this.parent.parent, pack: this.parent.pack, ...options, render: false
			});
		}
	}
}

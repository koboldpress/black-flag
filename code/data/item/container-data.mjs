import ContainerSheet from "../../applications/item/container-sheet.mjs";
import { convertWeight, defaultUnit } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import IdentifiableTemplate from "./templates/identifiable-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Container items.
 * @mixes {DescriptionTemplate}
 * @mixes {IdentifiableTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 *
 * @property {object} capacity
 * @property {number} capacity.count - Number if items that can be stored within.
 * @property {object} capacity.volume
 * @property {number} capacity.volume.value - Limit on the internal volume of the container.
 * @property {string} capacity.volume.unit - Units used to measure the volume.
 * @property {object} capacity.weight
 * @property {number} capacity.weight.value - Limit on the weight of the contained items.
 * @property {string} capacity.weight.unit - Units used to measure the weight.
 */
export default class ContainerData extends ItemDataModel.mixin(
	DescriptionTemplate,
	IdentifiableTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.IDENTIFIABLE", "BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "container",
				category: "equipment",
				legacyMixin: false,
				localization: "BF.Item.Type.Container",
				icon: "fa-solid fa-box-open",
				img: "systems/black-flag/artwork/types/container.svg",
				hasEffects: false,
				sheet: {
					application: ContainerSheet,
					label: "BF.Sheet.Default.Container"
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			capacity: new SchemaField(
				{
					count: new NumberField({ min: 0, integer: true, label: "BF.Container.Capacity.Number.Label" }),
					volume: new SchemaField(
						{
							value: new NumberField({ min: 0, label: "BF.Volume.Label" }),
							unit: new StringField({
								required: true,
								blank: false,
								initial: () => defaultUnit("volume"),
								label: "BF.UNITS.VOLUME.Label"
							})
						},
						{ label: "BF.Container.Capacity.Volume.Label" }
					),
					weight: new SchemaField(
						{
							value: new NumberField({ min: 0, label: "BF.Weight.Label" }),
							unit: new StringField({
								required: true,
								blank: false,
								initial: () => defaultUnit("weight"),
								label: "BF.UNITS.WEIGHT.Label"
							})
						},
						{ label: "BF.Container.Capacity.Weight.Label" }
					)
				},
				{ label: "BF.Container.Capacity.Label" }
			)
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get chatTags() {
		const tags = this.parent.chatTags;
		this.setPhysicalChatTags(tags);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get all of the items contained in this container. A promise if item is within a compendium.
	 * @type {Collection<BlackFlagItem>|Promise<Collection<BlackFlagItem>>}
	 */
	get contents() {
		if (!this.parent) return new foundry.utils.Collection();

		// If in a compendium, fetch using getDocuments and return a promise
		if (this.parent.pack && !this.parent.isEmbedded) {
			const pack = game.packs.get(this.parent.pack);
			return pack
				.getDocuments({ system: { container: this.parent.id } })
				.then(d => new foundry.utils.Collection(d.map(d => [d.id, d])));
		}

		// Otherwise use local document collection
		return (this.parent.isEmbedded ? this.parent.actor.items : game.items).reduce((collection, item) => {
			if (item.system.container === this.parent.id) collection.set(item.id, item);
			return collection;
		}, new foundry.utils.Collection());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get all of the items in this container and any sub-containers. A promise if item is within a compendium.
	 * @type {Collection<BlackFlagItem>|Promise<Collection<BlackFlagItem>>}
	 */
	get allContainedItems() {
		if (!this.parent) return new foundry.utils.Collection();
		if (this.parent.pack) return this.#allContainedItems();

		return this.contents.reduce((collection, item) => {
			collection.set(item.id, item);
			if (item.type === "container") item.system.allContainedItems.forEach(i => collection.set(i.id, i));
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
			if (item.type === "container") (await item.system.allContainedItems).forEach(i => collection.set(i.id, i));
			return collection;
		}, new foundry.utils.Collection());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch a specific contained item.
	 * @param {string} id - ID of the item to fetch.
	 * @returns {BlackFlagItem|Promise<BlackFlagItem>} - Item if found.
	 */
	getContainedItem(id) {
		if (this.parent?.isEmbedded) return this.parent.actor.items.get(id);
		if (this.parent?.pack) return game.packs.get(this.parent.pack)?.getDocument(id);
		return game.items.get(id);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Number of items contained in this container including items in sub-containers. Result is a promise if item
	 * is within a compendium.
	 * @type {number|Promise<number>}
	 */
	get contentsCount() {
		const reducer = (count, item) => count + item.system.quantity;
		const items = this.allContainedItems;
		if (items instanceof Promise) return items.then(items => items.reduce(reducer, 0));
		return items.reduce(reducer, 0);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Weight of the items in this container. Result is a promise if item is within a compendium.
	 * @type {number|Promise<number>}
	 */
	get contentsWeight() {
		if (this.parent?.pack && !this.parent?.isEmbedded) return this.#contentsWeight();
		return this.contents.reduce(
			(weight, item) =>
				weight +
				convertWeight(item.system.totalWeight, item.system.weight.unit, { legacy: false, to: this.weight.unit }).value,
			0
		);
	}

	/**
	 * Asynchronous helper method for calculating the weight of items in a compendium.
	 * @returns {Promise<number>}
	 */
	async #contentsWeight() {
		const contents = await this.contents;
		return contents.reduce(
			async (weight, item) =>
				(await weight) +
				convertWeight(await item.system.totalWeight, item.system.weight.unit, { legacy: false, to: this.weight.unit })
					.value,
			0
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The weight of this container with all of its contents. Result is a promise if item is within a compendium.
	 * @type {number|Promise<number>}
	 */
	get totalWeight() {
		if (this.properties.has("weightlessContents")) return this.weight.value;
		const containedWeight = this.contentsWeight;
		if (containedWeight instanceof Promise) return containedWeight.then(c => this.weight.value + c);
		return this.weight.value + containedWeight;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		source = super.migrateData(source);
		this._migrateSource(source);
		this._migrateWeightUnits(source);

		// Added in 2.0.068
		this._migrateObjectUnits(source.capacity?.volume);
		this._migrateObjectUnits(source.capacity?.weight);

		return source;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();
		this._shimObjectUnits("capacity.volume");
		this._shimObjectUnits("capacity.weight");
		this._shimWeightUnits();
		this.quantity = 1;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.prepareDescription();
		this.prepareIdentifiable();
		this.preparePhysicalLabels();
		this.type ??= {};
		this.type.label = game.i18n.localize("BF.Item.Gear.Category.WondrousItem");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		this._onCreatePhysicalItem(data, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preUpdate(changes, options, user) {
		if ((await super._preUpdate(changes, options, user)) === false) return false;
		await this._preUpdateIdentifiable(changes, options, user);
		await this._preUpdatePhysicalItem(changes, options, user);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onUpdate(changed, options, userId) {
		await super._onUpdate(changed, options, userId);
		this._onUpdatePhysicalItem(changed, options, userId);

		// Keep contents folder synchronized with container
		if (game.user.id === userId && foundry.utils.hasProperty(changed, "folder")) {
			const contents = await this.contents;
			await Item.updateDocuments(
				contents.map(c => ({ _id: c.id, folder: changed.folder })),
				{
					parent: this.parent.parent,
					pack: this.parent.pack,
					...options,
					render: false
				}
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDelete(options, userId) {
		await super._onDelete(options, userId);
		this._onDeletePhysicalItem(options, userId);
		if (userId !== game.user.id || !options.deleteContents) return;

		// Delete a container's contents when it is deleted
		const contents = await this.allContainedItems;
		if (contents?.size)
			await Item.deleteDocuments(Array.from(contents.map(i => i.id)), {
				pack: this.parent.pack,
				parent: this.parent.parent
			});
	}
}

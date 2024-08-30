import { convertWeight, numberFormat } from "../../../utils/_module.mjs";

const { ForeignDocumentField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for Physical items.
 *
 * @property {object} attunement
 * @property {string} attunement.requirement - Other conditions of attunement.
 * @property {string} attunement.value - Type of attunement (none, required, optional).
 * @property {string} container - Container within which this item resides.
 * @property {object} price
 * @property {number} price.value - Base price for this item.
 * @property {string} price.denomination - Currency denomination used for the price.
 * @property {number} quantity - Number of this item in a stack.
 * @property {string} rarity - Rarity level of a magic item, blank for mundane items.
 * @property {object} weight
 * @property {number} weight.value - Item's weight.
 * @property {string} weight.units - Units used to measure item's weight.
 */
export default class PhysicalTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			attunement: new SchemaField({
				requirement: new StringField({ label: "BF.Attunement.Requirement.Label" }),
				value: new StringField({ label: "BF.Attunement.Type.Label" })
			}, {label: "BF.Attunement.Label"}),
			container: new ForeignDocumentField(foundry.documents.BaseItem, {
				idOnly: true, label: "BF.Item.Type.Container[one]"
			}),
			price: new SchemaField({
				value: new NumberField({
					nullable: false, initial: 0, min: 0, step: 0.01, label: "BF.Price.Label"
				}),
				denomination: new StringField({
					blank: false, initial: "gp", label: "BF.Currency.Denomination.Label"
				})
			}, {label: "BF.Price.Label"}),
			quantity: new NumberField({
				nullable: false, initial: 1, min: 0, integer: true, label: "BF.Quantity.Label"
			}),
			rarity: new StringField({label: "BF.Rarity.Label"}),
			weight: new SchemaField({
				value: new NumberField({
					nullable: false, initial: 0, min: 0, step: 0.01, label: "BF.Weight.Label"
				}),
				units: new StringField({initial: "pound"})
			}, {label: "BF.Weight.Label"})
		};
	}

	/* -------------------------------------------- */

	/**
	 * Maximum depth items can be nested in containers.
	 * @type {number}
	 */
	static MAX_DEPTH = 5;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can this item be attuned?
	 * @type {boolean}
	 */
	get attunable() {
		return !!this.attunement.value;
	}

	/**
	 * Is this item attuned?
	 * @type {boolean}
	 */
	get attuned() {
		if ( !this.attunable || (this.parent.actor?.type !== "pc") ) return false;
		return this.parent.getFlag("black-flag", "relationship.attuned") === true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get displayActions() {
		return this.equipped;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can this item be equipped?
	 * @type {boolean}
	 */
	get equippable() {
		return true;
	}

	/**
	 * Is this item equipped?
	 * @type {boolean}
	 */
	get equipped() {
		if ( !this.parent.actor ) return false;
		if ( !this.equippable || this.parent.actor?.type !== "pc" ) return true;
		return this.parent.getFlag(game.system.id, "relationship.equipped") === true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this a physical item?
	 * @type {boolean}
	 */
	get isPhysical() {
		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Are the magical properties of this item currently available?
	 * @type {boolean}
	 */
	get magicAvailable() {
		const attunement = this.attunement.value !== "required" || this.parent.actor?.type !== "pc"
			|| this.parent.getFlag(game.system.id, "relationship.attuned") === true;
		const property = !this.properties || ("magical" in this.validProperties && this.properties.has("magical"));
		return attunement && property;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The price of all of the items in an item stack.
	 * @type {number}
	 */
	get totalPrice() {
		return this.quantity * this.price.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The weight of all of the items in an item stack.
	 * @type {number}
	 */
	get totalWeight() {
		return this.quantity * this.weight.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare labels for physical items.
	 * Should be called during the `prepareDerivedData` stage.
	 */
	preparePhysicalLabels() {
		const system = this;
		if ( this.price ) Object.defineProperty(this.price, "label", {
			get() {
				if ( !system.totalPrice ) return "—";
				const denominationConfig = CONFIG.BlackFlag.currencies[this.denomination];
				return game.i18n.format("BF.Currency.Display", {
					value: numberFormat(system.totalPrice), denomination: game.i18n.localize(denominationConfig.abbreviation)
				});
				// TODO: Adjust total displayed to use smallest logical units (so 5 cp x 20 = 100 cp => 1 gp)
			},
			configurable: true,
			enumerable: false
		});
		Object.defineProperty(this.weight, "label", {
			get() {
				const totalWeight = system.totalWeight;
				if ( totalWeight instanceof Promise || !totalWeight ) return "—";
				return numberFormat(system.totalWeight.toNearest(0.1), { unit: this.units });
				// TODO: Reduce to units in current system that result in the smallest value
			},
			configurable: true,
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Trigger a render on all sheets for items within which this item is contained.
	 * @param {object} [options={}]
	 * @param {string} [options.formerContainer] - UUID of the former container if this item was moved.
	 * @param {object} [options.rendering] - Additional rendering options.
	 * @protected
	 */
	async _renderContainers({ formerContainer, ...rendering }={}) {
		// Render this item's container & any containers it is within
		const parentContainers = await this.allContainers();
		parentContainers.forEach(c => c.sheet?.render(false, rendering));

		// Render the actor sheet, compendium, or sidebar
		if ( this.parent.isEmbedded ) this.parent.actor.sheet?.render(false, rendering);
		else if ( this.parent.pack ) game.packs.get(this.parent.pack).apps.forEach(a => a.render(false, rendering));
		else ui.sidebar.tabs.items.render(false, rendering);

		// Render former container if it was moved between containers
		if ( formerContainer ) {
			const former = await fromUuid(formerContainer);
			former.render(false, rendering);
			former.system._renderContainers(rendering);
		}
	}

	/* -------------------------------------------- */

	async _preUpdate(changed, options, user) {
		if ( foundry.utils.hasProperty(changed, "system.container") ) {
			options.formerContainer = (await this.parent.container)?.uuid;
		}
	}

	/* -------------------------------------------- */

	_onCreatePhysicalItem(data, options, userId) {
		this._renderContainers();
	}

	/* -------------------------------------------- */

	_onUpdatePhysicalItem(changed, options, userId) {
		this._renderContainers({ formerContainer: options.formerContainer });
	}

	/* -------------------------------------------- */

	_onDeletePhysicalItem(options, userId) {
		this._renderContainers();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * All of the containers this item is within up to the parent actor or collection.
	 * @returns {Promise<BlackFlagItem[]>}
	 */
	async allContainers() {
		let item = this.parent;
		let container;
		let depth = 0;
		const containers = [];
		while ( (container = await item.container) && (depth < PhysicalTemplate.MAX_DEPTH) ) {
			containers.push(container);
			item = container;
			depth++;
		}
		return containers;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set the equipped and attuned chat tags.
	 * @param {Map<string, string>} tags - Tags map to set.
	 */
	setPhysicalChatTags(tags) {
		if ( this.attuned ) tags.set("attuned", game.i18n.localize("BF.Attunement.Attuned"));
		else if ( this.attunement.value === "required" ) {
			tags.set("attuned", game.i18n.localize("BF.Attunement.Type.Required"));
		}
		if ( this.equipped ) tags.set("equipped", game.i18n.localize("BF.Item.Equipped"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate the total weight and return it in specific units.
	 * @param {string} units - Units in which the weight should be returned.
	 * @returns {number|Promise<number>}
	 */
	totalWeightIn(units) {
		const weight = this.totalWeight;
		if ( weight instanceof Promise ) return weight.then(w => convertWeight(w, this.weight.units, units));
		return convertWeight(weight, this.weight.units, units);
	}
}

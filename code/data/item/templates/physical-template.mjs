import { convertAmount, convertWeight, defaultUnit, formatWeight, formatNumber } from "../../../utils/_module.mjs";

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
 * @property {string} weight.unit - Units used to measure item's weight.
 */
export default class PhysicalTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			attunement: new SchemaField({
				requirement: new StringField({ label: "BF.Attunement.Requirement" }),
				value: new StringField({ label: "BF.Attunement.Type.Label" })
			}, { label: "BF.Attunement.Label" }),
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
			}, { label: "BF.Price.Label" }),
			quantity: new NumberField({
				nullable: false, initial: 1, min: 0, integer: true, label: "BF.Quantity.Label"
			}),
			rarity: new StringField({ label: "BF.Rarity.Label" }),
			weight: new SchemaField({
				value: new NumberField({
					nullable: false, initial: 0, min: 0, step: 0.01, label: "BF.Weight.Label"
				}),
				unit: new StringField({ required: true, blank: false, initial: () => defaultUnit("weight") })
			}, { label: "BF.Weight.Label" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

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

	/**
	 * Should this item's actions be displayed on the actor sheet?
	 * @type {boolean}
	 */
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
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate weight `units` to `unit`.
	 * Added in 2.0.068
	 * @param {object} source - Candidate source data to migrate.
	 */
	static _migrateWeightUnits(source) {
		this._migrateObjectUnits(source.weight);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Data Shims             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply shims to weight units.
	 */
	_shimWeightUnits() {
		this._shimObjectUnits("weight");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare labels for physical items.
	 * Should be called during the `prepareDerivedData` stage.
	 */
	preparePhysicalLabels() {
		const data = this;
		if ( this.price ) Object.defineProperty(this.price, "label", {
			get() {
				if ( !data.totalPrice ) return "—";
				const denominationConfig = CONFIG.BlackFlag.currencies[this.denomination];
				return _loc("BF.Currency.Display", {
					value: formatNumber(data.totalPrice), denomination: _loc(denominationConfig.abbreviation)
				});
				// TODO: Adjust total displayed to use smallest logical unit (so 5 cp x 20 = 100 cp => 1 gp)
			},
			configurable: true,
			enumerable: false
		});
		convertAmount(this.weight, "weight");
		Object.defineProperty(this.weight, "label", {
			get() {
				const totalWeight = data.totalWeight;
				if ( totalWeight instanceof Promise || !totalWeight ) return "—";
				return formatWeight(data.totalWeight.toNearest(0.1), this.unit, { unitDisplay: "short" });
				// TODO: Reduce to unit in current system that result in the smallest value
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
		parentContainers.forEach(c => {
			if ( c.sheet?.rendered ) c.sheet?.render(false, { ...rendering })
		});
		if ( !parentContainers.length && !formerContainer ) return;

		// Render the actor sheet, compendium, or sidebar
		if ( this.parent.isEmbedded && this.parent.actor.sheet?.rendered ) {
			this.parent.actor.sheet?.render(false, { ...rendering });
		}
		else if ( this.parent.pack ) game.packs.get(this.parent.pack).apps.forEach(a => a.render(false, { ...rendering }));
		else ui.items.render(false, { ...rendering });

		// Render former container if it was moved between containers
		if ( formerContainer ) {
			const former = await fromUuid(formerContainer);
			former.render(false, { ...rendering });
			former.system._renderContainers(rendering);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle re-rendering containers when an item is created.
	 * @param {object} data - The initial data object provided to the document creation request.
	 * @param {object} options - Additional options which modify the creation request.
	 * @param {string} userId - The id of the User requesting the document update.
	 */
	_onCreatePhysicalItem(data, options, userId) {
		if ( options.render !== false ) this._renderContainers();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Track changes to an item's container.
	 * @param {object} changes - The candidate changes to the Document.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {BaseUser} user - The User requesting the document update.
	 */
	async _preUpdatePhysicalItem(changes, options, user) {
		if ( foundry.utils.hasProperty(changes, "system.container") ) {
			options.formerContainer = (await this.parent.container)?.uuid;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle re-rendering containers when an item is updated.
	 * @param {object} changed - The differential data that was changed relative to the documents prior values.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {string} userId - The id of the User requesting the document update.
	 */
	_onUpdatePhysicalItem(changed, options, userId) {
		if ( options.render !== false ) this._renderContainers({ formerContainer: options.formerContainer });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle re-rendering containers when an item is deleted.
	 * @param {object} options - Additional options which modify the deletion request.
	 * @param {string} userId - The id of the User requesting the document update.
	 */
	_onDeletePhysicalItem(options, userId) {
		if ( options.render !== false ) this._renderContainers();
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
		if ( this.attuned ) tags.set("attuned", _loc("BF.Attunement.Attuned"));
		else if ( this.attunement.value === "required" ) {
			tags.set("attuned", _loc("BF.Attunement.Type.Required"));
		}
		if ( this.equipped ) tags.set("equipped", _loc("BF.Item.Equipped"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate the total weight and return it in specific unit.
	 * @param {string} unit - Unit in which the weight should be returned.
	 * @returns {number|Promise<number>}
	 */
	totalWeightIn(unit) {
		const weight = this.totalWeight;
		if ( weight instanceof Promise ) {
			return weight.then(w => convertWeight(w, this.weight.unit, { legacy: false, to: unit }).value);
		}
		return convertWeight(weight, this.weight.unit, { legacy: false, to: unit }).value;
	}
}

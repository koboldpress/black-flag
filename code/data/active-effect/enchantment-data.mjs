import ActiveEffectDataModel from "../abstract/active-effect-data-model.mjs";
import DependentsField from "./fields/dependents-field.mjs";

const { BooleanField, DocumentIdField, DocumentUUIDField, SchemaField, SetField } = foundry.data.fields;

/**
 * Data definition for Enchantment active effects.
 *
 * @property {string} appliedOrigin - Activity or item that applied this enchantment.
 * @property {object} dependent
 * @property {DependentData[]} dependent.activities - Rider activities added by this enchantment (deprecated).
 * @property {DependentData[]} dependent.effects - Rider effects added by this enchantment (deprecated).
 * @property {boolean} magical - This enchantment is considered magical and should be disabled if magic isn't available.
 * @property {object} rider
 * @property {Set<string>} rider.activities - Additional activities that should be added to item when enchanted.
 * @property {Set<string>} rider.effects - Additional effects that should be added to item when enchanted.
 */
export default class EchantmentData extends ActiveEffectDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.ENCHANTMENT", "BF.EFFECT.RIDER"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "enchantment",
				localization: "BF.EFFECT.Type.Enchantment"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			...super.defineSchema(),
			appliedOrigin: new DocumentUUIDField(),
			dependent: new SchemaField({
				activities: new DependentsField({ type: "Activity" }),
				effects: new DependentsField({ type: "ActiveEffect" })
			}),
			magical: new BooleanField(),
			rider: new SchemaField({
				activities: new SetField(new DocumentIdField()),
				effects: new SetField(new DocumentIdField())
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get applicableType() {
		return this.isApplied ? "Item" : "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Has this enchantment been applied by another item, or was it directly created.
	 * @type {boolean}
	 */
	get isApplied() {
		return !!this.parent.origin && this.parent.origin !== this.item?.uuid;
		// return !!this.appliedOrigin;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item containing this enchantment.
	 * @type {BlackFlagItem|void}
	 */
	get item() {
		return this.parent.parent;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		if (this.isApplied && this.parent.uuid) {
			BlackFlag.registry.enchantments.track(this.parent.origin, this.parent.uuid);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Dependents & Riders         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async createRiders(options) {
		const riders = await super.createRiders(options);

		let item;
		const { chatMessageOrigin } = options[game.system.id] ?? {};
		if (chatMessageOrigin) item = game.messages.get(chatMessageOrigin)?.getAssociatedItem();
		else item = await fromUuid(this.parent.origin);

		if (!(item instanceof Item)) return riders;

		// Create Activities
		const createdActivities = await this.item.createEmbeddedDocuments(
			"Activity",
			Array.from(this.rider.activities)
				.map(id => {
					const data = item.getEmbeddedDocument("Activity", id)?.toObject();
					if (!data) return null;
					if (this.item.system.activities?.has(data._id)) data._id = foundry.utils.randomID();
					foundry.utils.setProperty(data, `flags.${game.system.id}.dependentOn`, this.parent.id);
					return data;
				})
				.filter(_ => _),
			{ keepId: true }
		);

		// Create Effects
		const createdEffects = await this.item.createEmbeddedDocuments(
			"ActiveEffect",
			Array.from(this.rider.effects)
				.concat(
					createdActivities
						.flatMap(
							a =>
								a.system.effects?.map(({ _id }) => {
									if (this.item.effects.has(_id)) return null;
									return _id;
								}) ?? []
						)
						.filter(_ => _)
				)
				.map(id => {
					const data = item.effects.get(id)?.toObject();
					if (!data) return null;
					data.origin = this.parent.origin;
					foundry.utils.setProperty(data, `flags.${game.system.id}.dependentOn`, this.parent.id);
					return data;
				})
				.filter(_ => _),
			{ keepId: true }
		);

		riders.push(...createdActivities, ...createdEffects);
		return riders;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	onRenderActiveEffectConfig(app, html, context) {
		const toRemove = html.querySelectorAll('.form-group:has([name="transfer"], [name="statuses"])');
		toRemove.forEach(f => f.remove());
		if (this.isApplied) return;

		// Add rider inputs
		const toAdd = [];
		const fields = this.schema.fields.rider.fields;
		if (this.item?.system.activities)
			toAdd.push(
				fields.activities.toFormGroup(
					{},
					{
						options: this.item.system.activities.map(a => ({ value: a.id, label: a.name })),
						value: this._source.rider.activities
					}
				)
			);
		if (this.item)
			toAdd.push(
				fields.effects.toFormGroup(
					{},
					{
						options: this.item.effects.filter(e => e.type === "base").map(e => ({ value: e.id, label: e.name })),
						value: this._source.rider.effects
					}
				)
			);

		const detailsTab = html.querySelector("[data-application-part=details]");
		const description = detailsTab.querySelector("& > .form-group:has(prose-mirror)");
		if (description) description.after(...toAdd);
		else detailsTab.append(...toAdd);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if ((await super._preCreate(data, options, user)) === false) return false;
		if (this.parent.parent instanceof Actor) {
			ui.notifications.error("BF.ENCHANTMENT.Warning.NotOnActor", { localize: true });
			return false;
		}
		if (this.isApplied) {
			this.parent.updateSource({ disabled: false });
			// TODO: Validate enchantment restrictions
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onCreate(data, options, userId) {
		super._onCreate(data, options, userId);
		if (this.isApplied) BlackFlag.registry.enchantments.track(this.parent.origin, this.parent.uuid);
		const chatMessageOrigin = options[game.system.id]?.chatMessageOrigin;
		if (chatMessageOrigin) {
			// TODO: Make this work with detached windows
			document.body
				.querySelectorAll(`[data-message-id="${chatMessageOrigin}"] blackFlag-enchantmentApplication`)
				.forEach(element => element.buildItemList());
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		if (this.isApplied) BlackFlag.registry.enchantments.untrack(this.parent.origin, this.parent.uuid);
		// TODO: Make this work with detached windows
		document.body
			.querySelectorAll(`blackFlag-enchantmentApplication:has([data-enchantment-uuid="${this.parent.uuid}"]`)
			.forEach(element => element.buildItemList());
	}
}

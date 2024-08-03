import { EquipmentConfigurationData, EquipmentValueData } from "../../data/advancement/equipment-data.mjs";
import BlackFlagItem from "../item.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that gives a character their starting equipment.
 */
export default class EquipmentAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "equipment",
				dataModels: {
					configuration: EquipmentConfigurationData,
					value: EquipmentValueData
				},
				order: 32,
				icon: "systems/black-flag/artwork/advancement/equipment.svg",
				title: "BF.Advancement.Equipment.Title",
				hint: "BF.Advancement.Equipment.Hint",
				configurableHint: true,
				singleton: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can starting equipment be selected (e.g. does the actor have a class and a background)?
	 * @type {boolean}
	 */
	get canConfigure() {
		return this.actor.system.progression.background && this.actor.system.progression.levels[1]?.class;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get levels() {
		return [this.item.type === "class" ? 1 : 0];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_preCreate(data) {
		super._preCreate(data);
		this.updateSource({ "level.classRestriction": "original" });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareWarnings(levels, notifications) {
		if (this.configuredForLevel(levels) || !this.canConfigure) return;
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`,
			section: "progression",
			level: "warn",
			message: game.i18n.localize("BF.Advancement.Equipment.Notification")
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		return (
			!foundry.utils.isEmpty(this.value.added) ||
			this.actor.system.progression.levels[1]?.class?.system.advancement.byType("equipment")[0]?.value.wealth
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbedContents(config, options) {
		const p = document.createElement("p");
		p.innerHTML = this.summaryForLevel();
		return p;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		if (this.hint) return this.hint;
		const labels = this.configuration.pool
			.filter(e => !e.group)
			.map(p => p.label)
			.filter(l => l);
		return labels.length ? `<ul>${labels.map(l => `<li>${l}</li>`).join("")}</ul>` : "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		let value;
		const toCreate = [];
		const toUpdate = [];

		// Starting equipment
		if (data?.assignments?.length) {
			value = {
				added: (await Promise.all(data.assignments.map(a => fromUuid(a.uuid).then(item => ({ ...a, item }))))).filter(
					i => i
				),
				contained: []
			};
			for (const addData of value.added) {
				const itemData = await BlackFlagItem.createWithContents([addData.item]);
				delete addData.item;
				const firstItem = itemData.shift();
				addData.document = firstItem._id;
				foundry.utils.setProperty(firstItem, "system.quantity", addData.count ?? 1);
				toCreate.push(firstItem);
				itemData.forEach(d => {
					value.contained.push(d._id);
					toCreate.push(d);
				});
			}
		}

		// Starting wealth
		else if (data?.wealth) {
			const currency = CONFIG.BlackFlag.startingWealth.currency;
			value = { wealth: data.wealth };

			// Check to see if existing currency exists to update
			const existingItem = this.actor.items.find(i => i.type === "currency" && i.identifier === currency);
			if (existingItem) {
				toUpdate.push({ _id: existingItem.id, "system.quantity": existingItem.system.quantity + data.wealth });
			}

			// Otherwise add a new item
			else {
				const uuid = CONFIG.BlackFlag.currencies[currency]?.uuid;
				const itemData = (await fromUuid(uuid)).toObject();
				itemData.system.quantity = data.wealth;
				toCreate.push(itemData);
			}
		}

		if (value) {
			if (toCreate.length) await this.actor.createEmbeddedDocuments("Item", toCreate, { keepId: true, render });
			if (toUpdate.length) await this.actor.updateEmbeddedDocuments("Item", toUpdate, { render });
			return await this.actor.update({ [this.valueKeyPath]: value });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		const toDelete = [...this.value.added.map(d => d.document?.id), ...this.value.contained].filter(id =>
			this.actor.items.has(id)
		);
		const toUpdate = [];

		if (this.item.type === "class" && this.value.wealth) {
			const currency = CONFIG.BlackFlag.startingWealth.currency;
			const existingItem = this.actor.items.find(i => i.type === "currency" && i.identifier === currency);
			if (existingItem) {
				const updatedQuantity = existingItem.system.quantity - this.value.wealth;
				if (updatedQuantity <= 0) toDelete.push(existingItem.id);
				else toUpdate.push({ _id: existingItem.id, "system.quantity": updatedQuantity });
			}
		}

		if (toDelete.length) await this.actor.deleteEmbeddedDocuments("Item", toDelete, { render: false });
		if (toUpdate.length) await this.actor.updateEmbeddedDocuments("Item", toUpdate, { render });
		return await this.actor.update({ [this.valueKeyPath]: { added: [], contained: [], wealth: null } });
	}
}

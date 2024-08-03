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
		// TODO: Display warning about selecting equipment
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		return !foundry.utils.isEmpty(this.value.added);
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
		if (initial || !data.assignments?.length) return;
		// TODO: Handle gold alternative

		const value = {
			added: (await Promise.all(data.assignments.map(a => fromUuid(a.uuid).then(item => ({ ...a, item }))))).filter(
				i => i
			),
			contained: []
		};
		const toCreate = [];
		for (const addData of value.added) {
			const itemData = await BlackFlagItem.createWithContents([addData.item]);
			delete addData.item;
			addData.document = itemData[0]._id;
			toCreate.push(itemData.shift());
			itemData.forEach(d => {
				value.contained.push(d._id);
				toCreate.push(d);
			});
		}

		await this.actor.createEmbeddedDocuments("Item", toCreate, { keepId: true, render });
		return await this.actor.update({ [this.valueKeyPath]: value });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		// TODO: Handle gold alternative

		const deleteIds = [...this.value.added.map(d => d.document?.id), ...this.value.contained].filter(id =>
			this.actor.items.has(id)
		);
		console.log(deleteIds);
		await this.actor.deleteEmbeddedDocuments("Item", deleteIds, { render: false });
		return await this.actor.update({ [this.valueKeyPath]: { added: [], contained: [] } });
	}
}

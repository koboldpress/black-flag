import AdvancementFlow from "./advancement-flow.mjs";
import EquipmentDialog from "./equipment-dialog.mjs";

/**
 * Inline application that adds the select equipment button if both a class & background are added.
 */
export default class EquipmentFlow extends AdvancementFlow {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/equipment-flow.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData() {
		const context = super.getData();
		context.disabled = !this.actor.system.progression.background || !this.actor.system.progression.levels[1]?.class;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _updateObject(event, formData) {
		if (event.submitter?.dataset.action === "select-equipment") {
			let assignments;
			try {
				assignments = await new Promise((resolve, reject) => {
					const dialog = new EquipmentDialog({ actor: this.actor });
					dialog.addEventListener("close", event => resolve(dialog.assignments), { once: true });
					dialog.render({ force: true });
				});
			} catch (err) {
				return;
			}
			if (!assignments) return;

			// TODO: Handle gold alternative
			const handleAdvancement = async (item, type) => {
				await item.system.advancement.byType("equipment")[0].apply(this.levels, { assignments: assignments[type] });
			};
			await handleAdvancement(this.actor.system.progression.levels[1].class, "class");
			await handleAdvancement(this.actor.system.progression.background, "background");
		}
	}
}

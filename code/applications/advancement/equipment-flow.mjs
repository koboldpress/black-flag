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

	/** @override */
	async _updateObject(event, formData) {
		if (event.submitter?.dataset.action === "select-equipment") {
			let result;
			try {
				result = await new Promise((resolve, reject) => {
					const dialog = new EquipmentDialog({ actor: this.actor });
					dialog.addEventListener("close", event => resolve(dialog), { once: true });
					dialog.render({ force: true });
				});
			} catch (err) {
				return;
			}

			if (result.assignments) {
				for (const [type, advancement] of Object.entries(result.advancements)) {
					await advancement?.apply(this.levels, { assignments: result.assignments[type] });
				}
			} else if (result.wealth) {
				result.advancements.class?.apply(this.levels, { wealth: result.wealth });
			}
		}
	}
}

import AdvancementFlow from "./advancement-flow.mjs";
import EquipmentDialog from "./equipment-dialog.mjs";

/**
 * Inline application that adds the select equipment button if both a class & background are added.
 */
export default class EquipmentFlow extends AdvancementFlow {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		if (context.needsConfiguration)
			context.actions = [
				{
					type: "submit",
					classes: "light-button",
					action: "selectEquipment",
					label: _loc("BF.Advancement.Equipment.Action.Select")
				}
			];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _handleForm(event, form, formData) {
		if (event.submitter?.dataset.action === "selectEquipment") {
			let result;
			try {
				result = await new Promise((resolve, reject) => {
					const dialog = new EquipmentDialog({ actor: this.actor });
					dialog.addEventListener("close", event => resolve(dialog), { once: true });
					this.actor.sheet._renderChild(dialog);
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

import { ForwardData } from "../../data/activity/forward-data.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for triggering another activity with alternate consumption.
 */
export default class ForwardActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "forward",
				dataModel: ForwardData,
				icon: "systems/black-flag/artwork/activities/forward.svg",
				title: "BF.FORWARD.Title",
				hint: "BF.FORWARD.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async activate(usage = {}, dialog = {}, message = {}) {
		const activationConfig = foundry.utils.mergeObject(
			{
				cause: {
					activity: this.relativeUUID
				},
				consume: {
					resources: false,
					spellSlot: false
				}
			},
			usage
		);

		const activity = this.item.system.activities.get(this.system.linked.id);
		if (!activity) ui.notifications.error("BF.FORWARD.Warning.NoActivity", { localize: true });
		return activity?.activate(activationConfig, dialog, message);
	}
}

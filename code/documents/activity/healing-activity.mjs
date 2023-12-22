import { HealingData } from "../../data/activity/healing-data.mjs";
import Activity from "./activity.mjs";

export default class HealingActivity extends Activity {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "healing",
		dataModel: HealingData,
		icon: "systems/black-flag/artwork/activities/healing.svg",
		title: "BF.Activity.Healing.Title",
		hint: "BF.Activity.Healing.Hint"
	}, {inplace: false}));
}

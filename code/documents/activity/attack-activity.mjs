import { AttackData } from "../../data/activity/attack-data.mjs";
import Activity from "./activity.mjs";

export default class AttackActivity extends Activity {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "attack",
		dataModel: AttackData,
		icon: "systems/black-flag/artwork/activities/attack.svg",
		title: "BF.Activity.Attack.Title",
		hint: "BF.Activity.Attack.Hint"
	}, {inplace: false}));

}

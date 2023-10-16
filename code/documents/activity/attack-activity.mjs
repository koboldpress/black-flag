import { AttackData } from "../../data/activity/attack-data.mjs";
import Activity from "./activity.mjs";

export default class AttackActivity extends Activity {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "attack",
			dataModel: AttackData,
			icon: "",
			title: "Attack"
		});
	}
}

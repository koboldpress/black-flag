import { SummonData } from "../../data/activity/summon-data.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for summoning creatures.
 */
export default class SummonActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "summon",
				dataModel: SummonData,
				icon: "systems/black-flag/artwork/activities/summon.svg",
				title: "BF.SUMMON.Title",
				hint: "BF.SUMMON.Hint"
			},
			{ inplace: false }
		)
	);
}

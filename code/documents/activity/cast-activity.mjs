import { CastData } from "../../data/activity/cast-data.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for casting spells.
 */
export default class CastActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "cast",
				dataModel: CastData,
				icon: "systems/black-flag/artwork/activities/cast.svg",
				title: "BF.CAST.Title",
				hint: "BF.CAST.Hint"
			},
			{ inplace: false }
		)
	);
}

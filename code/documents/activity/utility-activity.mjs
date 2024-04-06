import Activity from "./activity.mjs";

export default class UtilityActivity extends Activity {
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "utility",
				icon: "systems/black-flag/artwork/activities/utility.svg",
				title: "BF.Activity.Utility.Title",
				hint: "BF.Activity.Utility.Hint"
			},
			{ inplace: false }
		)
	);
}

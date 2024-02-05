/**
 * Application to handled configuring the activation of an activity.
 */
export default class ActivityActivationDialog extends Dialog {
	constructor(activity, config={}, data={}, options={}) {
		super(data, options);
		this.options.classes.push("black-flag", "activity-activation");
		this.activity = activity;
		this.config = foundry.utils.deepClone(config);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The activity being activated.
	 * @type {Activity}
	 */
	activity;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration data for the activation.
	 * @type {ActivityActivationConfiguration}
	 */
	config;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the activity activation dialog.
	 * @param {Activity} activity - Activity to activate.
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activation.
	 * @returns {Promise<object|null>} - Form data object with the results of the activation.
	 * @throws error if activity couldn't be activated.
	 */
	static async create(activity, config) {
		if ( !activity.item.isOwned ) throw new Error("Cannot activate an activity that is not owned.");

		// TODO: Determine what scaling is allowed based on whether it is a spell and what the max scale is set to
		// If spell, use (base ring + max scaling) or (max spell ring), whichever is lower
		// Otherwise, simply use the max scaling value
		//
		// For spells, prepare a list of what rings are available for casting and how many slots they have

		// TODO: Calculate resource consumption based on initial configuration

		const data = {
			activity
		};

		const content = await renderTemplate(
			"systems/black-flag/templates/activities/activity-activation-dialog.hbs", data
		);

		return new Promise(resolve => {
			const dialog = new this(activity, config, {
				title: `${activity.item.name}: ${game.i18n.localize("BF.Activity.Activation.Title")}`,
				content,
				buttons: {
					use: {
						icon: `<i class="fa-solid fa-${activity.isSpell ? "magic" : "fist-raised"}"></i>`,
						label: game.i18n.localize(activity.activationLabel),
						callback: html => {
							const formData = new FormDataExtended(html.querySelector("form"));
							resolve(formData.object);
						}
					}
					// TODO: Support custom buttons?
				},
				close: () => resolve(null),
				default: "use"
			}, { jQuery: false });
			dialog.render(true);
		});
	}
}

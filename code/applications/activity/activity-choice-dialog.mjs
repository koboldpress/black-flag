import BFApplication from "../api/application.mjs";

/**
 * Dialog for selecting which activity to activate for an item.
 */
export default class ActivityChoiceDialog extends BFApplication {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["activity-choice"],
		actions: {
			choose: ActivityChoiceDialog.#onChooseActivity
		},
		item: null,
		position: {
			width: 350
		},
		window: {
			minimizable: false
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		activities: {
			template: "systems/black-flag/templates/activity/activity-choices.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The chosen activity.
	 * @type {Activity|null}
	 */
	#activity;

	get activity() {
		return this.#activity;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Item for which to select the activity.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.options.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return this.item.name;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.activities = this.item.system.activities.map(activity => activity.listContext);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle choosing the specific activity.
	 * @this ActivityChoiceDialog
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #onChooseActivity(event, target) {
		const { activityId } = target.dataset;
		this.#activity = this.item.system.activities.get(activityId);
		this.close();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the choice dialog for an item.
	 * @param {BlackFlagItem} item
	 * @param {Partial<ApplicationConfiguration>} [options={}]
	 * @returns {Promise<Activity|null>}
	 */
	static create(item, options = {}) {
		return new Promise(resolve => {
			const dialog = new this({ ...options, item });
			dialog.addEventListener("close", () => resolve(dialog.activity), { once: true });
			dialog.render({ force: true });
		});
	}
}

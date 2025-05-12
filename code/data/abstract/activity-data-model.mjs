/**
 * Base activity data model shared by activity system data.
 */
export default class ActivityDataModel extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform the pre-localization of this data model.
	 */
	static localize() {
		(foundry.helpers?.Localization ?? Localization).localizeDataModel(this);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The primary ability for this activity that will be available as `@mod` in roll data.
	 * @type {string|null}
	 */
	get ability() {
		return this.isSpell ? this.spellcastingAbility : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The current activity.
	 * @type {Activity}
	 */
	get activity() {
		return this.parent;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The containing actor, if embedded.
	 * @type {BlackFlagActor|void}
	 */
	get actor() {
		return this.activity.actor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Effects that can be applied from this activity.
	 * @type {BlackFlagActiveEffect[]|null}
	 */
	get applicableEffects() {
		return this.effects?.map(e => e.effect).filter(e => e) ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this activity on a spell item, or something else?
	 * @type {boolean}
	 */
	get isSpell() {
		return this.item.type === "spell";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The containing item.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.activity.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The spellcasting ability to use based on the item settings if embedded in a spell.
	 * @type {string|null}
	 */
	get spellcastingAbility() {
		if (this.isSpell) {
			// TODO: Fetch ability from spell data
		}
		const abilities = Object.values(this.actor?.system.spellcasting?.origins ?? {}).reduce((set, o) => {
			set.add(o.ability);
			return set;
		}, new Set());
		return this.actor?.system.selectBestAbility?.(abilities) ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply transformations or derivations to the values of the source data object.
	 */
	prepareData() {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Final data preparation steps performed on Activity after parent actor has been fully prepared.
	 */
	prepareFinalData() {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve the roll data for this activity.
	 * @param {object} [options={}]
	 * @returns {object}
	 */
	getRollData(options = {}) {
		return this.activity.getRollData(options);
	}
}

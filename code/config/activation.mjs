import SelectChoices from "../documents/select-choices.mjs";
import { makeLabel } from "../utils/_module.mjs";
import { timeUnits } from "./units.mjs";

/**
 * Types of actions that can be used to activate features.
 * @enum {LabeledConfiguration}
 */
export const actionTypes = {
	standard: {
		label: "BF.Activation.Category.Standard.Label",
		children: {
			action: {
				label: "BF.Activation.Type.Action"
			},
			bonus: {
				label: "BF.Activation.Type.BonusAction"
			},
			reaction: {
				label: "BF.Activation.Type.Reaction"
			},
			free: {
				label: "BF.Activation.Type.FreeAction"
			}
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a list of activation options using a set of categories.
 * @param {object} [options={}]
 * @param {string[]} [options.categories] - Categories to include, or blank for all categories.
 * @param {string} [options.chosen] - Currently selected option.
 * @param {string[]} [options.pluralRule] - Pluralization rule to use with localization value.
 * @returns {SelectChoices}
 */
export function activationOptions({ categories, chosen, pluralRule }={}) {
	const selectChoices = _createOptions([actionTypes, timeUnits], { chosen, pluralRule });
	selectChoices.exclude(new Set(["combat"]));
	if ( categories ) selectChoices.exclude(new Set(categories));
	return selectChoices;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

export const durations = {
	perm: {
		label: "BF.Duration.Type.Permanent.Label",
		children: {
			dispelled: {
				label: "BF.Duration.UntilDispelled"
			},
			triggered: {
				label: "BF.Duration.UntilDispelledTriggered"
			},
			permanent: {
				label: "BF.Duration.Permanent"
			}
		}
	},
	special: {
		label: "BF.Duration.Type.Special.Label",
		children: {
			instantaneous: {
				label: "BF.Duration.Instantaneous"
			},
			special: {
				label: "BF.Duration.Special"
			}
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a list of duration options using a set of categories.
 * @param {object} [options={}]
 * @param {string[]} [options.categories] - Categories to include, or blank for all categories.
 * @param {string} [options.chosen] - Currently selected option.
 * @param {string[]} [options.pluralRule] - Pluralization rule to use with localization value.
 * @returns {SelectChoices}
 */
export function durationOptions({ categories, chosen, pluralRule }={}) {
	const selectChoices = _createOptions([timeUnits, durations], { chosen, pluralRule });
	if ( categories ) selectChoices.exclude(new Set(categories));
	return selectChoices;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a list of options using a set of categories.
 * @param {object[]} categories - Categories to use when generating the list.
 * @param {object} options
 * @param {string} [options.chosen] - Currently selected option.
 * @param {string[]} [options.pluralRule] - Pluralization rule to use with localization value.
 * @returns {SelectChoices}
 */
function _createOptions(categories, { chosen, pluralRule }) {
	const selectChoices = new SelectChoices();
	categories.forEach(c => selectChoices.merge(new SelectChoices(c)));
	for ( const [key, category] of Object.entries(selectChoices) ) {
		category.label = makeLabel(category, { pluralRule });
		category.scalar = key in timeUnits;
		for ( const [k, v] of Object.entries(category.children) ) {
			v.label = makeLabel(v, { pluralRule });
			v.scalar ??= category.scalar;
			v.chosen = k === chosen;
		}
	}
	return selectChoices;
}
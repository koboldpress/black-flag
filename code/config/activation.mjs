import SelectChoices from "../documents/select-choices.mjs";
import { localizeConfig, makeLabel } from "../utils/_module.mjs";
import { timeUnits } from "./units.mjs";

/**
 * Types of actions that can be used to activate features.
 * @enum {NestedTypeConfiguration}
 */
export const actionTypes = {
	standard: {
		label: "BF.Activation.Category.Standard.Label",
		children: {
			action: {
				localization: "BF.Activation.Type.Action"
			},
			bonus: {
				localization: "BF.Activation.Type.BonusAction"
			},
			reaction: {
				localization: "BF.Activation.Type.Reaction"
			},
			free: {
				localization: "BF.Activation.Type.FreeAction"
			}
		}
	},
	monster: {
		label: "BF.Activation.Category.Monster.Label",
		children: {
			lair: {
				localization: "BF.Activation.Type.Lair"
			},
			legendary: {
				localization: "BF.Activation.Type.Legendary",
				scalar: true
			}
		}
	},
	rest: {
		label: "BF.Activation.Category.Rest.Label",
		children: {
			short: {
				label: "BF.Activation.Type.ShortRest"
			},
			long: {
				label: "BF.Activation.Type.LongRest"
			}
		}
	}
};
localizeConfig(actionTypes, { flatten: true, keepCategories: false, pluralRule: "other", sort: false });
localizeConfig(actionTypes.standard.children);
localizeConfig(actionTypes.monster.children);
localizeConfig(actionTypes.rest.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a list of activation options using a set of categories.
 * @param {object} [options={}]
 * @param {string[]} [options.categories] - Categories to include, or blank for all categories.
 * @param {string} [options.chosen] - Currently selected option.
 * @param {string[]} [options.pluralRule] - Pluralization rule to use with localization value.
 * @returns {SelectChoices}
 */
export function activationOptions({ categories, chosen, pluralRule } = {}) {
	const selectChoices = _createOptions([actionTypes, timeUnits], { chosen, pluralRule });
	selectChoices.exclude(new Set(["combat"]));
	if (categories) selectChoices.exclude(new Set(categories));
	return selectChoices;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Non-scalar durations that can be used.
 * @enum {NestedTypeConfiguration}
 */
export const durations = {
	perm: {
		label: "BF.Duration.Type.Permanent.Label",
		children: {
			dispelled: {
				label: "BF.Duration.UntilDispelled",
				spellOnly: true
			},
			triggered: {
				label: "BF.Duration.UntilDispelledTriggered",
				spellOnly: true
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
 * @param {boolean} [options.isSpell] - Should spell-only durations be displayed?
 * @returns {SelectChoices}
 */
export function durationOptions({ categories, chosen, pluralRule, isSpell } = {}) {
	const selectChoices = _createOptions([timeUnits, durations], { chosen, pluralRule, isSpell });
	if (categories) selectChoices.exclude(new Set(categories));
	return selectChoices;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a list of options using a set of categories.
 * @param {object[]} categories - Categories to use when generating the list.
 * @param {object} options
 * @param {string} [options.chosen] - Currently selected option.
 * @param {string[]} [options.pluralRule] - Pluralization rule to use with localization value.
 * @param {boolean} [options.isSpell] - Should spell-only durations be displayed?
 * @returns {SelectChoices}
 */
function _createOptions(categories, { chosen, pluralRule, isSpell }) {
	const selectChoices = new SelectChoices();
	categories.forEach(c => selectChoices.merge(new SelectChoices(c)));
	for (const [key, category] of Object.entries(selectChoices)) {
		category.label = makeLabel(category, { pluralRule });
		category.scalar = key in timeUnits;
		for (const [k, v] of Object.entries(category.children)) {
			v.label = makeLabel(v, { pluralRule });
			v.scalar ??= category.scalar || v.scalar;
			v.chosen = k === chosen;
			if (v.spellOnly && !isSpell) delete category.children[k];
		}
	}
	return selectChoices;
}

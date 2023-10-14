/**
 * Different rolling modes for Challenge Rolls.
 * @enum {LabeledConfiguration}
 */
export const challengeRollModes = {
	normal: {
		label: "BF.Roll.Action.Normal.Label",
		abbreviation: "BF.Roll.Action.Normal.Abbreviation",
		value: 0
	},
	advantage: {
		label: "BF.Roll.Action.Advantage.Label",
		abbreviation: "BF.Roll.Action.Advantage.Abbreviation",
		value: 1
	},
	disadvantage: {
		label: "BF.Roll.Action.Disadvantage.Label",
		abbreviation: "BF.Roll.Action.Disadvantage.Abbreviation",
		value: -1
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Standard dice spread available for things like damage.
 * @type {number[]}
 */
export const dieSteps = [4, 6, 8, 10, 12, 20, 100];

Object.defineProperty(dieSteps, "labeled", {
	get() {
		return Object.fromEntries(dieSteps.map(v => [v, `d${v}`]));
	},
	enumerable: false
});

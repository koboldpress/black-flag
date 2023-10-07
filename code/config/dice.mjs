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

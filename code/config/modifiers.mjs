/**
 * Types of modifiers that can be created.
 * @enum {object}
 */
export const modifierTypes = {
	bonus: {
		localization: "BF.Bonus.Label"
	},
	min: {
		localization: "BF.Minimum.Label"
	},
	note: {
		localization: "BF.Note.Label"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for roll notes that are added automatically with status effects.
 *
 * @typedef {object} StatusEffectNoteConfiguration
 * @property {FilterDescription[]} filter - Filter used to limit when this modifier is used.
 * @property {number} [rollMode=0] - Roll mode that should be applied.
 * @property {string} text - Localizable text for the roll note.
 * @property {number} [level] - For exhaustion, what level is required to apply this note.
 */

const strDexNote = {
	filter: [{k: "type", v: "ability-save"}, {k: "ability", o: "in", v: ["strength", "dexterity"]}]
};

/**
 * Roll notes that are added automatically for certain status effects.
 * @type {Record<string, StatusEffectNoteConfiguration[]>}
 */
export const statusEffectRollNotes = {
	blinded: [
		{ filter: [{k: "type", v: "ability-check"}], text: "BF.Condition.Blinded.NoteAbilityChecks" },
		{ filter: [{k: "type", v: "attack"}], rollMode: -1, text: "BF.Condition.Blinded.NoteAttackRolls" }
	],
	deafened: [
		{ filter: [{k: "type", v: "ability-check"}], text: "BF.Condition.Deafened.Note" }
	],
	exhaustion: [
		{
			filter: [{k: "type", v: "ability-check"}], rollMode: -1,
			text: "BF.Condition.Exhaustion.NoteAbilityChecks", level: 1
		},
		{
			filter: [{k: "type", o: "in", v: ["ability-save", "attack"]}], rollMode: -1,
			text: "BF.Condition.Exhaustion.NoteAttackRollsSaves", level: 3
		}
	],
	frightened: [
		{
			filter: [{k: "type", o: "in", v: ["ability-check", "attack"]}], rollMode: -1, text: "BF.Condition.Frightened.Note"
		}
	],
	invisible: [
		{
			filter: [{k: "type", v: "skill-check"}, {k: "skill", v: "stealth"}, {k: "ability", v: "dexterity"}],
			rollMode: 1, text: "BF.Condition.Invisible.Note"
		}
	],
	paralyzed: [
		{ ...strDexNote, text: "BF.Condition.Paralyzed.Note" }
	],
	petrified: [
		{ ...strDexNote, text: "BF.Condition.Petrified.Note" }
	],
	poisoned: [
		{
			filter: [{k: "type", o: "in", v: ["ability-check", "attack"]}], rollMode: -1, text: "BF.Condition.Poisoned.Note"
		}
	],
	prone: [
		{ filter: [{k: "type", v: "attack"}], rollMode: -1, text: "BF.Condition.Prone.Note" }
	],
	restrained: [
		{
			filter: [
				{o: "OR", v: [
					{k: "type", v: "attack"},
					{o: "AND", v: [{k: "type", v: "ability-save"}, {k: "ability", v: "dexterity"}]}
				]}
			],
			rollMode: -1, text: "BF.Condition.Restrained.Note"
		}
	],
	stunned: [
		{ ...strDexNote, text: "BF.Condition.Stunned.Note" }
	],
	unconscious: [
		{ ...strDexNote, text: "BF.Condition.Unconscious.Note" }
	]
};

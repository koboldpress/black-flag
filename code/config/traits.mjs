/**
 * Configuration data for traits that apply to actors.
 *
 * @typedef {object} TraitConfiguration
 * @property {object} labels
 * @property {string} labels.title - Title for this trait type.
 * @property {string} labels.localization - Pluralizable localization key for selected entries.
 * @property {string} icon - Path to the icon used to represent this trait.
 * @property {string} type - If this a proficiency or trait.
 * @property {boolean} [expertise=false] - Does this proficiency support expertise?
 * @property {string} [labelKeyPath="label"] - If config is an enum of objects, where can the label be found?
 * @property {string} [actorKeyPath] - Key path to this trait on the actor, if it isn't `traits.{name}` for traits
 *                                     or `proficiencies.{name}` for proficiencies.
 * @property {string} [configKey] - Key of the trait options if it isn't the same as the trait name.
 * @property {boolean} [sortCategories=true] - Should top-level categories should be sorted?
 */

/**
 * Configuration data for actor traits.
 * @enum {TraitConfiguration}
 */
export const traits = {
	armor: {
		labels: {
			title: "BF.Armor.Label[other]",
			localization: "BF.Armor.Label"
		},
		icon: "systems/black-flag/artwork/traits/armor.svg",
		type: "proficiency",
		sortCategories: false
	},
	weapons: {
		labels: {
			title: "BF.Weapon.Label[other]",
			localization: "BF.Weapon.Label"
		},
		icon: "systems/black-flag/artwork/traits/weapons.svg",
		type: "proficiency",
		sortCategories: false
	},
	tools: {
		labels: {
			title: "BF.Tool.Label[other]",
			localization: "BF.Tool.Label"
		},
		icon: "systems/black-flag/artwork/traits/tools.svg",
		type: "proficiency",
		expertise: true
	},
	saves: {
		labels: {
			title: "BF.SavingThrow.Label[other]",
			localization: "BF.Ability.Label"
		},
		localization: "BF.SavingThrow.Label",
		icon: "systems/black-flag/artwork/traits/saves.svg",
		type: "proficiency",
		labelKeyPath: "labels.full",
		actorKeyPath: "system.abilities",
		configKey: "abilities"
	},
	skills: {
		labels: {
			title: "BF.Skill.Label[other]",
			localization: "BF.Skill.Label"
		},
		icon: "systems/black-flag/artwork/traits/skills.svg",
		type: "proficiency",
		expertise: true
	},
	languages: {
		labels: {
			title: "BF.Language.Label[other]",
			localization: "BF.Language.Label"
		},
		icon: "systems/black-flag/artwork/traits/languages.svg",
		type: "proficiency"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                       Languages                       */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Standard languages provided by the system.
 * @enum {LabeledConfiguration}
 */
export const languages = {
	abyssal: {
		label: "BF.Language.Abyssal"
	},
	celestial: {
		label: "BF.Language.Celestial"
	},
	common: {
		label: "BF.Language.Common"
	},
	draconic: {
		label: "BF.Language.Draconic"
	},
	dwarvish: {
		label: "BF.Language.Dwarvish"
	},
	elvish: {
		label: "BF.Language.Elvish"
	},
	giant: {
		label: "BF.Language.Giant"
	},
	gnomish: {
		label: "BF.Language.Gnomish"
	},
	goblin: {
		label: "BF.Language.Goblin"
	},
	halfling: {
		label: "BF.Language.Halfling"
	},
	infernal: {
		label: "BF.Language.Infernal"
	},
	machineSpeech: {
		label: "BF.Language.MachineSpeech"
	},
	orcish: {
		label: "BF.Language.Orcish"
	},
	primordial: {
		label: "BF.Language.Primordial"
	},
	sylvan: {
		label: "BF.Language.Sylvan"
	},
	undercommon: {
		label: "BF.Language.Undercommon"
	},
	voidSpeech: {
		label: "BF.Language.VoidSpeech"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Tags the describe additional details of a character's communication.
 * @enum {LabeledConfiguration}
 */
export const languageTags = {
	cantSpeak: {
		label: "BF.Language.Tag.CantSpeak"
	}
};

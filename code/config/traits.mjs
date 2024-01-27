import { localizeConfig } from "../utils/_module.mjs";

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
			title: "BF.SavingThrow.LabelLong[other]",
			localization: "BF.Ability.Label"
		},
		localization: "BF.SavingThrow.LabelLong",
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
 * @enum {NestedTypeConfiguration}
 */
export const languages = {
	standard: {
		localization: "BF.Language.Category.Standard",
		children: {
			common: {
				label: "BF.Language.Dialect.Common"
			},
			dwarvish: {
				label: "BF.Language.Dialect.Dwarvish"
			},
			elvish: {
				label: "BF.Language.Dialect.Elvish"
			},
			giant: {
				label: "BF.Language.Dialect.Giant"
			},
			gnomish: {
				label: "BF.Language.Dialect.Gnomish"
			},
			goblin: {
				label: "BF.Language.Dialect.Goblin"
			},
			halfling: {
				label: "BF.Language.Dialect.Halfling"
			},
			orcish: {
				label: "BF.Language.Dialect.Orcish"
			}
		}
	},
	esoteric: {
		localization: "BF.Language.Category.Esoteric",
		children: {
			abyssal: {
				label: "BF.Language.Dialect.Abyssal"
			},
			celestial: {
				label: "BF.Language.Dialect.Celestial"
			},
			draconic: {
				label: "BF.Language.Dialect.Draconic"
			},
			infernal: {
				label: "BF.Language.Dialect.Infernal"
			},
			machineSpeech: {
				label: "BF.Language.Dialect.MachineSpeech"
			},
			primordial: {
				label: "BF.Language.Dialect.Primordial",
				localization: "BF.Language.Category.Primordial",
				children: {
					aquan: {
						label: "BF.Language.Dialect.Aquan"
					},
					auran: {
						label: "BF.Language.Dialect.Auran"
					},
					ignan: {
						label: "BF.Language.Dialect.Ignan"
					},
					terran: {
						label: "BF.Language.Dialect.Terran"
					}
				}
			},
			sylvan: {
				label: "BF.Language.Dialect.Sylvan"
			},
			undercommon: {
				label: "BF.Language.Dialect.Undercommon"
			},
			voidSpeech: {
				label: "BF.Language.Dialect.VoidSpeech"
			}
		}
	}
};
localizeConfig(languages, { flatten: true, keepCategories: c => !!c.label });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration information for language tags.
 *
 * @typedef {LabeledConfiguration} LanguageTagConfiguration
 * @property {string} [display] - Localization key for tags that will be displayed as part of the language list.
 * @property {string} [formatter] - Localization key for tags that cause the language list to be wrapped.
 */

/**
 * Tags the describe additional details of a character's communication.
 * @enum {LabeledConfiguration}
 */
export const languageTags = {
	cantSpeak: {
		label: "BF.Language.Tag.CantSpeak.Label",
		formatter: "BF.Language.Tag.CantSpeak.Formatter"
	},
	knownInLife: {
		label: "BF.Language.Tag.KnownInLife.Label",
		display: "BF.Language.Tag.KnownInLife.Display"
	}
};

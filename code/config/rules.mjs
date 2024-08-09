import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration information for rule types.
 *
 * @typedef {object} RuleTypeConfiguration
 * @property {string} label         Localized label for the rule type.
 * @property {string} [references]  Key path for a configuration object that contains reference data.
 */

/**
 * Types of rules that can be used in rule pages and the &Reference enricher.
 * @enum {RuleTypeConfiguration}
 */
export const ruleTypes = {
	rule: {
		label: "BF.Rule.Type.Rule",
		references: "rules"
	},
	ability: {
		label: "BF.Ability.Label[one]",
		references: "enrichment.lookup.abilities"
	},
	skill: {
		label: "BF.Skill.Label[one]",
		references: "enrichment.lookup.skills"
	},
	areaOfEffect: {
		label: "BF.AreaOfEffect.Label"
	},
	condition: {
		label: "BF.Condition.Label[one]",
		references: "conditions"
	},
	creatureTag: {
		label: "BF.CreatureType.Tag.RuleLabel",
		references: "creatureTags"
	},
	creatureType: {
		label: "BF.CreatureType.Label",
		references: "creatureTypes"
	},
	damageType: {
		label: "BF.Damage.Type.Label",
		references: "damageTypes"
	},
	healingType: {
		label: "BF.HEAL.Type.Label",
		references: "healingTypes"
	},
	movementType: {
		label: "BF.Movement.Type.Label",
		reference: "movementTypes"
	},
	property: {
		label: "BF.Property.Label[one]",
		references: "itemProperties"
	},
	sense: {
		label: "BF.Senses.Label[one]",
		reference: "senses"
	},
	spellComponent: {
		label: "BF.Spell.Component.RuleLabel",
		reference: "spellComponents"
	},
	spellSchool: {
		label: "BF.Spell.School.RuleLabel",
		reference: "spellSchools"
	},
	spellSource: {
		label: "BF.Spell.Source.RuleLabel",
		reference: "spellSources"
	},
	spellTag: {
		label: "BF.Spell.Tag.RuleLabel"
	}
};
localizeConfig(ruleTypes);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * List of rules that can be referenced from enrichers. All keys should be lowercase.
 * @type {Record<string, { reference: string }>}
 */
export const rules = {
	luck: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.KdRRH2CH4A47lOd2",
	attackrolls: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.6QEZLNjN9Vtd85mv",
	saves: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.iEjg4QCm1uXuHMWo",
	abilitychecks: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.hJLzQeaHZ5xMiRXB",
	passivechecks: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.JNHxlJWaLZhGt09B",
	groupchecks: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.vfc3jJSA1k7ZA3HJ",
	climbing: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.jWNv9cljSnyDEhui",
	crawling: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.EGfgIvHkET4oMnoB",
	jumping: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.MLrKpFNT81387YGg",
	longjump: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.q4vqA4xBUYEgb6WA",
	highjump: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.2jaVQ13CdtGfULdn",
	swimming: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.6ghqyz9CQReaSMQt",
	difficultterrain: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ZKv4Wvri7nHonnYQ",
	forcedmovement: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.SFb4kc8YK9Huw2De",
	falling: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.YUn5nBL14LRf9z5p",
	pushing: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.SqxcyzDSZO72tH07",
	pulling: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.SqxcyzDSZO72tH07",
	carrying: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Ijp2wMnVYr6W0iNb",
	push: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.i4IobJSHX0rSAiMx",
	drag: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.i4IobJSHX0rSAiMx",
	life: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.i4IobJSHX0rSAiMx",
	encumbered: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.4PZeNWg14gZDTlVa",
	heavilyencumbered: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.uXjn8lmUYmDn3byF",
	lightlyobscured: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.AH8dRfHfrEUF7exU",
	heavilyobscured: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Yckfqn5RxiGzXyEx",
	temphp: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.PGW1FFQySj1EF5SV",
	temporaryhitpoints: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.PGW1FFQySj1EF5SV",
	resistance: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.PXnFpTXXLkiCrVpa",
	vulnerability: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.PXnFpTXXLkiCrVpa",
	hitdice: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.1ytxMlHty9n0SLUa",
	resting: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.g1AZpcFksiW4yDRP",
	shortrest: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.OqQCOgw7ZBFVFAnQ",
	longrest: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.IBHaTCsK83luoW1f",
	deathsaves: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.wjQhC0QcU7vG1B94",
	dying: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.jwv2zYVcIekYalE4",
	stable: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.5gpBaeGshmsJbbTf",
	conditions: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.qNVN3MvCQ8yW8bWZ",
	curses: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Eod2awdchtcUfUeh",
	diseases: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.iuhsSvtEIxRUglVg",
	dread: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.2XMupRuUzzodxenW",
	poisons: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.9dVs2hSBQoOZLpO6",
	starvation: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.NrfxRiIdk7ghum2o",
	dehydration: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.NrfxRiIdk7ghum2o",
	food: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.V4frkDHhsWFBtmmt",
	water: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.4P9Yx1k4NFcuM8DO",
	suffocating: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ATzEq6INUQJvWQDS",
	space: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.aLXrCrhJjElvBSVu",
	creaturesize: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.bCa3AmPRBm9hy1GN",
	bonusactions: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.FuXIjWgBcEJOUKOT",
	reactions: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.U4swqNA0bp6d4YmV",
	dash: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.epbcsiQAhC9n0fUS",
	disengage: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.kgh7CEm3NeD9g3yX",
	dodge: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.q42Xs8I48TGC212s",
	help: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.4BoF98Om04EuUwdz",
	hide: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.g2klsQxMTUpmmZeE",
	ready: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.aaOdqrd4d0XyFcDg",
	search: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.I7OBptE3reZmx8X2",
	useanobject: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.6EMGwT2zTi4XmJf8",
	halfcover: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.IWi5oHoHCq6oane8",
	threequarterscover: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.YTCTevHnuOJ3DYLq",
	totalcover: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.VGPEj8VnVXOFiIka",
	reach: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.kBB2z9Nn36Cu2ejB",
	unarmedstrikes: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Te0mVpqWlEMkPU1i",
	grappling: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.mfOKdTPnpmDvo5lx",
	shoving: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.eE2EG1jXAUy77fI4",
	twoweaponfighting: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.FX73QYzcEWlDeJAz",
	longrange: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.azYu72dhGH7HaIXF",
	closerange: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.JCodpDvIjVzcL5ra",
	mountedcombat: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.yFAJibohseTH3FQq",
	underwatercombat: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.kC0OgTvY7Pxd3sl5",
	cantrips: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.QcIjK8RvqI0lPPyJ",
	rituals: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.AP3BgwMAwevgC5Tr",
	instantaneous: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.c2dif2p9wEdC7A1e",
	concentration: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.9qY7qeHNuDQzCxQh"
};

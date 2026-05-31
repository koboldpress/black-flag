import { localizeConfig, staticID } from "../utils/_module.mjs";

/**
 * Configuration data for system conditions.
 *
 * @typedef {object} BFConditionConfiguration
 * @property {string} label - Localized label for the condition.
 * @property {number} [coverBonus] - A bonus this condition provides to AC and dexterity saving throws.
 * @property {string} [exclusiveGroup] - Any status effects with the same group will not be able to be applied at
 *                                       the same time through the token HUD (multiple statuses applied through
 *                                       other effects can still coexist).
 * @property {string} [icon] - Icon used to represent the condition on the token.
 * @property {boolean} [pseudo] - Effect that behaves like a condition but isn't an official condition.
 * @property {string} [reference] - UUID of a journal entry with details on this condition.
 * @property {string[]} [riders] - Additional effects that will be added alongside this condition.
 * @property {string} [special] - Set this condition as a special status effect under this name.
 */

/**
 * Conditions that can affect an actor.
 * @enum {ConditionConfiguration}
 */
export const conditions = {
	bleeding: {
		label: "EFFECT.BF.Bleeding",
		icon: "systems/black-flag/artwork/statuses/bleeding.svg",
		pseudo: true
	},
	blinded: {
		label: "BF.Condition.Blinded.Label",
		icon: "systems/black-flag/artwork/statuses/blinded.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.xJJvm0vSgfbtS5MP",
		special: "BLIND"
	},
	burning: {
		label: "EFFECT.BF.Burning",
		img: "systems/black-flag/artwork/statuses/burning.svg",
		pseudo: true
	},
	charmed: {
		label: "BF.Condition.Charmed.Label",
		icon: "systems/black-flag/artwork/statuses/charmed.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.xWTun0VE6ViaNL54"
	},
	cursed: {
		label: "EFFECT.BF.Cursed",
		icon: "systems/black-flag/artwork/statuses/cursed.svg",
		pseudo: true
	},
	dehydration: {
		label: "EFFECT.BF.Dehydration",
		img: "systems/black-flag/artwork/statuses/dehydration.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.4P9Yx1k4NFcuM8DO",
		pseudo: true
	},
	deafened: {
		label: "BF.Condition.Deafened.Label",
		icon: "systems/black-flag/artwork/statuses/deafened.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.40xM2nG1zWbUdVs3"
	},
	diseased: {
		label: "EFFECT.BF.Diseased",
		icon: "systems/black-flag/artwork/statuses/diseased.svg",
		pseudo: true
	},
	exhaustion: {
		label: "BF.Condition.Exhaustion.Label",
		icon: "systems/black-flag/artwork/statuses/exhaustion.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.Pk4HY4CkyTFBhFrL"
	},
	falling: {
		label: "EFFECT.BF.Falling",
		img: "systems/black-flag/artwork/statuses/falling.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.YUn5nBL14LRf9z5p",
		pseudo: true
	},
	frightened: {
		label: "BF.Condition.Frightened.Label",
		icon: "systems/black-flag/artwork/statuses/frightened.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.JDnxwjUrT6foQcXs"
	},
	grappled: {
		label: "BF.Condition.Grappled.Label",
		icon: "systems/black-flag/artwork/statuses/grappled.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.MsrEhBwmMcCXQkiT"
	},
	incapacitated: {
		label: "BF.Condition.Incapacitated.Label",
		icon: "systems/black-flag/artwork/statuses/incapacitated.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.hJe9zn3JpFkD5YGY"
	},
	invisible: {
		label: "BF.Condition.Invisible.Label",
		icon: "systems/black-flag/artwork/statuses/invisible.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.J9KSv1AwJ1zod72g"
	},
	malnutrition: {
		label: "EFFECT.BF.Malnutrition",
		img: "systems/black-flag/artwork/statuses/malnutrition.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.V4frkDHhsWFBtmmt",
		pseudo: true
	},
	paralyzed: {
		label: "BF.Condition.Paralyzed.Label",
		icon: "systems/black-flag/artwork/statuses/paralyzed.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.0G8XVDS1Vzq1ZRFL",
		statuses: ["incapacitated"]
	},
	petrified: {
		label: "BF.Condition.Petrified.Label",
		icon: "systems/black-flag/artwork/statuses/petrified.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.jedIxHKhxgKOxpCB",
		statuses: ["incapacitated"]
	},
	poisoned: {
		label: "BF.Condition.Poisoned.Label",
		icon: "systems/black-flag/artwork/statuses/poisoned.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.6uSKn1WiqNwT8Fda"
	},
	prone: {
		label: "BF.Condition.Prone.Label",
		icon: "systems/black-flag/artwork/statuses/prone.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.pdRSRVGYPUK8Vxak"
	},
	restrained: {
		label: "BF.Condition.Restrained.Label",
		icon: "systems/black-flag/artwork/statuses/restrained.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.8o60lOgPGHKz3cLi"
	},
	silenced: {
		label: "EFFECT.BF.Silenced",
		icon: "systems/black-flag/artwork/statuses/silenced.svg",
		pseudo: true
	},
	stunned: {
		label: "BF.Condition.Stunned.Label",
		icon: "systems/black-flag/artwork/statuses/stunned.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.QguBSALg6Xd4Vmh3",
		statuses: ["incapacitated"]
	},
	suffocation: {
		label: "EFFECT.BF.Suffocation",
		img: "systems/black-flag/artwork/statuses/suffocation.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ATzEq6INUQJvWQDS",
		pseudo: true
	},
	surprised: {
		label: "BF.Condition.Surprised.Label",
		icon: "systems/black-flag/artwork/statuses/surprised.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.tPvSfEhj7fDkRvGj"
	},
	transformed: {
		label: "EFFECT.BF.Transformed",
		icon: "systems/black-flag/artwork/statuses/transformed.svg",
		pseudo: true
	},
	unconscious: {
		label: "BF.Condition.Unconscious.Label",
		icon: "systems/black-flag/artwork/statuses/unconscious.svg",
		reference: "Compendium.black-flag.rules.JournalEntry.yTCk697FqUQ0qzL3.JournalEntryPage.NNYMlxVAkVNRS3zH",
		riders: ["prone"],
		statuses: ["incapacitated"]
	}
};
localizeConfig(conditions);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Various effects of conditions and which conditions apply it. Either keys for the conditions,
 * and with a number appended for a level of exhaustion.
 * @enum {Set<string>}
 */
export const conditionEffects = {
	noMovement: new Set(["exhaustion-5", "grappled", "paralyzed", "petrified", "restrained", "unconscious"]),
	halfMovement: new Set(["exhaustion-2"]),
	crawl: new Set(["prone", "exceedingCarryingCapacity"]),
	petrification: new Set(["petrified"]),
	halfHealth: new Set(["exhaustion-4"])
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Extra status effects not specified in `conditions`. If the ID matches a core-provided effect, then this
 * data will be merged into the core data.
 * @enum {object}
 */
export const statusEffects = {
	burrowing: {
		name: "EFFECT.BF.Burrowing",
		img: "systems/black-flag/artwork/statuses/burrowing.svg",
		special: "BURROW"
	},
	concentrating: {
		name: "EFFECT.BF.Concentrating",
		img: "systems/black-flag/artwork/statuses/concentrating.svg",
		special: "CONCENTRATING"
	},
	coverHalf: {
		name: "EFFECT.BF.HalfCover",
		img: "systems/black-flag/artwork/statuses/cover-half.svg",
		order: 2,
		exclusiveGroup: "cover",
		coverBonus: 2
	},
	coverThreeQuarters: {
		name: "EFFECT.BF.ThreeQuartersCover",
		img: "systems/black-flag/artwork/statuses/cover-three-quarters.svg",
		order: 3,
		exclusiveGroup: "cover",
		coverBonus: 5
	},
	coverTotal: {
		name: "EFFECT.BF.TotalCover",
		img: "systems/black-flag/artwork/statuses/cover-total.svg",
		order: 4,
		exclusiveGroup: "cover"
	},
	dead: {
		img: "systems/black-flag/artwork/statuses/dead.svg",
		order: 1,
		special: "DEFEATED"
	},
	dodging: {
		name: "EFFECT.BF.Dodging",
		img: "systems/black-flag/artwork/statuses/dodging.svg"
	},
	ethereal: {
		name: "EFFECT.BF.Ethereal",
		img: "systems/black-flag/artwork/statuses/ethereal.svg"
	},
	// TODO: Rename to flying to match other conditions
	fly: {
		label: "EFFECT.BF.Flying",
		img: "systems/black-flag/artwork/statuses/flying.svg",
		special: "FLY"
	},
	hiding: {
		name: "EFFECT.BF.Hiding",
		img: "systems/black-flag/artwork/statuses/hiding.svg"
	},
	hovering: {
		name: "EFFECT.BF.Hovering",
		img: "systems/black-flag/artwork/statuses/hovering.svg"
	},
	marked: {
		name: "EFFECT.BF.Marked",
		img: "systems/black-flag/artwork/statuses/marked.svg"
	},
	sleeping: {
		name: "EFFECT.BF.Sleeping",
		img: "systems/black-flag/artwork/statuses/sleeping.svg"
	},
	stable: {
		name: "EFFECT.BF.Stable",
		img: "systems/black-flag/artwork/statuses/stable.svg"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configure system status effects.
 * @internal
 */
export function _configureStatusEffects() {
	const addEffect = ({ special, ...data }) => {
		data = foundry.utils.deepClone(data);
		if ("label" in data) {
			data.name = data.label;
			delete data.label;
		}
		if ("icon" in data) {
			data.img = data.icon;
			delete data.icon;
		}
		if (special) CONFIG.specialStatusEffects[special] = data.id;
		return { _id: staticID(`bf${data.id}`), order: Infinity, ...data, name: _loc(data.name) };
	};
	CONFIG.statusEffects = Object.entries(statusEffects).reduce((arr, [id, data]) => {
		const original = CONFIG.statusEffects[id];
		arr.push(addEffect(foundry.utils.mergeObject(original ?? {}, { id, ...data }, { inplace: false })));
		return arr;
	}, []);
	for (const [id, data] of Object.entries(conditions)) {
		CONFIG.statusEffects[id] = addEffect({ id, ...data });
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

Hooks.on("i18nInit", () => {
	// Localize & sort status effects
	CONFIG.statusEffects.forEach(s => (s.name = _loc(s.name)));
	CONFIG.statusEffects.sort((lhs, rhs) =>
		lhs.id === "dead" ? -1 : rhs.id === "dead" ? 1 : lhs.name.localeCompare(rhs.name)
	);
});

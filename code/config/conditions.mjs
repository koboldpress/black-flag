import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for system conditions.
 *
 * @typedef {object} ConditionConfiguration
 * @property {string} label        Localized label for the condition.
 * @property {string} [icon]       Icon used to represent the condition on the token.
 * @property {string} [reference]  UUID of a journal entry with details on this condition.
 * @property {string} [special]    Set this condition as a special status effect under this name.
 */

/**
 * Conditions that can affect an actor.
 * @enum {ConditionConfiguration}
 */
export const conditions = {
	blinded: {
		label: "BF.Condition.Blinded.Label",
		icon: "systems/black-flag/artwork/statuses/blinded.svg",
		reference: "",
		special: "BLIND"
	},
	charmed: {
		label: "BF.Condition.Charmed.Label",
		icon: "systems/black-flag/artwork/statuses/charmed.svg",
		reference: ""
	},
	deafened: {
		label: "BF.Condition.Deafened.Label",
		icon: "systems/black-flag/artwork/statuses/deafened.svg",
		reference: ""
	},
	exhaustion: {
		label: "BF.Condition.Exhaustion.Label",
		icon: "systems/black-flag/artwork/statuses/exhaustion.svg",
		reference: ""
	},
	frightened: {
		label: "BF.Condition.Frightened.Label",
		icon: "systems/black-flag/artwork/statuses/frightened.svg",
		reference: ""
	},
	grappled: {
		label: "BF.Condition.Grappled.Label",
		icon: "systems/black-flag/artwork/statuses/grappled.svg",
		reference: ""
	},
	incapacitated: {
		label: "BF.Condition.Incapacitated.Label",
		icon: "systems/black-flag/artwork/statuses/incapacitated.svg",
		reference: ""
	},
	invisible: {
		label: "BF.Condition.Invisible.Label",
		icon: "systems/black-flag/artwork/statuses/invisible.svg",
		reference: ""
	},
	paralyzed: {
		label: "BF.Condition.Paralyzed.Label",
		icon: "systems/black-flag/artwork/statuses/paralyzed.svg",
		reference: "",
		statuses: ["incapacitated"]
	},
	petrified: {
		label: "BF.Condition.Petrified.Label",
		icon: "systems/black-flag/artwork/statuses/petrified.svg",
		reference: "",
		statuses: ["incapacitated"]
	},
	poisoned: {
		label: "BF.Condition.Poisoned.Label",
		icon: "systems/black-flag/artwork/statuses/poisoned.svg",
		reference: ""
	},
	prone: {
		label: "BF.Condition.Prone.Label",
		icon: "systems/black-flag/artwork/statuses/prone.svg",
		reference: ""
	},
	restrained: {
		label: "BF.Condition.Restrained.Label",
		icon: "systems/black-flag/artwork/statuses/restrained.svg",
		reference: ""
	},
	stunned: {
		label: "BF.Condition.Stunned.Label",
		icon: "systems/black-flag/artwork/statuses/stunned.svg",
		reference: "",
		statuses: ["incapacitated"]
	},
	surprised: {
		label: "BF.Condition.Surprised.Label",
		icon: "systems/black-flag/artwork/statuses/stunned.svg",
		reference: ""
	},
	unconscious: {
		label: "BF.Condition.Unconscious.Label",
		icon: "systems/black-flag/artwork/statuses/unconscious.svg",
		reference: "",
		statuses: ["incapacitated", "prone"]
	}
};
localizeConfig(conditions);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Extra status effects not specified in `conditions`. If the ID matches a core-provided effect, then this
 * data will be merged into the core data.
 * @enum {object}
 */
export const statusEffects = {
	bleeding: {
		icon: "systems/black-flag/artwork/statuses/bleeding.svg"
	},
	burrowing: {
		name: "EFFECT.BF.Burrowing",
		icon: "systems/black-flag/artwork/statuses/burrowing.svg"
	},
	concentrating: {
		name: "EFFECT.BF.Concentrating",
		icon: "systems/black-flag/artwork/statuses/concentrating.svg"
	},
	curse: {
		icon: "systems/black-flag/artwork/statuses/cursed.svg"
	},
	dead: {
		icon: "systems/black-flag/artwork/statuses/dead.svg"
	},
	fly: {},
	hidden: {
		name: "EFFECT.BF.Hidden",
		icon: "systems/black-flag/artwork/statuses/hidden.svg"
	},
	marked: {
		name: "EFFECT.BF.Marked",
		icon: "systems/black-flag/artwork/statuses/marked.svg"
	},
	silence: {
		icon: "systems/black-flag/artwork/statuses/silenced.svg"
	},
	sleep: {
		name: "EFFECT.BF.Sleeping",
		icon: "systems/black-flag/artwork/statuses/sleeping.svg"
	},
	transformed: {
		name: "EFFECT.BF.Transformed",
		icon: "systems/black-flag/artwork/statuses/transformed.svg"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configure system status effects.
 */
export function _configureStatusEffects() {
	const addEffect = (effects, data) => {
		effects.push(data);
		if ("special" in data) CONFIG.specialStatusEffects[data.special] = data.id;
	};
	CONFIG.statusEffects = Object.entries(statusEffects).reduce((arr, [id, data]) => {
		const original = CONFIG.statusEffects.find(s => s.id === id);
		addEffect(arr, foundry.utils.mergeObject(original ?? {}, { id, ...data }, { inplace: false }));
		return arr;
	}, []);
	for (const [id, { label: name, ...data }] of Object.entries(conditions)) {
		addEffect(CONFIG.statusEffects, { id, name, ...data });
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

Hooks.on("i18nInit", () => {
	// Localize & sort status effects
	CONFIG.statusEffects.forEach(s => (s.name = game.i18n.localize(s.name)));
	CONFIG.statusEffects.sort((lhs, rhs) =>
		lhs.id === "dead" ? -1 : rhs.id === "dead" ? 1 : lhs.name.localeCompare(rhs.name)
	);
});

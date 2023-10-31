import { log } from "../utils/_module.mjs";

/**
 * Core status effects that shouldn't be replaced by system-specific conditions.
 * @type {string[]}
 */
export const retainedStatusEffects = ["dead"];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Conditions that should replace existing special status effects.
 * @enum {string}
 */
export const specialStatusEffects = {
	BLIND: "blinded"
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

const _sortStatusEffects = () => CONFIG.statusEffects
	.sort((lhs, rhs) => game.i18n.localize(lhs.name).localeCompare(game.i18n.localize(rhs.name)));

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configure status effects once registration is complete.
 */
Hooks.once("blackFlag.registrationComplete", function() {
	log("Configuring status effects", {level: "groupCollapsed"});

	CONFIG.statusEffects = CONFIG.statusEffects.filter(e => CONFIG.BlackFlag.retainedStatusEffects.includes(e.id));
	CONFIG.statusEffects.forEach(e => log(`Retained ${game.i18n.localize(e.name)}`));

	for ( const [id, {name, img: icon}] of Object.entries(CONFIG.BlackFlag.registration.all.condition) ) {
		CONFIG.statusEffects.push({ id, name, icon });
		log(`Added ${name}`);
	}

	_sortStatusEffects();

	foundry.utils.mergeObject(CONFIG.specialStatusEffects, CONFIG.BlackFlag.specialStatusEffects);

	console.groupEnd();
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a condition being created.
 */
Hooks.on("blackFlag.registrationCreated", function(identifier, item) {
	if ( item.type !== "condition" ) return;
	CONFIG.statusEffects.push({ id: identifier, name: item.name, icon: item.img });
	_sortStatusEffects();
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a condition being updated.
 */
Hooks.on("blackFlag.registrationUpdated", function(identifier, item) {
	if ( item.type !== "condition" ) return;
	const effect = CONFIG.statusEffects.find(e => e.id === identifier);
	if ( effect ) {
		const entry = CONFIG.BlackFlag.registration.get("condition", identifier);
		effect.id = identifier;
		effect.name = entry.name;
		effect.icon = entry.img;
		_sortStatusEffects();
	}
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a condition being deleted.
 */
Hooks.on("blackFlag.registrationDeleted", function(identifier, item) {
	if ( item.type !== "condition" ) return;
	CONFIG.statusEffects.findSplice(e => e.id === identifier);
});

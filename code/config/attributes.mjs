/**
 * Configure list of attributes that can be consumed on an actor.
 * @internal
 */
export function _configureConsumableAttributes() {
	const shared = [
		"attributes.ac.flat",
		"attributes.exhaustion",
		"attributes.hp.value",
		"attributes.hp.temp",
		...Object.keys(CONFIG.BlackFlag.movementTypes).map(key => `traits.movement.types.${key}`),
		...Object.keys(CONFIG.BlackFlag.senses).map(key => `traits.senses.types.${key}`)
	];

	CONFIG.BlackFlag.consumableResources = {
		pc: [
			// TODO: Consumable ability scores?
			...shared,
			"attributes.death.success",
			"attributes.death.failure",
			"attributes.luck.value",
			"progression.xp.value",
			...Array.fromRange(CONFIG.BlackFlag.maxSpellCircle, 1).map(c => `spellcasting.slots.circle-${c}.value`),
			"spellcasting.slots.pact.value"
		].sort(),
		npc: [
			...shared,
			// TODO: Allow targeting `attributes.legendary.value` instead
			"attributes.legendary.spent"
		].sort(),
		lair: []
	};
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configure lists of attributes to display in the token HUD and combat tracker.
 * @internal
 */
export function _configureTrackableAttributes() {
	const shared = {
		bar: ["attributes.hp"],
		value: [
			"attributes.ac.value",
			"attributes.initiative.mod",
			...Object.keys(CONFIG.BlackFlag.movementTypes).map(key => `traits.movement.types.${key}`),
			...Object.keys(CONFIG.BlackFlag.senses).map(key => `traits.senses.types.${key}`)
		]
	};

	CONFIG.Actor.trackableAttributes = {
		pc: {
			bar: [
				...shared.bar,
				...Array.fromRange(CONFIG.BlackFlag.maxSpellCircle, 1).map(c => `spellcasting.slots.circle-${c}`),
				"spellcasting.slots.pact"
			],
			value: [
				...shared.value,
				...Object.keys(CONFIG.BlackFlag.abilities).map(key => `abilities.${key}.value`),
				"attributes.luck.value",
				...Object.keys(CONFIG.BlackFlag.skills).map(key => `proficiencies.skills.${key}.passive`),
				"progression.xp"
			]
		},
		npc: {
			bar: [...shared.bar, "attributes.legendary"],
			value: [
				...shared.value,
				...Object.keys(CONFIG.BlackFlag.abilities).map(ability => `abilities.${ability}.mod`),
				"attributes.cr",
				"attributes.perception",
				"attributes.stealth",
				"spellcasting.dc"
			]
		},
		lair: {
			bar: [],
			value: ["initiative"]
		}
	};
}

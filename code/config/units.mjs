import { localizeConfig, sortObjectEntries } from "../utils/_module.mjs";

/**
 * Configuration for currencies.
 *
 * @typedef {object} CurrencyConfiguration
 * @property {string} label - Localizable name for the currency.
 * @property {string} abbreviation - Abbreviation of the unit.
 * @property {number} conversion - Multiplier used to convert between various units.
 */

/**
 * Currency denominations that can be used. Will be replaced upon registration load with registered currencies
 * if any exist.
 * @enum {UnitConfiguration}
 */
export const currencies = {
	pp: {
		label: "BF.Currency.Denomination.Platinum.Label",
		abbreviation: "BF.Currency.Denomination.Platinum.Abbreviation",
		conversion: 0.1
	},
	gp: {
		label: "BF.Currency.Denomination.Gold.Label",
		abbreviation: "BF.Currency.Denomination.Gold.Abbreviation",
		conversion: 1
	},
	sp: {
		label: "BF.Currency.Denomination.Silver.Label",
		abbreviation: "BF.Currency.Denomination.Silver.Abbreviation",
		conversion: 10
	},
	cp: {
		label: "BF.Currency.Denomination.Copper.Label",
		abbreviation: "BF.Currency.Denomination.Copper.Abbreviation",
		conversion: 100
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configure currencies once registration is complete.
 */
Hooks.once("blackFlag.registrationComplete", function() {
	const currencies = CONFIG.BlackFlag.registration.list("currency") ?? {};
	if ( foundry.utils.isEmpty(currencies) ) return;
	Object.keys(CONFIG.BlackFlag.currencies).forEach(k => delete CONFIG.BlackFlag.currencies[k]);
	for ( const [abbreviation, { name, cached }] of Object.entries(currencies) ) {
		CONFIG.BlackFlag.currencies[abbreviation] = {
			name, abbreviation, conversion: cached.system.conversion.value
		};
	}
	CONFIG.BlackFlag.currencies = sortObjectEntries(CONFIG.BlackFlag.currencies, { sortKey: "conversion", reverse: true});
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a currency being created.
 */
Hooks.on("blackFlag.registrationCreated", function(identifier, item) {
	if ( item.type !== "currency" ) return;
	CONFIG.BlackFlag.currencies[identifier] = {
		label: item.name, abbreviation: identifier, conversion: item.system.conversion.value
	};
	CONFIG.BlackFlag.currencies = sortObjectEntries(CONFIG.BlackFlag.currencies, { sortKey: "conversion", reverse: true});
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a currency being updated.
 */
Hooks.on("blackFlag.registrationUpdated", function(identifier, item) {
	if ( item.type !== "currency" ) return;
	const currency = CONFIG.BlackFlag.currencies[identifier];
	if ( currency ) {
		currency.label = item.name;
		currency.abbreviation = item.identifier;
		currency.conversion = item.system.conversion.value;
	}
	CONFIG.BlackFlag.currencies = sortObjectEntries(CONFIG.BlackFlag.currencies, { sortKey: "conversion", reverse: true});
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a currency being deleted.
 */
Hooks.on("blackFlag.registrationDeleted", function(identifier, item) {
	if ( item.type !== "currency" ) return;
	delete CONFIG.BlackFlag.currencies[identifier];
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration for system various units.
 *
 * @typedef {object} UnitConfiguration
 * @property {string} localization - Pluralizable localization key.
 * @property {string} abbreviation - Abbreviation of the unit.
 * @property {number} conversion - Multiplier used to convert between various units.
 */

/**
 * Units that can be used for measuring distances.
 * @enum {UnitConfiguration}
 */
export const distanceUnits = {
	foot: {
		localization: "BF.Distance.Unit.Foot.Label",
		abbreviation: "BF.Distance.Unit.Foot.Abbreviation",
		formattingUnit: "foot",
		conversion: 1
	},
	mile: {
		localization: "BF.Distance.Unit.Mile.Label",
		abbreviation: "BF.Distance.Unit.Mile.Abbreviation",
		formattingUnit: "mile",
		conversion: 1 / 5280
	}
};
localizeConfig(distanceUnits, { pluralRule: "other" });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Time periods usable by the system, split into combat periods and otherwise.
 * @type {{
 *   combat: {[key: string]: LabeledConfiguration},
 *   clock: {[key: string]: LabeledConfiguration}
 * }}
 */
export const timeUnits = {
	combat: {
		label: "BF.Time.Category.Combat.Label",
		children: {
			turn: {
				localization: "BF.Time.Unit.Turn.Label"
			},
			round: {
				localization: "BF.Time.Unit.Round.Label"
			},
			encounter: {
				localization: "BF.Time.Unit.Encounter.Label"
			}
		}
	},
	time: {
		label: "BF.Time.Category.Time.Label",
		children: {
			minute: {
				localization: "BF.Time.Unit.Minute.Label"
			},
			hour: {
				localization: "BF.Time.Unit.Hour.Label"
			},
			day: {
				localization: "BF.Time.Unit.Day.Label"
			},
			month: {
				localization: "BF.Time.Unit.Month.Label"
			},
			year: {
				localization: "BF.Time.Unit.Year.Label"
			}
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Units that can represent weight in the system.
 * @enum {UnitConfiguration}
 */
export const weightUnits = {
	pound: {
		localization: "BF.Weight.Unit.Pound.Label",
		abbreviation: "BF.Weight.Unit.Pound.Abbreviation",
		conversion: 1
	},
	ounce: {
		localization: "BF.Weight.Unit.Ounce.Label",
		abbreviation: "BF.Weight.Unit.Ounce.Abbreviation",
		conversion: 0.0625
	},
	ton: {
		localization: "BF.Weight.Unit.Ton.Label",
		abbreviation: "BF.Weight.Unit.Ton.Abbreviation",
		conversion: 2000
	}
};
localizeConfig(weightUnits, { pluralRule: "other" });

import { localizeConfig, sortObjectEntries } from "../utils/_module.mjs";

/**
 * Configuration for currencies.
 *
 * @typedef {object} CurrencyConfiguration
 * @property {string} label - Localizable name for the currency.
 * @property {string} abbreviation - Abbreviation of the unit.
 * @property {number} conversion - Multiplier used to convert between various units.
 * @property {boolean} [default] - Standard currency that should be displayed in the add menu on character sheets.
 */

/**
 * Currency denominations that can be used. Will be replaced upon registration load with registered currencies
 * if any exist. User defined currencies only need to be added to this list if they need to be available in the
 * "Add Currency" dialog on sheets, otherwise any currency item in a compendium is loaded.
 * @enum {CurrencyConfiguration}
 */
export const currencies = {
	pp: {
		label: "BF.Currency.Denomination.Platinum.Label",
		abbreviation: "BF.Currency.Denomination.Platinum.Abbreviation",
		conversion: 0.1,
		default: true
	},
	gp: {
		label: "BF.Currency.Denomination.Gold.Label",
		abbreviation: "BF.Currency.Denomination.Gold.Abbreviation",
		conversion: 1,
		default: true
	},
	sp: {
		label: "BF.Currency.Denomination.Silver.Label",
		abbreviation: "BF.Currency.Denomination.Silver.Abbreviation",
		conversion: 10,
		default: true
	},
	cp: {
		label: "BF.Currency.Denomination.Copper.Label",
		abbreviation: "BF.Currency.Denomination.Copper.Abbreviation",
		conversion: 100,
		default: true
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configure currencies once registration is complete.
 */
Hooks.once("blackFlag.registrationComplete", function () {
	const currencies = CONFIG.BlackFlag.registration.list("currency") ?? {};
	if (foundry.utils.isEmpty(currencies)) return;
	for (const [abbreviation, { name: label, cached }] of Object.entries(currencies)) {
		CONFIG.BlackFlag.currencies[abbreviation] = foundry.utils.mergeObject(
			CONFIG.BlackFlag.currencies[abbreviation] ?? {},
			{
				label,
				abbreviation,
				conversion: cached.system.conversion.value,
				uuid: cached.uuid
			}
		);
	}
	for (const [key, config] of Object.entries(CONFIG.BlackFlag.currencies)) {
		if (!config.uuid) delete CONFIG.BlackFlag.currencies[key];
	}
	CONFIG.BlackFlag.currencies = sortObjectEntries(CONFIG.BlackFlag.currencies, {
		sortKey: "conversion",
		reverse: true
	});
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a currency being created.
 */
Hooks.on("blackFlag.registrationCreated", function (identifier, item) {
	if (item.type !== "currency") return;
	CONFIG.BlackFlag.currencies[identifier] = {
		label: item.name,
		abbreviation: identifier,
		conversion: item.system.conversion.value
	};
	CONFIG.BlackFlag.currencies = sortObjectEntries(CONFIG.BlackFlag.currencies, {
		sortKey: "conversion",
		reverse: true
	});
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a currency being updated.
 */
Hooks.on("blackFlag.registrationUpdated", function (identifier, item) {
	if (item.type !== "currency") return;
	const currency = CONFIG.BlackFlag.currencies[identifier];
	if (currency) {
		currency.label = item.name;
		currency.abbreviation = item.identifier;
		currency.conversion = item.system.conversion.value;
	}
	CONFIG.BlackFlag.currencies = sortObjectEntries(CONFIG.BlackFlag.currencies, {
		sortKey: "conversion",
		reverse: true
	});
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a currency being deleted.
 */
Hooks.on("blackFlag.registrationDeleted", function (identifier, item) {
	if (item.type !== "currency") return;
	delete CONFIG.BlackFlag.currencies[identifier];
});

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration for system various units.
 *
 * @typedef {LocalizedConfiguration} UnitConfiguration
 * @property {string} abbreviation - Abbreviation of the unit.
 * @property {number} conversion - Multiplier used to convert between various units.
 * @property {string} [counted] - Localization path for counted plural forms. Only necessary if non-supported unit or
 *                                using a non-standard name for a supported unit.
 * @property {string} [formattingUnit] - Unit formatting value as supported by javascript's internationalization system:
 *                                       https://tc39.es/ecma402/#table-sanctioned-single-unit-identifiers. Only
 *                                       required if the formatting name doesn't match the unit key.
 * @property {string} [system] - Measurement system with which this unit is associated (e.g. imperial or metric).
 */

/**
 * Units that can be used for measuring distances.
 * @enum {UnitConfiguration}
 */
export const distanceUnits = {
	foot: {
		label: "BF.UNITS.DISTANCE.Foot.Label",
		localization: "BF.Distance.Unit.Foot.Label",
		abbreviation: "BF.UNITS.DISTANCE.Foot.Abbreviation",
		conversion: 1,
		formattingUnit: "foot",
		system: "imperial"
	},
	mile: {
		label: "BF.UNITS.DISTANCE.Mile.Label",
		localization: "BF.Distance.Unit.Mile.Label",
		abbreviation: "BF.UNITS.DISTANCE.Mile.Abbreviation",
		conversion: 5280,
		formattingUnit: "mile",
		system: "imperial"
	}
};
localizeConfig(distanceUnits);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Units used to measure travel pace. Note that the formatting units here will automatically be appended with
 * the appropriate time period (e.g. `mile-per-hour` and `mile-per-day`) before being displayed.
 * @enum {UnitConfiguration}
 */
export const paceUnits = {
	mph: {
		label: "BF.UNITS.PACE.MilePerHour.Label",
		abbreviation: "BF.UNITS.PACE.MilePerHour.Abbreviation",
		formattingUnit: "mile",
		conversion: 1,
		system: "imperial"
	}
};
localizeConfig(paceUnits);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Time periods usable by the system, split into combat periods and otherwise.
 * @type {{
 *   combat: {Record<string, UnitConfiguration>},
 *   time: {Record<string, UnitConfiguration>}
 * }}
 */
export const timeUnits = {
	combat: {
		label: "BF.Time.Category.Combat.Label",
		scalar: true,
		children: {
			turn: {
				label: "BF.UNITS.TIME.Turn.Label",
				abbreviation: "BF.UNITS.TIME.Turn.Abbreviation",
				localization: "BF.Time.Unit.Turn.Label",
				counted: "BF.UNITS.TIME.Turn.Counted"
			},
			round: {
				label: "BF.UNITS.TIME.Round.Label",
				abbreviation: "BF.UNITS.TIME.Round.Abbreviation",
				localization: "BF.Time.Unit.Round.Label",
				counted: "BF.UNITS.TIME.Round.Counted",
				conversion: 6
			},
			encounter: {
				label: "BF.UNITS.TIME.Encounter.Label",
				abbreviation: "BF.UNITS.TIME.Encounter.Abbreviation",
				localization: "BF.Time.Unit.Encounter.Label",
				counted: "BF.UNITS.TIME.Encounter.Counted"
			}
		}
	},
	time: {
		label: "BF.Time.Category.Time.Label",
		scalar: true,
		children: {
			minute: {
				label: "BF.UNITS.TIME.Minute.Label",
				abbreviation: "BF.UNITS.TIME.Minute.Abbreviation",
				localization: "BF.Time.Unit.Minute.Label",
				conversion: 1
			},
			hour: {
				label: "BF.UNITS.TIME.Hour.Label",
				abbreviation: "BF.UNITS.TIME.Hour.Abbreviation",
				localization: "BF.Time.Unit.Hour.Label",
				conversion: 60
			},
			day: {
				label: "BF.UNITS.TIME.Day.Label",
				abbreviation: "BF.UNITS.TIME.Day.Abbreviation",
				localization: "BF.Time.Unit.Day.Label",
				conversion: 1_440
			},
			month: {
				label: "BF.UNITS.TIME.Month.Label",
				abbreviation: "BF.UNITS.TIME.Month.Abbreviation",
				localization: "BF.Time.Unit.Month.Label",
				conversion: 43_200
			},
			year: {
				label: "BF.UNITS.TIME.Year.Label",
				abbreviation: "BF.UNITS.TIME.Year.Abbreviation",
				localization: "BF.Time.Unit.Year.Label",
				conversion: 525_600
			}
		}
	}
};
localizeConfig(timeUnits, { flatten: true });
localizeConfig(timeUnits.time.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Units that can represent volume in the system.
 * @enum {UnitConfiguration}
 */
export const volumeUnits = {
	cubicFoot: {
		label: "BF.UNITS.VOLUME.CubicFoot.Label",
		abbreviation: "BF.UNITS.VOLUME.CubicFoot.Abbreviation",
		counted: "BF.UNITS.VOLUME.CubicFoot.Counted",
		conversion: 1,
		system: "imperial"
	}
};
localizeConfig(volumeUnits);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Units that can represent weight in the system.
 * @enum {UnitConfiguration}
 */
export const weightUnits = {
	pound: {
		label: "BF.UNITS.WEIGHT.Pound.Label",
		localization: "BF.Weight.Unit.Pound.Label",
		abbreviation: "BF.UNITS.WEIGHT.Pound.Abbreviation",
		conversion: 1,
		system: "imperial"
	},
	ounce: {
		label: "BF.UNITS.WEIGHT.Ounce.Label",
		localization: "BF.Weight.Unit.Ounce.Label",
		abbreviation: "BF.UNITS.WEIGHT.Ounce.Abbreviation",
		conversion: 0.0625,
		system: "imperial"
	},
	ton: {
		label: "BF.UNITS.WEIGHT.Ton.Label",
		localization: "BF.Weight.Unit.Ton.Label",
		abbreviation: "BF.UNITS.WEIGHT.Ton.Abbreviation",
		counted: "BF.UNITS.WEIGHT.Ton.Counted",
		conversion: 2_000,
		system: "imperial"
	}
};
localizeConfig(weightUnits);

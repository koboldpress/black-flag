/**
 * The Black Flag Roleplaying game system for Foundry Virtual Tabletop.
 * Software License: MIT
 * Repository: https://github.com/koboldpress/black-flag
 * Issue Tracker: https://github.com/koboldpress/black-flag/issues
 */

import "../styles/_module.css";

import * as applications from "./applications/_module.mjs";
import config from "./config/_module.mjs";
import * as data from "./data/_module.mjs";
import * as dice from "./dice/_module.mjs";
import * as documents from "./documents/_module.mjs";
import * as enrichers from "./enrichers.mjs";
import * as settings from "./settings.mjs";
import * as utils from "./utils/_module.mjs";

globalThis.BlackFlag = {
	applications,
	config,
	data,
	dice,
	documents,
	enrichers,
	modules: {},
	settings,
	utils
};

Hooks.once("init", function () {
	utils.log(`Initiatlizing the Black Flag Roleplaying system - Version ${game.system.version}`);

	game.blackFlag = globalThis.BlackFlag;
	CONFIG.BlackFlag = config;
	CONFIG.ActiveEffect.legacyTransferral = false;
	CONFIG.Item.collection = data.collection.BlackFlagItems;
	CONFIG.Item.compendiumIndexFields.push("system.container");
	CONFIG.ui.combat = applications.BlackFlagCombatTracker;
	CONFIG.ui.items = applications.item.BlackFlagItemDirectory;
	applications.registerCustomElements();
	config._configureStatusEffects();
	config.registration.setupHooks();
	data.fields.applyEffectApplicationPatches();
	data.registerDataModels(Actor);
	data.registerDataModels(Item);
	data.registerDataModels(JournalEntryPage);
	dice.registerDice();
	documents.BlackFlagActiveEffect.registerHUDListeners();
	documents.BlackFlagActor.setupHooks();
	documents.registerDocumentClasses();
	enrichers.registerCustomEnrichers();
	settings.registerKeybindings();
	settings.registerSettings();
	utils.registerHandlebarsHelpers();
	utils.registerHandlebarsPartials();
});

Hooks.once("setup", function () {
	applications.registerSheets(Actor);
	applications.registerSheets(Item);
	applications.registerSheets(JournalEntryPage);

	// Apply custom item compendium
	game.packs
		.filter(p => p.metadata.type === "Item")
		.forEach(p => (p.applicationClass = applications.item.BlackFlagItemCompendium));
});

Hooks.once("ready", function () {
	applications.NotificationTooltip.activateListeners();
	config.registration.registerItemTypes();
});

Hooks.on("renderSettings", (app, jQuery, options) => settings.renderSettingsSidebar(jQuery[0]));

export { applications, config, data, documents, settings, utils };

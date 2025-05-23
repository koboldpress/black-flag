/**
 * The Black Flag Roleplaying game system for Foundry Virtual Tabletop.
 * Software License: MIT
 * Repository: https://github.com/koboldpress/black-flag
 * Issue Tracker: https://github.com/koboldpress/black-flag/issues
 */

import "../styles/_module.css";

import * as applications from "./applications/_module.mjs";
import * as canvas from "./canvas/_module.mjs";
import config from "./config/_module.mjs";
import * as data from "./data/_module.mjs";
import * as dice from "./dice/_module.mjs";
import * as documents from "./documents/_module.mjs";
import * as enrichers from "./enrichers.mjs";
import { registerModuleData, setupModulePacks } from "./module-registration.mjs";
import { default as registry } from "./registry.mjs";
import * as settings from "./settings.mjs";
import TooltipConductor from "./tooltips.mjs";
import * as utils from "./utils/_module.mjs";

globalThis.BlackFlag = {
	applications,
	config,
	data,
	dice,
	documents,
	enrichers,
	modules: {},
	registry,
	settings,
	utils
};

Hooks.once("init", function () {
	utils.log(`Initializing the Black Flag Roleplaying system - Version ${game.system.version}`);

	game.blackFlag = globalThis.BlackFlag;
	CONFIG.BlackFlag = config;
	CONFIG.ActiveEffect.legacyTransferral = false;
	CONFIG.Item.collection = data.collection.BlackFlagItems;
	CONFIG.Item.compendiumIndexFields.push("system.container");
	CONFIG.Note.objectClass = canvas.BlackFlagNote;
	CONFIG.ui.chat = applications.BlackFlagChatLog;
	CONFIG.ui.combat = applications.BlackFlagCombatTracker;
	CONFIG.ui.items = applications.item.BlackFlagItemDirectory;
	CONFIG.ux.DragDrop = applications.BlackFlagDragDrop;
	CONFIG.time.roundTime = 6;
	applications.registerCustomElements();
	config._configureFonts();
	config._configureRedirects();
	config._configureStatusEffects();
	config.registration.setupHooks();
	data.fields.applyEffectApplicationPatches();
	data.registerDataModels(ActiveEffect, { enchantment: data.activeEffect.EnchantmentData });
	data.registerDataModels(Actor);
	data.registerDataModels(Item);
	CONFIG.ChatMessage.dataModels = data.chatMessage.config;
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

	registerModuleData();

	game.blackFlag.tooltipConductor = new TooltipConductor();
});

Hooks.once("setup", function () {
	// Register Sheets
	applications.registerSheets(Actor);
	applications.registerSheets(Item);
	applications.registerSheets(JournalEntryPage);
	(foundry.applications?.apps?.DocumentSheetConfig ?? DocumentSheetConfig).registerSheet(
		JournalEntry,
		"black-flag",
		applications.journal.BlackFlagJournalSheet,
		{
			makeDefault: true,
			label: "BF.Sheet.Default.Journal"
		}
	);

	config._configureConsumableAttributes();
	config._configureTrackableAttributes();
	settings._configureOptionalRules();
	setupModulePacks();

	// Handle rich tooltips
	TooltipConductor.activateListeners();
	game.blackFlag.tooltipConductor.observe();
});

Hooks.once("i18nInit", function () {
	Object.values(CONFIG.Activity.types).forEach(c => c.documentClass.localize());
	Object.values(CONFIG.Advancement.types).forEach(c => c.documentClass.localize());
});

Hooks.once("ready", function () {
	applications.NotificationTooltip.activateListeners();
	config.registration.registerItemTypes();

	if (game.user.isGM && game.settings.get(game.system.id, "_firstRun")) {
		const welcome = new applications.WelcomeDialog();
		welcome.render({ force: true });
	}
});

Hooks.on("hotReload", file => {
	// TODO: Temporary patch until https://github.com/foundryvtt/foundryvtt/issues/11939 is fixed
	if (file.extension !== "css") return;
	for (const style of document.querySelectorAll("head style")) {
		if (style.textContent.includes(file.path)) {
			setTimeout(() => (style.textContent = `@import "${file.path}?${Date.now()}" layer(system);`), 100);
		}
	}
});

Hooks.on("renderSettings", (app, jQuery, options) => settings.renderSettingsSidebar(jQuery));
Hooks.on("renderJournalPageSheet", applications.journal.BlackFlagJournalSheet.onRenderJournalPageSheet);

export { applications, config, data, dice, documents, enrichers, registry, settings, utils };

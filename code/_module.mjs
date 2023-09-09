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
import * as documents from "./documents/_module.mjs";
import * as settings from "./settings.mjs";
import * as utils from "./utils/_module.mjs";

globalThis.BlackFlag = {
	applications,
	config,
	data,
	documents,
	modules: {},
	settings,
	utils
};

Hooks.once("init", function() {
	utils.log(`Initiatlizing the Black Flag Roleplaying system - Version ${game.system.version}`);

	game.blackFlag = globalThis.BlackFlag;
	CONFIG.BlackFlag = config;
	data.registerDataModels("Actor", data.actor.config);
	documents.registerDocumentClasses();
	settings.registerSettings();
});

Hooks.once("setup", function() {
	applications.registerSheets(Actor);
});

Hooks.once("i18nInit", function() {

});

Hooks.once("ready", function() {

});

export {
	applications,
	config,
	data,
	documents,
	settings,
	utils
};

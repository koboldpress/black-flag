import log from "../utils/logging.mjs";
import BlackFlagActiveEffect from "./active-effect.mjs";
import * as activity from "./activity/_module.mjs";
import BlackFlagActor from "./actor.mjs";
import * as advancement from "./advancement/_module.mjs";
import BlackFlagChatMessage from "./chat-message.mjs";
import BlackFlagCombatant from "./combatant.mjs";
import BlackFlagItem from "./item.mjs";
import BlackFlagTokenDocument from "./token.mjs";

/**
 * Register the various documents & type labels provided by the system during initialization.
 */
export function registerDocumentClasses() {
	log("Registering document classes");

	CONFIG.ActiveEffect.documentClass = BlackFlagActiveEffect;
	CONFIG.Actor.documentClass = BlackFlagActor;
	CONFIG.ChatMessage.documentClass = BlackFlagChatMessage;
	CONFIG.Combatant.documentClass = BlackFlagCombatant;
	CONFIG.Item.documentClass = BlackFlagItem;
	CONFIG.Token.documentClass = BlackFlagTokenDocument;

	CONFIG.Activity = {
		documentClass: activity.Activity,
		types: CONFIG.BlackFlag._activityTypes
	};

	CONFIG.Advancement = {
		documentClass: advancement.Advancement,
		types: CONFIG.BlackFlag._advancementTypes
	};
}

export {
	BlackFlagActiveEffect, activity, BlackFlagActor, advancement, BlackFlagChatMessage,
	BlackFlagCombatant, BlackFlagItem, BlackFlagTokenDocument
};
export {DocumentMixin} from "./mixin.mjs";
export {default as NotificationsCollection} from "./notifications.mjs";
export {default as Proficiency} from "./proficiency.mjs";
export {default as PseudoDocumentMixin} from "./pseudo-document.mjs";
export {default as SelectChoices} from "./select-choices.mjs";

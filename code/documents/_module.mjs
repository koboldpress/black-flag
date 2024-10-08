import log from "../utils/logging.mjs";
import BlackFlagActiveEffect from "./active-effect.mjs";
import * as activity from "./activity/_module.mjs";
import BlackFlagActor from "./actor.mjs";
import * as advancement from "./advancement/_module.mjs";
import BlackFlagChatMessage from "./chat-message.mjs";
import BlackFlagCombat from "./combat.mjs";
import BlackFlagCombatant from "./combatant.mjs";
import BlackFlagItem from "./item.mjs";
import BlackFlagJournalEntryPage from "./journal-entry-page.mjs";
import BlackFlagTokenDocument from "./token.mjs";

/**
 * Register the various documents & type labels provided by the system during initialization.
 */
export function registerDocumentClasses() {
	log("Registering document classes");

	CONFIG.ActiveEffect.documentClass = BlackFlagActiveEffect;
	CONFIG.Actor.documentClass = BlackFlagActor;
	CONFIG.ChatMessage.documentClass = BlackFlagChatMessage;
	CONFIG.Combat.documentClass = BlackFlagCombat;
	CONFIG.Combatant.documentClass = BlackFlagCombatant;
	CONFIG.Item.documentClass = BlackFlagItem;
	CONFIG.JournalEntryPage.documentClass = BlackFlagJournalEntryPage;
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
	BlackFlagActiveEffect,
	activity,
	BlackFlagActor,
	advancement,
	BlackFlagChatMessage,
	BlackFlagCombatant,
	BlackFlagItem,
	BlackFlagJournalEntryPage,
	BlackFlagTokenDocument
};
export * as mixins from "./mixins/_module.mjs";
export { default as NotificationsCollection } from "./notifications.mjs";
export { default as Proficiency } from "./proficiency.mjs";
export { default as Scaling } from "./scaling.mjs";
export { default as SelectChoices } from "./select-choices.mjs";

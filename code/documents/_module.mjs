import log from "../utils/logging.mjs";
import BlackFlagActor from "./actor.mjs";
import * as advancement from "./advancement/_module.mjs";
import BlackFlagItem from "./item.mjs";

/**
 * Register the various documents & type labels provided by the system during initialization.
 */
export function registerDocumentClasses() {
	log("Registering document classes");

	CONFIG.Actor.documentClass = BlackFlagActor;
	CONFIG.Item.documentClass = BlackFlagItem;

	CONFIG.Advancement = {
		documentClass: advancement.Advancement,
		types: CONFIG.BlackFlag._advancementTypes
	};
}

export {BlackFlagActor, advancement, BlackFlagItem};
export {DocumentMixin} from "./mixin.mjs";
export {default as Proficiency} from "./proficiency.mjs";

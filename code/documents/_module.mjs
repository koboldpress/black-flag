import log from "../utils/logging.mjs";
import BlackFlagActor from "./actor.mjs";
import BlackFlagItem from "./item.mjs";

/**
 * Register the various documents & type labels provided by the system during initialization.
 */
export function registerDocumentClasses() {
	log("Registering document classes");

	CONFIG.Actor.documentClass = BlackFlagActor;
	CONFIG.Item.documentClass = BlackFlagItem;
}

export {BlackFlagActor, BlackFlagItem};
export {default as Proficiency} from "./proficiency.mjs";

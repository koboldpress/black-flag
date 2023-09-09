import log from "../utils/logging.mjs";
import BFActor from "./actor.mjs";

/**
 * Register the various documents & type labels provided by the system during initialization.
 */
export function registerDocumentClasses() {
	log("Registering document classes");

	CONFIG.Actor.documentClass = BFActor;
}

export {BFActor};
export {default as Proficiency} from "./proficiency.mjs";

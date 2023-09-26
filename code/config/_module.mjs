import * as abilities from "./abilities.mjs";
import * as actors from "./actors.mjs";
import * as advancement from "./advancement.mjs";
import * as documents from "./documents.mjs";
import * as items from "./items.mjs";
import * as notifications from "./notifications.mjs";
import * as registration from "./registration.mjs";
import * as skills from "./skills.mjs";
import * as traits from "./traits.mjs";

/**
 * Basic configuration information with a static label.
 *
 * @typedef {object} LabeledConfiguration
 * @property {string} label - Localized label.
 */

export default {
	...abilities,
	...actors,
	...advancement,
	...documents,
	...items,
	...notifications,
	registration,
	...skills,
	...traits
};

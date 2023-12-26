import * as abilities from "./abilities.mjs";
import * as activation from "./activation.mjs";
import * as activity from "./activity.mjs";
import * as actors from "./actors.mjs";
import * as advancement from "./advancement.mjs";
import * as ammunition from "./ammunition.mjs";
import * as armor from "./armor.mjs";
import * as conditions from "./conditions.mjs";
import * as damage from "./damage.mjs";
import * as dice from "./dice.mjs";
import * as documents from "./documents.mjs";
import * as enrichers from "./enrichers.mjs";
import * as inventory from "./inventory.mjs";
import * as items from "./items.mjs";
import * as modifiers from "./modifiers.mjs";
import * as notifications from "./notifications.mjs";
import * as registration from "./registration.mjs";
import * as skills from "./skills.mjs";
import * as spellcasting from "./spellcasting.mjs";
import * as targeting from "./targeting.mjs";
import * as tools from "./tools.mjs";
import * as traits from "./traits.mjs";
import * as units from "./units.mjs";
import * as usage from "./usage.mjs";
import * as weapons from "./weapons.mjs";

/**
 * Basic configuration information with a static label.
 *
 * @typedef {object} LabeledConfiguration
 * @property {string} label - Localized label.
 */

/**
 * Basic configuration information with a pluralizable label.
 *
 * @typedef {object} LocalizedConfiguration
 * @property {string} localization - Pluralizable label.
 */

/**
 * Configuration that includes full label and abbreviation.
 *
 * @typedef {LabeledConfiguration} AbbreviatedConfiguration
 * @property {string} abbreviation - Abbreviated name.
 */

/**
 * Nested type configuration for traits & proficiencies.
 *
 * @typedef {object} NestedTypeConfiguration
 * @property {string} [label] - Localizable label for this type or category. Either this or localization must be set.
 * @property {string} [localization] - Pluralizable label for this type of category. Either this or label must be set.
 * @property {[key: string]: NestedTypeConfiguration} [children] - Nested children.
 */

export default {
	...abilities,
	...activation,
	...activity,
	...actors,
	...advancement,
	...ammunition,
	...armor,
	...conditions,
	...damage,
	...dice,
	...documents,
	...enrichers,
	...items,
	...inventory,
	...modifiers,
	...notifications,
	registration,
	...skills,
	...spellcasting,
	...targeting,
	...tools,
	...traits,
	...units,
	...usage,
	...weapons
};

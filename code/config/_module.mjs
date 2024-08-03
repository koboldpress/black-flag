import * as abilities from "./abilities.mjs";
import * as activation from "./activation.mjs";
import * as activity from "./activity.mjs";
import * as actors from "./actors.mjs";
import * as advancement from "./advancement.mjs";
import * as ammunition from "./ammunition.mjs";
import * as armor from "./armor.mjs";
import * as canvas from "./canvas.mjs";
import * as conditions from "./conditions.mjs";
import * as containers from "./containers.mjs";
import * as damage from "./damage.mjs";
import * as dice from "./dice.mjs";
import * as documents from "./documents.mjs";
import * as enrichers from "./enrichers.mjs";
import * as fonts from "./fonts.mjs";
import * as inventory from "./inventory.mjs";
import * as items from "./items.mjs";
import * as modifiers from "./modifiers.mjs";
import * as notifications from "./notifications.mjs";
import * as registration from "./registration.mjs";
import * as rules from "./rules.mjs";
import * as skills from "./skills.mjs";
import * as spellcasting from "./spellcasting.mjs";
import * as targeting from "./targeting.mjs";
import * as tools from "./tools.mjs";
import * as traits from "./traits.mjs";
import * as units from "./units.mjs";
import * as usage from "./usage.mjs";
import * as vehicles from "./vehicles.mjs";
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
 * @property {Record<string, NestedTypeConfiguration>} [children] - Nested children.
 */

/**
 * @typedef {NestedTypeConfiguration} NestedLinkedConfiguration
 * @property {string} [link] - Link to an item in the compendium.
 * @property {Record<string, NestedLinkedConfiguration>} [children] - Nested children.
 */

/**
 * Configuration information for tags.
 *
 * @typedef {LabeledConfiguration} TraitTagConfiguration
 * @property {string} display - Localization key used for displaying in list using whatever mode is defined.
 * @property {"appended"|associated"|"formatter"|"inline"} type - How the trait is displayed in list. Appended will be
 *                              added to a parenthetical after the list, associated type will display grouped with
 *                              a trait entry in a parenthetical, formatter will wrap the trait list in a string,
 *                              and inline will display in the trait list after the normal entries.
 * @property {string} [association] - Key of a trait that this tag will be associated with for the "association" type.
 */

export default {
	...abilities,
	...activation,
	...activity,
	...actors,
	...advancement,
	...ammunition,
	...armor,
	...canvas,
	...conditions,
	...containers,
	...damage,
	...dice,
	...documents,
	...enrichers,
	...fonts,
	...items,
	...inventory,
	...modifiers,
	...notifications,
	registration,
	...rules,
	...skills,
	...spellcasting,
	...targeting,
	...tools,
	...traits,
	...units,
	...usage,
	...vehicles,
	...weapons
};

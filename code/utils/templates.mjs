import NotificationTooltip from "../applications/notification-tooltip.mjs";
import { linkForUUID } from "./document.mjs";
import { numberFormat } from "./number.mjs";

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                   Handlebars Helpers                  */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * A helper that converts the provided object into a series of `data-` entries.
 * @param {object} context - Current evaluation context.
 * @param {object} options - Handlebars options.
 * @returns {string}
 */
function dataset(context, options) {
	const entries = [];
	for ( let [key, value] of Object.entries(context ?? {}) ) {
		key = key.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (a, b) => (b ? "-" : "") + a.toLowerCase());
		entries.push(`data-${key}="${value}"`);
	}
	return new Handlebars.SafeString(entries.join(" "));
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * A helper to create a set of <option> elements in a <select> block grouped together
 * in <optgroup> based on the provided categories.
 *
 * @param {SelectChoices} choices - Choices to format.
 * @param {object} options
 * @param {object} options.hash
 * @param {boolean} [options.localize] - Should the label be localized?
 * @param {string} [options.blank] - Name for the empty option, if one should be added.
 * @param {string} [options.labelAttr] - Attribute pointing to label string.
 * @param {string} [options.chosenAttr] - Attribute pointing to chosen boolean.
 * @param {string} [options.childrenAttr] - Attribute pointing to array of children.
 * @returns {Handlebars.SafeString} - Formatted option list.
 */
function groupedSelectOptions(choices, options) {
	const localize = options.hash.localize ?? false;
	const blank = options.hash.blank ?? null;
	const labelAttr = options.hash.labelAttr ?? "label";
	const chosenAttr = options.hash.chosenAttr ?? "chosen";
	const childrenAttr = options.hash.childrenAttr ?? "children";

	const getLabel = value => foundry.utils.getType(value) === "Object"
		? foundry.utils.getProperty(value, labelAttr) : value;

	// Create an option
	const option = (name, label, chosen) => {
		if ( localize ) label = game.i18n.localize(label);
		html += `<option value="${name}" ${chosen ? "selected" : ""}>${label}</option>`;
	};

	// Create an group
	const group = category => {
		let label = getLabel(category);
		if ( localize ) game.i18n.localize(label);
		html += `<optgroup label="${label}">`;
		children(category[childrenAttr]);
		html += "</optgroup>";
	};

	// Add children
	const children = children => {
		for ( let [name, child] of Object.entries(children) ) {
			if ( child[childrenAttr] ) group(child);
			else option(name, getLabel(child), child[chosenAttr] ?? false);
		}
	};

	// Create the options
	let html = "";
	if ( blank !== null ) option("", blank);
	children(choices);
	return new Handlebars.SafeString(html);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Display a notification badge if necessary.
 * @param {Document} document - Document from which the notifications should be gathered.
 * @param {object} options
 * @param {object} options.hash
 * @param {string} [options.hash.key] - Display if a notification of this key is set.
 * @param {Document|string} [options.hash.document] - Display if any notifications for this document are set.
 * @param {string} [options.hash.category] - Display if any notifications in this category are set.
 * @param {string} [options.hash.section] - Display if any notifications in this section are set.
 * @param {boolean} [options.hash.displayOrder] - Should a number be displayed for the order?
 * @returns {Handlebars.SafeString|void}
 */
function notificationBadge(document, options={}) {
	let { key, document: item, category, section, ...generationOptions } = options.hash;
	if ( !document.notifications ) return;
	if ( foundry.utils.getType(key) === "Object" ) key = key.string;
	if ( foundry.utils.getType(category) === "Object" ) category = category.string;
	if ( foundry.utils.getType(section) === "Object" ) section = section.string;

	let id = item;
	if ( foundry.utils.getType(item) === "Object" ) id = null;
	else item = null;

	// TODO: If section is set to "auto" and a document ID is provided, determine section using sheet sections

	const getNotifications = (document, key, id, category, section, child=false) => {
		let notifications = [];
		if ( key ) {
			if ( key.endsWith("*") ) {
				notifications = document.notifications.filter(notification =>
					notification.key.startsWith(key.replace("*", ""))
				);
			} else {
				const notification = document.notifications.get(key);
				if ( notification ) notifications.push(notification);
			}
		} else if ( id || category || section ) {
			notifications = document.notifications.filter(notification => {
				if ( id && (id !== notification.document) ) return false;
				if ( category && (category !== notification.category) ) return false;
				if ( section && (section !== notification.section) ) return false;
				return true;
			});
		} else if ( child ) {
			notifications = document.notifications.contents;
		}
		if ( child ) {
			notifications = foundry.utils.deepClone(notifications);
			notifications.forEach(n => n.key = `${document.id}.${n.key}`);
		}
		return notifications;
	};

	let notifications = getNotifications(document, key, id, category, section);
	if ( item ) notifications = notifications.concat(getNotifications(item, key, id, category, section, true));

	if ( !notifications.length ) return;

	return new Handlebars.SafeString(NotificationTooltip.generateBadge(notifications, document.uuid, generationOptions));
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register custom Handlebars helpers for use by the system.
 */
export function registerHandlebarsHelpers() {
	Handlebars.registerHelper({
		"blackFlag-dataset": dataset,
		"blackFlag-groupedSelectOptions": groupedSelectOptions,
		"blackFlag-linkForUUID": linkForUUID,
		"blackFlag-notificationBadge": notificationBadge,
		"blackFlag-number": (number, options) => numberFormat(number, options.hash)
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                  Handlebars Partials                  */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register & pre-load handlebars partial templates.
 * @returns {Promise}
 */
export async function registerHandlebarsPartials() {
	const partials = [
		"active-effect/active-effects.hbs",
		"active-effect/active-effect-change.hbs",
		"activities/activity-damage-parts.hbs",
		"activities/activity-description.hbs",
		"activities/activity-uses.hbs",
		"actor/conditions.hbs",
		"actor/config/modifier-list.hbs",
		"actor/npc-features.hbs",
		"actor/npc-main.hbs",
		"actor/pc-actions.hbs",
		"actor/pc-biography.hbs",
		"actor/pc-features.hbs",
		"actor/pc-inventory.hbs",
		"actor/pc-main.hbs",
		"actor/pc-progression.hbs",
		"actor/pc-spellcasting.hbs",
		"advancement/advancement-controls.hbs",
		"advancement/advancement-name.hbs",
		"dice/roll-notes.hbs",
		"item/concept-summary.hbs",
		"item/item-activities.hbs",
		"item/item-advancement.hbs",
		"journal/journal-table.hbs",
		"shared/uses-config.hbs"
	];

	const paths = {};
	for ( let path of partials ) {
		path = `systems/${game.system.id}/templates/${path}`;
		paths[`blackFlag.${path.split("/").pop().replace(".hbs", "")}`] = path;
	}

	return loadTemplates(paths);
}

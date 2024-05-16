import NotificationTooltip from "../applications/notification-tooltip.mjs";
import { linkForUUID } from "./document.mjs";
import { makeLabel } from "./localization.mjs";
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
 * @param {string} [options.blank] - Name for the empty option, if one should be added.
 * @returns {Handlebars.SafeString} - Formatted option list.
 */
function groupedSelectOptions(choices, options) {
	const categories = {};
	const separateValues = (object, category) => {
		for ( const [key, value] of Object.entries(object) ) {
			value.label = makeLabel(value);
			if ( !value.children || value.selectableCategory ) {
				const childValue = foundry.utils.deepClone(value);
				delete childValue.children;
				if ( category ) {
					categories[category].children ??= {};
					categories[category].children[key] = childValue;
				} else {
					categories[key] = childValue;
				}
			}
			if ( value.children ) {
				categories[key] = foundry.utils.deepClone(value);
				const children = categories[key].children;
				categories[key].children = {};
				const parentLabel = categories[category]?.label;
				if ( parentLabel ) categories[key].label = `${parentLabel} - ${categories[key].label}`;
				separateValues(children, key);
			}
		}
	};
	separateValues(foundry.utils.deepClone(choices));

	// Create an option
	const option = (name, label, chosen) => {
		html += `<option value="${name}" ${chosen ? "selected" : ""}>${label}</option>`;
	};

	// Create an group
	const group = category => {
		html += `<optgroup label="${category.label}">`;
		children(category.children);
		html += "</optgroup>";
	};

	// Add children
	const children = children => {
		for ( let [name, child] of Object.entries(children) ) {
			if ( child.children ) {
				if ( !foundry.utils.isEmpty(child.children) ) group(child);
			} else option(name, child.label, child.chosen ?? false);
		}
	};

	// Create the options
	let html = "";
	if ( (options.blank ?? null) !== null ) option("", options.blank ?? "");
	children(categories);
	return new Handlebars.SafeString(html);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * A helper that fetch the appropriate item context from root and adds it to the first block parameter.
 * @param {object} context - Current evaluation context.
 * @param {object} options - Handlebars options.
 * @returns {string}
 */
function itemContext(context, options) {
	if ( arguments.length !== 2 ) throw new Error("#blackFlag-itemContext requires exactly one argument");
	if ( foundry.utils.getType(context) === "function" ) context = context.call(this);

	const contextObject = options.hash.context ?? options.data.root.itemContext;
	const ctx = contextObject?.[context.id];
	if ( !ctx ) {
		const inverse = options.inverse(this);
		if ( inverse ) return options.inverse(this);
	}

	return options.fn(context, { data: options.data, blockParams: [ctx] });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * A helper to mark one or more `<option>` elements as selected.
 * Escape the string as handlebars would, then escape any regexp characters in it.
 * @param {string[]|Set<string>} selected - The value of the option.
 * @param {object} options - Handlebars options.
 * @returns {Handlebars.SafeString}
 */
function multiSelect(selected, options) {
	let html = options.fn(this);
	for ( const value of selected ) {
		const escapedValue = RegExp.escape(Handlebars.escapeExpression(value));
		const rgx = new RegExp(` value=["']${escapedValue}["']`);
		html = html.replace(rgx, "$& selected");
	}
	return html;
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
		"blackFlag-groupedSelectOptions": (choices, options) => groupedSelectOptions(choices, options.hash),
		"blackFlag-itemContext": itemContext,
		"blackFlag-linkForUUID": (uuid, options) => linkForUUID(uuid, options.hash),
		"blackFlag-multiSelect": multiSelect,
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
		"activities/parts/activity-activation.hbs",
		"activities/parts/activity-damage-parts.hbs",
		"activities/parts/activity-description.hbs",
		"activities/parts/activity-duration.hbs",
		"activities/parts/activity-targeting.hbs",
		"activities/parts/activity-uses.hbs",
		"actor/conditions.hbs",
		"actor/config/modifier-list.hbs",
		"actor/pc-actions.hbs",
		"actor/tabs/actor-active-effects.hbs",
		"actor/tabs/npc-features.hbs",
		"actor/tabs/npc-main.hbs",
		"actor/tabs/pc-biography.hbs",
		"actor/tabs/pc-features.hbs",
		"actor/tabs/pc-inventory.hbs",
		"actor/tabs/pc-main.hbs",
		"actor/tabs/pc-progression.hbs",
		"actor/tabs/pc-spellcasting.hbs",
		"advancement/parts/advancement-controls.hbs",
		"advancement/parts/advancement-name.hbs",
		"advancement/parts/advancement-spell-configuration.hbs",
		"dice/roll-notes.hbs",
		"item/concept-summary.hbs",
		"item/parts/equipment-attunement.hbs",
		"item/parts/equipment-categories.hbs",
		"item/parts/equipment-description.hbs",
		"item/parts/item-activities.hbs",
		"item/parts/item-advancement.hbs",
		"item/parts/item-source.hbs",
		"journal/journal-table.hbs",
		"shared/currency.hbs",
		"shared/inventory.hbs",
		"shared/trait-list.hbs",
		"shared/uses-config.hbs",
		"shared/parts/inventory-controls.hbs",
		"shared/parts/inventory-summary.hbs"
	];

	const paths = {};
	for ( let path of partials ) {
		path = `systems/${game.system.id}/templates/${path}`;
		paths[`blackFlag.${path.split("/").pop().replace(".hbs", "")}`] = path;
	}

	return loadTemplates(paths);
}

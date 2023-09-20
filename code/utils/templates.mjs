import { linkForUUID } from "./document.mjs";
import { loadCachedSVG } from "./svg.mjs";

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                   Handlebars Helpers                  */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * A helper to create a set of <option> elements in a <select> block grouped together
 * in <optgroup> based on the provided categories.
 *
 * @param {SelectChoices} choices - Choices to format.
 * @param {object} [options]
 * @param {boolean} [options.localize] - Should the label be localized?
 * @param {string} [options.blank] - Name for the empty option, if one should be added.
 * @param {string} [options.labelAttr] - Attribute pointing to label string.
 * @param {string} [options.chosenAttr] - Attribute pointing to chosen boolean.
 * @param {string} [options.childrenAttr] - Attribute pointing to array of children.
 * @returns {Handlebars.SafeString} - Formatted option list.
 */
function groupedSelectOptions(choices, options) {
	const localize = options.localize ?? false;
	const blank = options.blank ?? null;
	const labelAttr = options.labelAttr ?? "label";
	const chosenAttr = options.chosenAttr ?? "chosen";
	const childrenAttr = options.childrenAttr ?? "children";

	// Create an option
	const option = (name, label, chosen) => {
		if ( localize ) label = game.i18n.localize(label);
		html += `<option value="${name}" ${chosen ? "selected" : ""}>${label}</option>`;
	};

	// Create an group
	const group = category => {
		let label = category[labelAttr];
		if ( localize ) game.i18n.localize(label);
		html += `<optgroup label="${label}">`;
		children(category[childrenAttr]);
		html += "</optgroup>";
	};

	// Add children
	const children = children => {
		for ( let [name, child] of Object.entries(children) ) {
			if ( child[childrenAttr] ) group(child);
			else option(name, child[labelAttr], child[chosenAttr] ?? false);
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
 * Render an SVG file inline as HTML.
 * @param {string} path - Path to the SVG file.
 * @param {object} options
 * @returns {string}
 */
function inlineSVG(path, options={}) {
	return new Handlebars.SafeString(loadCachedSVG(path));
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register custom Handlebars helpers for use by the system.
 */
export function registerHandlebarsHelpers() {
	Handlebars.registerHelper({
		"blackFlag-groupedSelectOptions": groupedSelectOptions,
		"blackFlag-inlineSVG": inlineSVG,
		"blackFlag-linkForUUID": linkForUUID
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
		"actor/pc-biography.hbs",
		"actor/pc-features.hbs",
		"actor/pc-inventory.hbs",
		"actor/pc-main.hbs",
		"actor/pc-progression.hbs",
		"actor/pc-spellcasting.hbs",
		"advancement/advancement-controls.hbs",
		"item/concept-summary.hbs",
		"item/item-advancement.hbs"
	];

	const paths = {};
	for ( let path of partials ) {
		path = `systems/${game.system.id}/templates/${path}`;
		paths[`blackFlag.${path.split("/").pop().replace(".hbs", "")}`] = path;
	}

	return loadTemplates(paths);
}

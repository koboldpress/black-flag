import { loadCachedSVG } from "./svg.mjs";

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                   Handlebars Helpers                  */
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
		"blackFlag-inlineSVG": inlineSVG
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

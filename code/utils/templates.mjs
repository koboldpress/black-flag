/* <><><><> <><><><> <><><><> <><><><> */
/*         Handlebars Partials         */
/* <><><><> <><><><> <><><><> <><><><> */

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
		"item/class-summary.hbs"
	];

	const paths = {};
	for ( let path of partials ) {
		path = `systems/${game.system.id}/templates/${path}`;
		paths[`blackFlag.${path.split("/").pop().replace(".hbs", "")}`] = path;
	}

	return loadTemplates(paths);
}

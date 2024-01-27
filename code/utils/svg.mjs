/**
 * Pre-load system interface files.
 */
export function cacheInterfaceSVG() {
	cacheSVG({
		armorClass: "systems/black-flag/artwork/interface/armor-class.svg",
		proficiency: "systems/black-flag/artwork/interface/proficiency.svg"
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Pre-load specified SVG files and store them in the header.
 * @param {{[key: string]: string}} paths - Paths to SVG images and IDs in which they will be stored.
 */
export async function cacheSVG(paths) {
	const responses = await Promise.all(Object.entries(paths).map(async ([id, path]) => {
		return [id, await fetch(path).then(r => r.blob()).then(b => b.text())];
	}));
	const head = document.querySelector("head");
	for ( const [id, response] of responses ) {
		const tmp = document.createElement("div");
		tmp.insertAdjacentHTML("beforeend", response);
		const svg = tmp.querySelector("svg");
		svg.id = `cachedSVG-${id}`;
		head.insertAdjacentElement("beforeend", svg);
	}
}

/**
 * Pre-load system interface files.
 */
export function cacheInterfaceSVG() {
	cacheSVG({
		d4: "systems/black-flag/artwork/interface/dice/d4.svg",
		d6: "systems/black-flag/artwork/interface/dice/d6.svg",
		d8: "systems/black-flag/artwork/interface/dice/d8.svg",
		d10: "systems/black-flag/artwork/interface/dice/d10.svg",
		d12: "systems/black-flag/artwork/interface/dice/d12.svg",
		d20: "systems/black-flag/artwork/interface/dice/d20.svg",
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

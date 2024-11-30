import { readFile } from "node:fs/promises";
import Path from "path";
import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { PACK_SRC } from "../constants.mjs";
import { cleanPackEntry } from "./clean.mjs";

/**
 * Extract the contents of compendium packs to JSON files.
 * @param {string} [packName] - Name of pack to extract. If none provided, all packs will be unpacked.
 * @param {string} [entryName] - Name of a specific entry to extract.
 * @param {object} [options={}]
 * @param {object} [config={}]
 *
 * - `npm build:json - Extract all compendium NEDB files into JSON files.
 * - `npm build:json -- classes` - Only extract the contents of the specified compendium.
 * - `npm build:json -- classes Barbarian` - Only extract a single item from the specified compendium.
 */
export default async function unpackDB(packName, entryName, options={}, config={}) {
	entryName = entryName?.toLowerCase();

	// Load system.json.
	const system = JSON.parse(await readFile(`./${config.project?.type ?? "module"}.json`, { encoding: "utf8" }));

	// Determine which source packs to process.
	const packs = system.packs.filter(p => !packName || p.name === packName);

	for ( const packInfo of packs ) {
		const dest = Path.join(PACK_SRC, packInfo.name);

		// Determine folders for extracting
		const folders = {};
		const containers = {};
		await extractPack(packInfo.path, dest, {
			log: false, transformEntry: e => {
				if ( e._key.startsWith("!folders") ) folders[e._id] = { name: slugify(e.name), folder: e.folder };
				else if ( e.type === "container" ) containers[e._id] = {
					name: slugify(e.name), container: e.system?.container, folder: e.folder
				};
				return false;
			}
		});
		const buildPath = (collection, entry, parentKey) => {
			let parent = collection[entry[parentKey]];
			entry.path = entry.name;
			while ( parent ) {
				entry.path = Path.join(parent.name, entry.path);
				parent = collection[parent[parentKey]];
			}
		};
		Object.values(folders).forEach(f => buildPath(folders, f, "folder"));
		Object.values(containers).forEach(c => {
			buildPath(containers, c, "container");
			const folder = folders[c.folder];
			if ( folder ) c.path = Path.join(folder.path, c.path);
		});

		await extractPack(packInfo.path, dest, {
			clean: true, log: true, documentType: packInfo.type, transformEntry: entry => {
				if ( entryName && (entryName !== entry.name.toLowerCase()) ) return false;
				cleanPackEntry(entry, { userId: config.project?.userId });
			}, transformName: entry => {
				if ( entry._id in folders ) return Path.join(folders[entry._id].path, "_folder.json");
				if ( entry._id in containers ) return Path.join(containers[entry._id].path, "_container.json");
				const outputName = slugify(entry.name);
				const parent = containers[entry.system?.container] ?? folders[entry.folder];
				return Path.join(parent?.path ?? "", `${outputName}.${entry._id}.json`);
			}
		});
	}
}

/**
 * Standardize name format.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
	return name.toLowerCase().replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
}

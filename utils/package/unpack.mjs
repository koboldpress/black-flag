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
 *
 * - `npm build:json - Extract all compendium NEDB files into JSON files.
 * - `npm build:json -- classes` - Only extract the contents of the specified compendium.
 * - `npm build:json -- classes Barbarian` - Only extract a single item from the specified compendium.
 */
export default async function unpackDB(packName, entryName, options) {
	entryName = entryName?.toLowerCase();

	// Load system.json.
	const system = JSON.parse(await readFile("./system.json", { encoding: "utf8" }));

	// Determine which source packs to process.
	const packs = system.packs.filter(p => !packName || p.name === packName);

	for ( const packInfo of packs ) {
		const dest = Path.join(PACK_SRC, packInfo.name);
		await extractPack(packInfo.path, dest, {
			log: true, documentType: packInfo.type, transformEntry: entry => {
				if ( entryName && (entryName !== entry.name.toLowerCase()) ) return false;
				cleanPackEntry(entry);
			}, transformName: entry => {
				const name = entry.name.toLowerCase();
				const outputName = name.replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
				// const subfolder = _getSubfolderName(entry, packInfo.name);
				return Path.join(/*subfolder*/"", `${outputName}.${entry._id}.json`);
			}
		});
	}
}

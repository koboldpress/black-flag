import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { readdir } from "node:fs/promises";
import Path from "path";
import { PACK_DEST, PACK_SRC } from "../constants.mjs";
import { cleanPackEntry } from "./clean.mjs";

/**
 * Compile the source JSON files into compendium packs.
 * @param {string} [packName] - Name of pack to compile. If none provided, all packs will be packed.
 * @param {object} [options={}]
 *
 * - `npm run build:db` - Compile all JSON files into their NEDB files.
 * - `npm run build:db -- classes` - Only compile the specified pack.
 */
export default async function packDB(packName, options={}) {
	// Determine which source folders to process
	let folders;
	try {
		folders = (await readdir(PACK_SRC, { withFileTypes: true })).filter(file =>
			file.isDirectory() && ( !packName || (packName === file.name) )
		);
	} catch(err) {
		console.error(err.message);
		return;
	}

	for ( const folder of folders ) {
		const src = Path.join(PACK_SRC, folder.name);
		const dest = Path.join(PACK_DEST, folder.name);
		await compilePack(src, dest, { recursive: true, log: true, transformEntry: cleanPackEntry });
	}
}

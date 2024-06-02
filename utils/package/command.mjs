import { readFile } from "node:fs/promises";
import Path from "path";
import packDB from "./pack.mjs";
import unpackDB from "./unpack.mjs";

/**
 * Package command.
 * @returns {object}
 */
export default function packageCommand() {
	return {
		command: "package [action] [pack] [entry]",
		describe: "Manage packages",
		builder: yargs => {
			yargs.positional("action", {
				describe: "The action to perform.",
				type: "string",
				choices: ["unpack", "pack"]
			});
			yargs.positional("pack", {
				describe: "Name of the pack unpon which to work.",
				type: "string"
			});
			yargs.positional("entry", {
				describe: "Name of any entry within a pack upon which to work. Only applicable to extract & clean commands.",
				type: "string"
			});
			yargs.option("config", {
				describe: "Path to the configuration file.",
				type: "string"
			});
		},
		handler: async argv => {
			const { action, pack, entry, config: configPath, ...options } = argv;
			const config = await loadConfig(configPath);
			console.log(config);
			switch ( action ) {
				case "pack":
					return await packDB(pack, options, config);
				case "unpack":
					return await unpackDB(pack, entry, options, config);
			}
		}
	};
}

/**
 * Load the configuration file for this project.
 * @param {string} configPath
 * @returns {object}
 */
async function loadConfig(configPath) {
	configPath ??= "build-config.json";
	const absPath = Path.isAbsolute(configPath)
		? configPath
		: Path.join(Path.dirname(process.env.npm_package_json), configPath);
	return JSON.parse(await readFile(absPath));
}

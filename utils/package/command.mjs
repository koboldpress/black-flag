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
				choices: ["unpack", "pack"/*, "clean"*/]
			});
			yargs.positional("pack", {
				describe: "Name of the pack unpon which to work.",
				type: "string"
			});
			yargs.positional("entry", {
				describe: "Name of any entry within a pack upon which to work. Only applicable to extract & clean commands.",
				type: "string"
			});
		},
		handler: async argv => {
			const { action, pack, entry, ...options } = argv;
			switch ( action ) {
				// case "clean":
				// 	return await cleanPacks(pack, entry, options);
				case "pack":
					return await packDB(pack, options);
				case "unpack":
					return await unpackDB(pack, entry, options);
			}
		}
	};
}

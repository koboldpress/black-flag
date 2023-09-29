import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import packageCommand from "./package/command.mjs";

// eslint-disable-next-line
const argv = yargs(hideBin(process.argv))
	.command(packageCommand())
	.help().alias("help", "h")
	.argv;

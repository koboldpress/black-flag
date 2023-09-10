import * as abilities from "./abilities.mjs";
import * as registration from "./registration.mjs";
import * as skills from "./skills.mjs";

export default {
	...abilities,
	registration,
	...skills
};

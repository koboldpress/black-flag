import * as abilities from "./abilities.mjs";
import * as advancement from "./advancement.mjs";
import * as documents from "./documents.mjs";
import * as registration from "./registration.mjs";
import * as skills from "./skills.mjs";

export default {
	...abilities,
	...advancement,
	...documents,
	registration,
	...skills
};

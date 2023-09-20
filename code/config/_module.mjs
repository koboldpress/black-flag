import * as abilities from "./abilities.mjs";
import * as actors from "./actors.mjs";
import * as advancement from "./advancement.mjs";
import * as documents from "./documents.mjs";
import * as items from "./items.mjs";
import * as registration from "./registration.mjs";
import * as skills from "./skills.mjs";

export default {
	...abilities,
	...actors,
	...advancement,
	...documents,
	...items,
	registration,
	...skills
};

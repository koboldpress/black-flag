import { slugify } from "../utils/text.mjs";

export default class BlackFlagItem extends Item {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get identifier() {
		if ( this.system.identifier?.value ) return this.system.identifier.value;
		return slugify(this.name, {strict: true});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Embedded Operations         */
	/* <><><><> <><><><> <><><><> <><><><> */

	getEmbeddedCollection(embeddedName) {
		if ( embeddedName === "Advancement" ) {
			if ( !this.system.advancement ) throw new Error("Item does not support advancement.");
			return this.system.advancement;
		}
		return super.getEmbeddedCollection(embeddedName);
	}
}

import { slugify } from "../utils/text.mjs";
import { DocumentMixin } from "./mixin.mjs";

export default class BlackFlagItem extends DocumentMixin(Item) {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Accent color used for certain parts of the UI.
	 * @type {string}
	 */
	get accentColor() {
		if ( this.system.color ) return this.system.color;
		return "var(--bf-blue);";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get identifier() {
		if ( this.system.identifier?.value ) return this.system.identifier.value;
		return slugify(this.name, {strict: true});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get advancement for this item.
	 * @param {number} level - Level for which to get the advancement.
	 * @yields {Advancement}
	 */
	*advancementForLevel(level=0) {
		for ( const advancement of this.system.advancement?.byLevel(level) ?? [] ) {
			yield advancement;
		}
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

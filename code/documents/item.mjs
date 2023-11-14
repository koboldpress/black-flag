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
		return this.system.constructor.metadata?.accentColor ?? "var(--bf-blue);";
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
	 * @param {number|AdvancementLevels} levels - Level for which to get the advancement.
	 * @yields {Advancement}
	 */
	*advancementForLevel(levels=0) {
		if ( foundry.utils.getType(levels) === "number" ) {
			for ( const advancement of this.system.advancement?.byLevel(levels) ?? [] ) {
				yield advancement;
			}
		} else {
			for ( const advancement of this.system.advancement ) {
				const level = advancement.relavantLevel(levels);
				if ( advancement.levels.includes(level) ) yield advancement;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedDocuments() {
		super.prepareEmbeddedDocuments();
		if ( this.system.advancement ) {
			for ( const e of this.getEmbeddedCollection("Advancement") ) {
				e.prepareData();
			}
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

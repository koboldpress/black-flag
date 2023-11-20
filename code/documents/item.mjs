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

	get pseudoDocumentHierarchy() {
		const hierarchy = {};
		for ( const [fieldName, field] of this.system.schema.entries() ) {
			if ( field.constructor.hierarchical ) hierarchy[fieldName] = field;
		}
		Object.defineProperty(this, "pseudoDocumentHierarchy", {value: Object.freeze(hierarchy), writable: false});
		return this.pseudoDocumentHierarchy;
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
		for ( const collectionName of Object.keys(this.pseudoDocumentHierarchy ?? {}) ) {
			for ( const e of this.getEmbeddedCollection(collectionName) ) {
				e.prepareData();
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Embedded Operations         */
	/* <><><><> <><><><> <><><><> <><><><> */

	static getCollectionName(name) {
		if ( name === "Activity" ) name = "activities";
		if ( name === "Advancement" ) name = "advancement";
		if ( ["activities", "advancement"].includes(name) ) return name;
		return super.getCollectionName(name);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getEmbeddedCollection(embeddedName) {
		const collectionName = this.constructor.getCollectionName(embeddedName);
		const field = this.pseudoDocumentHierarchy[collectionName];
		return field ? this.system[collectionName] : super.getEmbeddedCollection(embeddedName);
	}
}

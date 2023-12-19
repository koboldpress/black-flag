import { slugify } from "../utils/text.mjs";
import { DocumentMixin } from "./mixin.mjs";
import NotificationsCollection from "./notifications.mjs";

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
		return this.system.metadata?.accentColor ?? "var(--bf-blue);";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this item currently enabled? Non-enabled items won't display in the actions list.
	 * @type {boolean}
	 */
	get enabled() {
		return this.flags["black-flag"]?.relationship?.enabled ?? false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get identifier() {
		if ( this.system.identifier?.value ) return this.system.identifier.value;
		return slugify(this.name, {strict: true});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Collection of notifications that should be displayed on the actor sheet.
	 */
	notifications = this.notifications;

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
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		this.notifications = new NotificationsCollection();
		super.prepareData();
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
			for ( const advancement of this.system.advancement ?? [] ) {
				const level = advancement.relavantLevel(levels);
				if ( advancement.levels.includes(level) ) yield advancement;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getRollData({ deterministic=false }={}) {
		if ( !this.actor ) return {};
		const actorRollData = this.actor.getRollData({ deterministic });
		const rollData = {
			...actorRollData,
			item: this.toObject(false).system
		};

		const abilityKey = this.system.ability;
		if ( abilityKey && ("abilities" in rollData) ) {
			rollData.mod = rollData.abilities[abilityKey]?.mod ?? 0;
		}

		return rollData;
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

import BaseDataMixin from "./base-data-mixin.mjs";

/**
 * Abstract base class to add some shared functionality to all of the system's custom active effect types.
 * @abstract
 */
export default class ActiveEffectDataModel extends BaseDataMixin(foundry.data.ActiveEffectTypeDataModel) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document type to which this active effect should apply its changes.
	 * @type {string}
	 */
	get applicableType() {
		return "Actor";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Dependents & Riders         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Record another effect or other document as a dependent of this one.
	 * @param {...Document} dependent - One or more dependent documents.
	 */
	async addDependent(...dependent) {
		foundry.utils.logCompatibilityWarning(
			"Dependent documents are now tracked using the `dependentOn` flag on the document itself.",
			{ since: "Black Flag 3.0", until: "Black Flag 4.0" }
		);
		await Promise.all(dependent.map(d => d.setFlag(game.system.id, "dependentOn", this.parent.uuid)));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle creating rider documents when this active effect is created or enabled.
	 * @param {object} options - Options passed to the create or update operation.
	 * @returns {Promise<Document[]>} - Created riders.
	 */
	async createRiders(options) {
		return [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve a list of dependent effects.
	 * @returns {Document[]}
	 */
	getDependents() {
		const dependents = [];
		for (const category of Object.values(this.dependent ?? {})) {
			for (const { uuid } of category) {
				let doc;
				// TODO: Remove this special casing once https://github.com/foundryvtt/foundryvtt/issues/11214 is resolved
				if (this.parent.pack && uuid.includes(this.parent.uuid)) {
					const [, embeddedName, id] = uuid.replace(this.parent.uuid, "").split(".");
					doc = this.parent.getEmbeddedDocument(embeddedName, id);
				} else doc = fromUuidSync(uuid, { strict: false });
				if (doc) {
					if (
						(doc instanceof ActiveEffect && doc.origin === this.parent.uuid) ||
						(this.parent.actor && this.parent.actor === doc.actor) ||
						(this.parent.item && this.parent.item === doc.item)
					)
						dependents.push(doc);
				}
			}
		}
		return dependents.concat(BlackFlag.registry.dependents.get(this.parent));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add modifications to the core ActiveEffect config.
	 * @param {ActiveEffectConfig} app - The ActiveEffect config.
	 * @param {HTMLElement} html - The ActiveEffect config element.
	 * @param {ApplicationRenderContext} context - The app's rendering context.
	 */
	onRenderActiveEffectConfig(app, html, context) {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		if (userId !== game.userId) return;
		await this.createRiders(options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		if (game.user === game.users.activeGM) this.getDependents().forEach(e => e.delete());
	}
}

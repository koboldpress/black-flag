const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Base application from which all Black Flag applications should be based.
 */
export default class BFApplication extends HandlebarsApplicationMixin(ApplicationV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["black-flag"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.CONFIG = CONFIG.BlackFlag;
		return context;
	}
}

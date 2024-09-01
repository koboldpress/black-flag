const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Base document sheet from which all actor configuration applications should be based.
 */
export default class BaseConfigSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["black-flag", "config-sheet"],
		sheetConfig: false,
		form: {
			submitOnChange: true
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.fields = this.document.schema.fields;
		context.source = this.document.toObject();
		context.system = {
			data: this.document.system,
			source: context.source.system,
			fields: this.document.system.schema.fields
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	// TODO: Prepare modifiers
}

import { slugify } from "../utils/_module.mjs";
import BFDocumentSheet from "./api/document-sheet.mjs";

/**
 * Application for viewing a documents's ID & UUID, changing its identifier, and setting source data if present.
 */
export default class SourceConfig extends BFDocumentSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["config", "identity", "standard-form"],
		sheetConfig: false,
		position: {
			width: 500
		},
		form: {
			submitOnChange: true
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		source: {
			template: "systems/black-flag/templates/shared/identity-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return `${game.i18n.localize("BF.SOURCE.Config")}: ${this.document.name}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const compendiumSource = fromUuid(this.document._stats.compendiumSource);
		const context = await super._prepareContext(options);
		const source = this.document.system.toObject();
		context.compendiumLink = (await compendiumSource)?.toAnchor().outerHTML;
		context.document = this.document;
		if (Object.hasOwn(this.document.system.identifier ?? {}, "value"))
			context.identifier = {
				field: this.document.system.schema.fields.identifier.fields.value,
				placeholder: slugify(this.document.name, { strict: true }),
				value: this.document.system.identifier.value
			};
		if (Object.hasOwn(this.document.system.description ?? {}, "source"))
			context.source = {
				data: this.document.system.description.source,
				fields: this.document.system.schema.fields.description.fields.source.fields,
				source: source.description.source
			};
		return context;
	}
}

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about an actor or item's source book.
 *
 * @property {string} book - ID of the book in which this document originated.
 * @property {string} fallback - Localized fallback name if the ID isn't found in config.
 * @property {string} page - Page or section in which this document can be found.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class SourceField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			book: new StringField({ label: "BF.Source.Book" }),
			fallback: new StringField({ label: "BF.Source.Fallback" }),
			page: new StringField({ label: "BF.Source.Page" }),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, { label: "BF.Source.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "label", {
			get() {
				return this.fallback;
				// if ( this.custom ) return this.custom;
				// const page = Number.isNumeric(this.page)
				// 	? game.i18n.format("DND5E.SourcePageDisplay", { page: this.page }) : this.page;
				// return game.i18n.format("DND5E.SourceDisplay", { book: this.book ?? "", page: page ?? "" }).trim();
			},
			enumerable: false
		});
		Object.defineProperty(obj, "toString", {
			value: () => {
				foundry.utils.logCompatibilityWarning(
					"Source has been converted to an object, the label can now be accessed using the `source#label` property."
				);
				return obj.label;
			},
			enumerable: false
		});

		return obj;
	}
}

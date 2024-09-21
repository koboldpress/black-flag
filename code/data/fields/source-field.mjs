const { SchemaField, StringField } = foundry.data.fields;

/**
 * @typedef {object} SourceData
 * @property {string} book - ID of the book in which this document originated.
 * @property {string} fallback - Localized fallback name if the ID isn't found in config.
 * @property {string} page - Page or section in which this document can be found.
 */

/**
 * Field for storing information about an actor or item's source book.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class SourceField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			book: new StringField(),
			fallback: new StringField(),
			page: new StringField(),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the source label.
	 * @this {SourceData}
	 * @param {string} uuid - Compendium source or document UUID.
	 */
	static prepareData(uuid) {
		const pkg = SourceField.getPackage(uuid);
		this.bookPlaceholder = SourceField.getModuleBook(pkg) ?? "";
		if (!this.book) this.book = this.bookPlaceholder;

		if (this.fallback) this.label = this.fallback;
		else {
			const page = Number.isNumeric(this.page)
				? game.i18n.format("BF.SOURCE.Display.Page", { page: this.page })
				: this.page ?? "";
			this.label = game.i18n.format("BF.SOURCE.Display.Full", { book: this.book, page }).trim();
		}

		this.value = this.book || (pkg?.title ?? "");
		this.slug = this.value.slugify({ strict: true });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Check if the provided package has any source books registered in its manifest. If it has only one, then return
	 * that book's key.
	 * @param {ClientPackage} pck - The package.
	 * @returns {string|null}
	 */
	static getModuleBook(pck) {
		if (!pck) return null;
		const sourceBooks = pck.flags?.[game.system.id]?.sourceBooks;
		const keys = Object.keys(sourceBooks ?? {});
		if (keys.length !== 1) return null;
		return keys[0];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the package associated with the given UUID, if any.
	 * @param {string} uuid - The UUID.
	 * @returns {ClientPackage|null}
	 */
	static getPackage(uuid) {
		const pack = foundry.utils.parseUuid(uuid)?.collection?.metadata;
		switch (pack?.packageType) {
			case "module":
				return game.modules.get(pack.packageName);
			case "system":
				return game.system;
			case "world":
				return game.world;
		}
		return null;
	}
}

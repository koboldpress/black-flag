export default function BaseDataMixin(Base) {
	class BaseDataModel_ extends Base {
		/**
		 * Metadata that describes a system data type.
		 *
		 * @typedef {object} BaseDataMetadata
		 * @property {string} type - Name of type to which this system data model belongs.
		 * @property {string} [module] - For module-defined types, which module provides this type.
		 * @property {string} [category] - Which category in the create item dialog should this Document be listed?
		 * @property {string} localization - Base localization key for this type. This should be a localization key that
		 *                                   accepts plural types (e.g. `BF.Item.Type.Weapon` becomes
		 *                                   `BF.Item.Type.Weapon[few]` and `BF.Item.Type.Weapon[other]`).
		 * @property {string} [icon] - Font awesome icon string used for links to this type.
		 * @property {string} [img] - Default image used when creating a Document of this type.
		 */

		/**
		 * Metadata that describes a type.
		 * @type {BaseDataMetadata}
		 */
		static metadata = {
			legacyMixin: true
		};

		/**
		 * Metadata that describes a type.
		 * @type {BaseDataMetadata}
		 */
		get metadata() {
			return this.constructor.metadata;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Full type with module prefix if it is a module-defined type.
		 * @type {string}
		 */
		static get fullType() {
			return this.metadata.module ? `${this.metadata.module}.${this.metadata.type}` : this.metadata.type;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*              Properties             */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Key path to the description used for default embeds.
		 * @type {string|null}
		 */
		get embeddedDescriptionKeyPath() {
			return null;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*            Data Migration           */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Migrate data in a mapping field from `units` to `unit`.
		 * Added in 2.0.068
		 * @param {Record<string, object>} data - Mapping field data to migrate.
		 * @internal
		 */
		static _migrateMappingFieldUnits(data) {
			if (!data) return;
			for (const value of Object.values(data)) {
				this._migrateObjectUnits(value);
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Migrate data in an object from `units` to `unit`.
		 * Added in 2.0.068
		 * @param {object} data - Object to migrate.
		 * @internal
		 */
		static _migrateObjectUnits(data) {
			if (!data || !("units" in data)) return;
			data.unit ??= data.units;
			delete data.units;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*              Data Shims             */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Apply shims to mapping field containing migrated `unit` value.
		 * @param {string} keyPath - Key path to object to shim.
		 * @internal
		 */
		_shimMappingFieldUnits(keyPath) {
			for (const [name, value] of Object.entries(foundry.utils.getProperty(this, keyPath) ?? {})) {
				this._shimObjectUnits(`${keyPath}.${name}`, value);
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Apply shims to an object containing migrated `unit` value.
		 * @param {string} keyPath - Key path to object to shim.
		 * @param {object} [data] - Object to shim. If not set, will be fetched from this data model.
		 * @internal
		 */
		_shimObjectUnits(keyPath, data) {
			data ??= foundry.utils.getProperty(this, keyPath);
			if (!data) return;
			Object.defineProperty(data, "units", {
				get() {
					foundry.utils.logCompatibilityWarning(`The \`units\` property in \`${keyPath}\` has been renamed \`unit\`.`, {
						since: "Black Flag 2.0.068",
						until: "Black Flag 3.1"
					});
					return this.unit;
				}
			});
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*          Embeds & Tooltips          */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Render a rich tooltip for this document.
		 * @param {EnrichmentOptions} [enrichmentOptions={}] - Options for text enrichment.
		 * @returns {{ content: string, classes: string[] }|null}
		 */
		async richTooltip(enrichmentOptions = {}) {
			return null;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @override */
		async toEmbed(config, options = {}) {
			const keyPath = this.embeddedDescriptionKeyPath;
			if (!keyPath || !foundry.utils.hasProperty(this, keyPath)) return null;
			const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
				foundry.utils.getProperty(this, keyPath),
				{
					...options,
					relativeTo: this.parent
				}
			);
			const container = document.createElement("div");
			container.innerHTML = enriched;
			return container.children;
		}
	}
	return BaseDataModel_;
}

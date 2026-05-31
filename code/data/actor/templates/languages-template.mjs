import { convertAmount, defaultUnit, formatDistance, formatTaggedList, Trait } from "../../../utils/_module.mjs";
import MappingField from "../../fields/mapping-field.mjs";

const { ArrayField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data for an actor's languages.
 *
 * @typedef {object} LanguagesData
 * @property {Set<string>} value - Language dialects understood by actor.
 * @property {Record<string, CommunicationData>} communication
 * @property {string[]} custom - Additional custom languages.
 * @property {Set<string>} tags - Additional tags describing actor's language usage.
 */

/**
 * Data for ranged communication modes.
 *
 * @typedef {object} CommunicationData
 * @property {number} range - Range to which this ability can be used.
 * @property {string} unit - Units used to measure range.
 */

/**
 * Data definition template for actors with language proficiencies.
 *
 * @property {object} proficiencies
 * @property {LanguagesData} proficiencies.languages
 */
export default class LanguagesTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			proficiencies: new SchemaField({
				languages: new SchemaField({
					value: new SetField(new StringField(), { required: true, label: "BF.Language.Dialect.Label" }),
					communication: new MappingField(new SchemaField({
						range: new NumberField({ min: 0, label: "BF.RANGE.Label" }),
						unit: new StringField({
							required: true, blank: false, initial: () => defaultUnit("distance"), label: "BF.RANGE.Unit.Label"
						})
					}), { label: "BF.Language.Communication.Label" }),
					custom: new ArrayField(new StringField(), { required: true, label: "BF.Language.Custom.Label" }),
					tags: new SetField(new StringField(), { required: true, label: "BF.Language.Tag.Label" })
				}, { label: "BF.Language.Label[other]" })
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate communication `units` to `unit`.
	 * Added in 2.0.068
	 * @param {object} source - Candidate source data to migrate.
	 */
	static _migrateCommunication(source) {
		this._migrateMappingFieldUnits(source.proficiencies?.languages?.communication);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Data Shims             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply shims to communication units.
	 */
	_shimLanguages() {
		this._shimMappingFieldUnits("proficiencies.languages.communication");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare final language labels.
	 */
	prepareLanguages() {
		const languages = this.proficiencies.languages;

		let entries;
		if ( languages.value.has("ALL") ) {
			entries = new Map([["ALL", _loc("BF.Language.All")]]);
		} else {
			entries = new Map(Array.from(languages.value).map(v => [v, Trait.keyLabel(v, { trait: "languages" })]));
		}

		languages.custom.forEach(c => entries.set(c, c));
		const extras = [];
		for ( const [key, data] of Object.entries(languages.communication) ) {
			convertAmount(data, "distance", { keys: ["range"] });
			const label = CONFIG.BlackFlag.rangedCommunication[key]?.label;
			if ( label && data.range ) extras.push(
				`${_loc(label)} ${formatDistance(data.range, data.unit)}`
			);
		}

		languages.label = formatTaggedList({
			entries, extras, tags: languages.tags, tagDefinitions: CONFIG.BlackFlag.languageTags,
			inlineTags: true, listType: "conjunction"
		});
	}
}

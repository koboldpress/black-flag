import { formatTaggedList, numberFormat, Trait } from "../../../utils/_module.mjs";
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
 * @property {string} units - Units used to measure range.
 */

/**
 * Data definition template for actors with language proficiencies.
 *
 * @property {object} proficiencies
 * @property {LanguagesData} proficiencies.languages
 */
export default class LanguagesTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			proficiencies: new SchemaField({
				languages: new SchemaField({
					value: new SetField(new StringField(), {label: "BF.Language.Dialect.Label"}),
					communication: new MappingField(new SchemaField({
						range: new NumberField({min: 0, label: "BF.Range.Label"}),
						units: new StringField({initial: "foot", label: "BF.Range.Unit.Label"})
					}), {label: "BF.Language.Communication.Label"}),
					custom: new ArrayField(new StringField(), {label: "BF.Language.Custom.Label"}),
					tags: new SetField(new StringField(), {label: "BF.Language.Tag.Label"})
				}, {label: "BF.Language.Label[other]"})
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedLanguages() {
		const languages = this.proficiencies.languages;
		const entries = new Map(Array.from(languages.value).map(v => [v, Trait.keyLabel(v, { trait: "languages" })]));
		languages.custom.forEach(c => entries.set(c, c));
		const extras = Object.entries(languages.communication).reduce((arr, [key, data]) => {
			const label = CONFIG.BlackFlag.rangedCommunication[key]?.label;
			if ( label && data.range ) arr.push(
				`${game.i18n.localize(label)} ${numberFormat(data.range, { unit: data.units })}`
			);
			return arr;
		}, []);

		languages.label = formatTaggedList({
			entries, extras, tags: languages.tags, tagDefinitions: CONFIG.BlackFlag.languageTags,
			inlineTags: true, listType: "conjunction"
		});
	}
}

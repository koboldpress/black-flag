import { numberFormat, Trait } from "../../../utils/_module.mjs";
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
		const formatters = [];
		const entries = Array.from(languages.value).map(v => Trait.keyLabel(v, { trait: "languages" }));
		entries.push(...languages.custom);
		for ( const tag of languages.tags ) {
			const config = CONFIG.BlackFlag.languageTags[tag];
			if ( config?.formatter ) formatters.push(config.formatter);
			else entries.push(game.i18n.localize(config?.display ?? tag));
		}
		let label = game.i18n.getListFormatter({ style: "short" }).format(entries);
		formatters.forEach(f => label = game.i18n.format(f, { languages: label }));

		const everything = [];
		if ( label ) everything.push(label);
		for ( const [key, data] of Object.entries(languages.communication) ) {
			const config = CONFIG.BlackFlag.rangedCommunication[key];
			if ( config && data.range ) everything.push(
				`${game.i18n.localize(config.label)} ${numberFormat(data.range, { unit: data.units })}`
			);
		}

		languages.label = game.i18n.getListFormatter({ type: "unit" }).format(everything);
	}
}

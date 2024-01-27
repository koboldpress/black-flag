import { Trait } from "../../../utils/_module.mjs";

const { SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for actors with language proficiencies.
 *
 * @property {object} proficiencies
 * @property {object} proficiencies.languages
 * @property {Set<string>} proficiencies.languages.value - Language dialects understood by actor.
 * @property {Set<string>} proficiencies.languages.tags - Additional tags describing actor's language usage.
 */
export default class LanguagesTemplate extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			proficiencies: new SchemaField({
				languages: new SchemaField({
					value: new SetField(new StringField(), {label: "BF.Language.Dialect.Label"}),
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
		for ( const tag of languages.tags ) {
			const config = CONFIG.BlackFlag.languageTags[tag];
			if ( config?.formatter ) formatters.push(config.formatter);
			else entries.push(game.i18n.localize(config?.display ?? tag));
		}
		languages.label = game.i18n.getListFormatter({ style: "short" }).format(entries);

		for ( const formatter of formatters ) {
			languages.label = game.i18n.format(formatter, { languages: languages.label });
		}
	}
}

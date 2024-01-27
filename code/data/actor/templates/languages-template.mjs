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
		this.proficiencies.languages.label = Trait.localizedList(
			this.proficiencies.languages.value, [], { style: "short", trait: "languages" }
		);
	}
}

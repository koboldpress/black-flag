import LairSheet from "../../applications/actor/lair-sheet.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import SourceField from "../fields/source-field.mjs";

const { HTMLField, NumberField, SchemaField } = foundry.data.fields;

/**
 * Data model for Lair actors.
 *
 * @property {object} description
 * @property {string} description.value - Main description of this lair.
 * @property {string} description.lairActions - Introduction to the lair actions section.
 * @property {string} description.regionalEffects - Introduction to the regional effects section.
 * @property {string} description.conclusion - Conclusion of the regional effects section.
 * @property {SourceField} description.source - Source of the lair's stat block.
 * @property {number} initiative - Fixed initiative value where lair actions can be triggered.
 */
export default class LairData extends ActorDataModel {
	/** @inheritDoc */
	static metadata = {
		type: "lair",
		category: "place",
		localization: "BF.Actor.Type.Lair",
		img: "systems/black-flag/artwork/types/lair.svg",
		sheet: {
			application: LairSheet,
			label: "BF.Sheet.Default.Lair"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField(),
				lairActions: new HTMLField(),
				regionalEffects: new HTMLField(),
				conclusion: new HTMLField(),
				source: new SourceField()
			}),
			initiative: new NumberField({ initial: 20 })
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Embeds                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(config, options = {}) {
		const context = await this.parent.sheet.getData();
		context.headerLevel = 4;
		const section = document.createElement("section");
		section.innerHTML = await renderTemplate("systems/black-flag/templates/actor/embeds/lair-embed.hbs", context);
		return section.children;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	getInitiativeRollConfig(options = {}) {
		return { fixed: this.initiative };
	}
}

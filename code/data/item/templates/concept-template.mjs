import ConceptSheet from "../../../applications/item/concept-sheet.mjs";
import log from "../../../utils/logging.mjs";
import ItemDataModel from "../../abstract/item-data-model.mjs";
import * as fields from "../../fields/_module.mjs";

/**
 * Data definition template for Concept items (class, background, lineage, heritage).
 */
export default class ConceptTemplate extends ItemDataModel {

	static get metadata() {
		return {
			register: {
				cache: true
			},
			sheet: {
				application: ConceptSheet,
				label: "BF.Sheet.Concept"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			advancement: new fields.AdvancementField(),
			description: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				journal: new foundry.data.fields.StringField({label: "BF.Item.Journal.Label", hint: "BF.Item.Journal.Hint"}),
				source: new foundry.data.fields.StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"}),
				color: new foundry.data.fields.ColorField()
			}),
			identifier: new foundry.data.fields.SchemaField({
				value: new fields.IdentifierField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onCreateApplyAdvancement(data, options, userId) {
		const progression = this.parent.actor?.system.progression;
		if ( (game.user.id !== userId) || !progression ) return;

		// Apply all advancements for this item up to current level
		// TODO: Special handling is necessary here to for classes & subclasses
		const levels = [{character: 0, class: 0}, ...Object.values(progression.levels).map(l => l.levels)];
		log(`Applying advancement for ${this.parent.name}`);
		for ( const level of levels ) {
			for ( const advancement of this.parent.advancementForLevel(level.character)) {
				await advancement.apply(level, undefined, { initial: true });
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDeleteRevertAdvancement(options, userId) {
		const progression = this.parent.actor?.system.progression;
		if ( (game.user.id !== userId) || !progression ) return;

		const levels = [{character: 0, class: 0}, ...Object.values(progression.levels).map(l => l.levels)];
		// TODO: Special handling is necessary here to for classes & subclasses
		log(`Removing advancement for ${this.parent.name}`);
		for ( const level of levels.reverse() ) {
			// TODO: These advancements should be unapplied in reverse order
			for ( const advancement of this.parent.advancementForLevel(level.character)) {
				await advancement.reverse(level);
			}
		}

		// Remove any remaining advancement data
		await this.parent.actor.update({[`system.progression.advancement.-=${this.parent.id}`]: null});
	}
}

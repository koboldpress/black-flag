import RulePageSheet from "../../applications/journal/rule-page-sheet.mjs";
import BaseDataModel from "../abstract/base-data-model.mjs";

const { HTMLField, StringField } = foundry.data.fields;

/**
 * Data definition for Rule journal entry pages.
 *
 * @property {string} tooltip - Content to display in tooltip in place of page's text content.
 * @property {string} type - Type of rule represented. Should match an entry defined in `CONFIG.BlackFlag.ruleTypes`.
 */
export default class RuleJournalPageData extends BaseDataModel {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "rule",
			localization: "BF.JournalPage.Type.Rule",
			sheet: {
				application: RulePageSheet,
				label: "BF.Sheet.Default.Rule"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			tooltip: new HTMLField({ label: "BF.Rule.Tooltip" }),
			type: new StringField({ blank: false, initial: "rule", label: "BF.Rule.Type.Label" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async richTooltip(enrichmentOptions = {}) {
		const context = {
			page: this.parent,
			type: CONFIG.BlackFlag.ruleTypes.localized[this.type],
			content: await TextEditor.enrichHTML(this.tooltip || this.parent.text.content, {
				relativeTo: this.parent,
				...enrichmentOptions
			})
		};
		return {
			content: await foundry.applications.handlebars.renderTemplate(
				"systems/black-flag/templates/journal/rule-page-tooltip.hbs",
				context
			),
			classes: ["black-flag", "black-flag-tooltip", "rule-tooltip"]
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(config, options = {}) {
		return this.parent._embedTextPage(config, options);
	}
}

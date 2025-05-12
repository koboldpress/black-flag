/**
 * Journal entry page that displays a controls for editing rule page tooltip & type.
 */
export default class JournalRulePageSheet extends (foundry.appv1?.sheets?.JournalTextPageSheet ??
	JournalTextPageSheet) {
	/** @inheritdoc */
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push("rule");
		options.includeTOC = false;
		return options;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritdoc */
	get template() {
		return this.isEditable
			? "systems/black-flag/templates/journal/rule-page-edit.hbs"
			: "templates/journal/page-text-view.html";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritdoc */
	async getData(options) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.enrichedTooltip = await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
			this.object.system.tooltip,
			{
				relativeTo: this.object,
				secrets: this.object.isOwner,
				async: true
			}
		);
		return context;
	}
}

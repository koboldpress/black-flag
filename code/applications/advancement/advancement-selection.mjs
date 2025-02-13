import PseudoDocumentSelection from "../pseudo-document-selection.mjs";

/**
 * Presents a list of advancement types to create when clicking the new advancement button.
 * Once a type is selected, this hands the process over to the advancement's individual editing interface.
 */
export default class AdvancementSelection extends PseudoDocumentSelection {
	/** @override */
	static DEFAULT_OPTIONS = {
		errorMessage: "BF.Advancement.Selection.Error",
		type: "Advancement"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return `${game.i18n.localize("BF.Advancement.Selection.Title")}: ${this.options.item.name}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get id() {
		return `item-${this.item.id}-advancement-selection`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.types = {};
		for (const [name, config] of Object.entries(CONFIG.Advancement.types)) {
			const advancement = config.documentClass;
			if (
				!(advancement.prototype instanceof BlackFlag.documents.advancement.Advancement) ||
				!config.validItemTypes.has(this.item.type) ||
				config.hidden
			)
				continue;
			context.types[name] = {
				label: game.i18n.localize(advancement.metadata.title),
				icon: advancement.metadata.icon,
				hint: game.i18n.localize(advancement.metadata.hint),
				disabled: !advancement.availableForItem(this.item)
			};
		}
		context.types = BlackFlag.utils.sortObjectEntries(context.types, { sortKey: "label" });
		context.buttonLabel = game.i18n.localize("BF.Advancement.Core.Action.Create");
		return context;
	}
}

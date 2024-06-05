import BaseActorSheet from "./base-actor-sheet.mjs";

export default class NPCSheet extends BaseActorSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "lair"],
			dragDrop: [{ dragSelector: "[data-item-id]" }],
			width: 520,
			height: null,
			scrollY: [".window-content"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static enrichedFields = {
		description: "system.description.value",
		lairActions: "system.description.lairActions",
		regionalEffects: "system.description.regionalEffects",
		conclusion: "system.description.conclusion"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareItem(item, context, section) {
		await super.prepareItem(item, context, section);
		context.activity = item.system.activities.find(a => a.activation.primary) ?? item.system.activities.contents[0];
		context.description = await TextEditor.enrichHTML(item.system.description.value, {
			secrets: false,
			rollData: item.getRollData(),
			async: true,
			relativeTo: item
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getHeaderButtons() {
		const buttons = super._getHeaderButtons();
		if (this.actor.isOwner && !this.actor.pack) {
			buttons.splice(buttons.findIndex(b => b.class === "toggle-editing-mode") + 1, 0, {
				label: "BF.Initiative.Action.Enter",
				class: "initiative",
				icon: "fa-solid fa-bolt",
				onclick: () => this.actor.configureInitiativeRoll()
			});
		}
		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async activateEditor(name, options = {}, initialContent = "") {
		options.relativeLinks = true;
		options.plugins = {
			menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
				compact: true,
				destroyOnSave: true,
				onSave: () => this.saveEditor(name, { remove: true })
			})
		};
		return super.activateEditor(name, options, initialContent);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onAction(event, dataset) {
		const { action, type } = dataset ?? event.currentTarget.dataset;
		switch (action) {
			case "add":
				Item.implementation.createDialog(
					{ "system.type.category": "monsters", "system.type.value": type },
					{ parent: this.actor, pack: this.actor.pack, types: ["feature"] }
				);
				return;
		}
		return super._onAction(event, dataset);
	}
}

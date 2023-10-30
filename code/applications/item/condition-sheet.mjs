import BaseItemSheet from "./base-item-sheet.mjs";

export default class ConditionSheet extends BaseItemSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "condition", "item", "sheet"],
			dragDrop: [{ dropSelector: ".drop-target" }],
			template: "systems/black-flag/templates/item/condition.hbs",
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.levels = context.system.levels;
		for ( const level of context.levels ) {
			level.enriched = await TextEditor.enrichHTML(level.effect.description, {
				secrets: this.item.isOwner, rollData: this.item.getRollData(), async: true, relativeTo: this.item
			});
		}
		context.multipleLevels = context.levels.length > 1;

		context.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, [key, value]) => {
			obj[value] = game.i18n.localize(`EFFECT.MODE_${key}`);
			return obj;
		}, {});

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	_activateEditor(div) {
		// NOTE: This is a hack to get around the issue of editor not working with embedded documents
		// If a sub-application is developed for active effect editing this can be removed

		const name = div.dataset.edit;
		if ( !name.startsWith("effects") ) return super._activateEditor(div);

		const engine = div.dataset.engine || "tinymce";
		const collaborate = div.dataset.collaborate === "true";
		const button = div.previousElementSibling;
		const hasButton = button && button.classList.contains("editor-edit");
		const wrap = div.parentElement.parentElement;
		const wc = div.closest(".window-content");

		// Determine the preferred editor height
		const heights = [wrap.offsetHeight, wc ? wc.offsetHeight : null];
		if ( div.offsetHeight > 0 ) heights.push(div.offsetHeight);
		const height = Math.min(...heights.filter(h => Number.isFinite(h)));

		// Get initial content
		const options = {
			target: div,
			fieldName: name,
			save_onsavecallback: () => this.saveEditor(name),
			height, engine, collaborate,
			plugins: this._configureProseMirrorPlugins(name, {remove: hasButton})
		};

		const effectId = name.split(".")[1];
		const keyPath = name.replace(`effects.${effectId}.`, "");

		// Define the editor configuration
		const editor = this.editors[name] = {
			options,
			target: name,
			button: button,
			hasButton: hasButton,
			mce: null,
			instance: null,
			active: !hasButton,
			changed: false,
			initial: foundry.utils.getProperty(this.item.effects.get(effectId), keyPath)
		};

		// Activate the editor immediately, or upon button click
		const activate = () => {
			editor.initial = foundry.utils.getProperty(this.item.effects.get(effectId), keyPath);
			this.activateEditor(name, {}, editor.initial);
		};
		if ( hasButton ) button.onclick = activate;
		else activate();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onAction(event) {
		const { action, subAction } = event.currentTarget.dataset;
		const effectId = event.target.closest("[data-effect-id]")?.dataset.effectId;
		switch (action) {
			case "change":
				const effect = this.item.effects.get(effectId);
				const changesCollection = effect.changes;
				switch (subAction) {
					case "add":
						changesCollection.push({key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: ""});
						return effect.update({changes: changesCollection});
					case "delete":
						const changeIndex = event.target.closest("[data-index]")?.dataset.index;
						changesCollection.splice(changeIndex, 1);
						return effect.update({changes: changesCollection});
				}
				break;
			case "level":
				switch (subAction) {
					case "add": return this.item.system.addLevel();
					case "delete": return this.item.system.removeLevel(effectId);
				}
				break;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		const data = foundry.utils.expandObject(formData);

		const effectUpdates = Object.entries(data.effects ?? {}).map(([_id, updates]) => {
			updates._id = _id;
			updates.changes = Object.values(updates.changes ?? {});
			const levelChange = foundry.utils.getProperty(updates, "flags.black-flag.condition.level");
			if ( levelChange ) updates.name = this.item.system._effectName(levelChange, this.item.effects.size > 1);
			return updates;
		}).filter(e => this.item.effects.has(e._id));
		delete data.effects;
		if ( !foundry.utils.isEmpty(effectUpdates) ) {
			await this.item.updateEmbeddedDocuments("ActiveEffect", effectUpdates);
		}

		return super._updateObject(event, formData);
	}
}

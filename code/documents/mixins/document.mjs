import { simplifyBonus } from "../../utils/_module.mjs";
import EmbedMixin from "./embed.mjs";

/**
 * Mixin used to share some logic between Actor & Item documents.
 * @type {function(Class): Class}
 * @mixin
 */
export default Base =>
	class extends EmbedMixin(Base) {
		/* <><><><> <><><><> <><><><> <><><><> */
		/*               Helpers               */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		static getDefaultArtwork(data = {}) {
			const dataModel = CONFIG[this.metadata.name]?.dataModels[data.type];
			const { img, texture } = super.getDefaultArtwork(data);
			return {
				img: dataModel?.metadata.img ?? img,
				texture: {
					src: dataModel?.metadata.img ?? texture?.src ?? img
				}
			};
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Description for a single part of a property attribution.
		 * @typedef {object} AttributionDescription
		 * @property {BlackFlagActiveEffect} document - Active effect document.
		 * @property {string} label - Descriptive label that will be displayed. If the label is in the form
		 *                            of an @ property, the system will try to turn it into a human-readable label.
		 * @property {number} mode - Application mode for this step as defined in
		 *                           [CONST.ACTIVE_EFFECT_MODES](https://foundryvtt.com/api/module-constants.html#.ACTIVE_EFFECT_MODES).
		 * @property {number} value - Value of this step.
		 */

		/**
		 * Break down all of the Active Effects affecting a given target property.
		 * @param {string} keyPath - The data property being targeted.
		 * @returns {AttributionDescription[]} - Any active effects that modify that property.
		 * @protected
		 */
		activeEffectAttributions(keyPath) {
			const rollData = this.getRollData({ deterministic: true });
			const attributions = [];
			for (const e of this.allApplicableEffects()) {
				let source = e.sourceName;
				if (!e.origin || e.origin === this.uuid) source = e.name;
				if (!source || e.disabled || e.isSuppressed) continue;
				const value = e.changes.reduce((n, change) => {
					if (change.key !== keyPath) return n;
					if (change.mode !== CONST.ACTIVE_EFFECT_MODES.ADD) return n;
					return n + simplifyBonus(change.value, rollData);
				}, 0);
				if (value) attributions.push({ document: e, value, label: source, mode: CONST.ACTIVE_EFFECT_MODES.ADD });
			}
			return attributions;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*       Importing and Exporting       */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @override */
		static async createDialog(data = {}, { parent = null, pack = null, types = null, ...options } = {}) {
			const documentName = this.metadata.name;
			types ??= foundry.utils.deepClone(game.documentTypes[documentName].filter(t => t !== CONST.BASE_DOCUMENT_TYPE));
			const extraTypes = new Set(types);
			if (!types.length) return null;
			const collection = parent ? null : pack ? game.packs.get(pack) : game.collections.get(this.documentName);
			const folders = collection?._formatFolderSelectOptions() ?? [];
			const label = game.i18n.localize(this.metadata.label);
			const title = game.i18n.format("DOCUMENT.Create", { type: label });

			const lastCreated = game.user.getFlag(game.system.id, "lastCreatedTypes") ?? {};
			const selectedType = data.type ?? lastCreated[documentName] ?? CONFIG[documentName]?.defaultType ?? types[0];

			let categories;
			if (!foundry.utils.isEmpty(CONFIG[documentName]?.categories)) {
				categories = {};
				for (const [key, value] of Object.entries(CONFIG[documentName]?.categories)) {
					const category = { label: game.i18n.localize(value.label), children: {} };
					for (const type of value.types) {
						if (!types.includes(type.metadata?.type)) continue;
						extraTypes.delete(type.metadata?.type);
						const name = type.fullType;
						category.children[name] = {
							label: game.i18n.localize(CONFIG[documentName]?.typeLabels?.[name] ?? name),
							chosen: name === selectedType
						};
					}
					if (!foundry.utils.isEmpty(category.children)) categories[key] = category;
				}
			}

			// Render the document creation form
			const html = await renderTemplate("systems/black-flag/templates/shared/document-create.hbs", {
				folders,
				name: data.name || game.i18n.format("DOCUMENT.New", { type: label }),
				folder: data.folder,
				hasFolders: folders.length >= 1,
				type: selectedType,
				categories,
				types: extraTypes.reduce((obj, t) => {
					const label = CONFIG[documentName]?.typeLabels?.[t] ?? t;
					obj[t] = game.i18n.localize(label);
					return obj;
				}, {})
			});

			// Render the confirmation dialog window
			return Dialog.prompt({
				title: title,
				content: html,
				label: title,
				callback: async html => {
					const form = html[0].querySelector("form");
					const fd = new FormDataExtended(form);
					foundry.utils.mergeObject(data, fd.object, { inplace: true });
					if (!data.folder) delete data.folder;
					if (types.length === 1) data.type = types[0];
					if (!data.name?.trim()) data.name = this.defaultName();
					lastCreated[documentName] = data.type;
					await game.user.setFlag(game.system.id, "lastCreatedTypes", lastCreated);
					return this.create(data, { parent, pack, renderSheet: true });
				},
				rejectClose: false,
				options
			});
		}
	};

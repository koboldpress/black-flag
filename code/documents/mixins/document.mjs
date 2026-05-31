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
		 * @property {number} type - Application type for this step as defined in active effects.
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
					if (change.type !== "add") return n;
					return n + simplifyBonus(change.value, rollData);
				}, 0);
				if (value) attributions.push({ document: e, value, label: source, type: "add" });
			}
			return attributions;
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*       Importing and Exporting       */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @override */
		static async createDialog(
			data = {},
			createOptions = {},
			{ folders, types, template, context, ...dialogOptions } = {}
		) {
			const applicationOptions = {
				top: "position",
				left: "position",
				width: "position",
				height: "position",
				scale: "position",
				zIndex: "position",
				title: "window",
				id: "",
				classes: "",
				jQuery: ""
			};

			for (const [k, v] of Object.entries(createOptions)) {
				if (k in applicationOptions) {
					foundry.utils.logCompatibilityWarning(
						"The ClientDocument.createDialog signature has changed. " +
							"It now accepts database operation options in its second parameter, " +
							"and options for DialogV2.prompt in its third parameter.",
						{ since: 13, until: 15, once: true }
					);
					const dialogOption = applicationOptions[k];
					if (dialogOption) foundry.utils.setProperty(dialogOptions, `${dialogOption}.${k}`, v);
					else dialogOptions[k] = v;
					delete createOptions[k];
				}
			}

			const { parent, pack } = createOptions;
			const documentName = this.documentName;
			const cls = this.implementation;

			// Identify allowed types
			const documentTypes = [];
			let defaultType = CONFIG[this.documentName]?.defaultType;
			let defaultTypeAllowed = false;
			let hasTypes = false;
			if (this.TYPES.length > 1) {
				if (types?.length === 0) throw new Error("The array of sub-types to restrict to must not be empty");

				// Register supported types
				for (const type of this.TYPES) {
					if (type === foundry.CONST.BASE_DOCUMENT_TYPE) continue;
					if (types && !types.includes(type)) continue;
					let label = CONFIG[this.documentName]?.typeLabels?.[type];
					label = label && game.i18n.has(label) ? _loc(label) : type;
					documentTypes.push({ value: type, label });
					if (type === defaultType) defaultTypeAllowed = true;
				}
				if (!documentTypes.length) throw new Error("No document types were permitted to be created");

				if (!defaultTypeAllowed) defaultType = documentTypes[0].value;
				// Sort alphabetically
				documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
				hasTypes = true;
			}
			types ??= foundry.utils.deepClone(game.documentTypes[documentName].filter(t => t !== CONST.BASE_DOCUMENT_TYPE));
			const extraTypes = new Set(types);

			// Identify destination collection
			let collection;
			if (!parent) {
				if (pack) collection = game.packs.get(pack);
				else collection = game.collections.get(this.documentName);
			}

			// Collect data
			folders ??= collection?._formatFolderSelectOptions() ?? [];
			const label = _loc(this.metadata.label);
			const title = _loc("DOCUMENT.Create", { type: label });

			const lastCreated = game.user.getFlag(game.system.id, "lastCreatedTypes") ?? {};
			const selectedType = data.type ?? lastCreated[documentName] ?? CONFIG[documentName]?.defaultType ?? types[0];

			let categories;
			if (!foundry.utils.isEmpty(CONFIG[documentName]?.categories)) {
				categories = {};
				for (const [key, value] of Object.entries(CONFIG[documentName]?.categories)) {
					const category = { label: _loc(value.label), children: {} };
					for (const type of value.types) {
						if (!types.includes(type.metadata?.type)) continue;
						extraTypes.delete(type.metadata?.type);
						const name = type.fullType;
						category.children[name] = {
							label: _loc(CONFIG[documentName]?.typeLabels?.[name] ?? name),
							chosen: name === selectedType
						};
					}
					if (!foundry.utils.isEmpty(category.children)) categories[key] = category;
				}
			}

			// Render the document creation form
			template ??= "systems/black-flag/templates/shared/document-create.hbs";
			const content = document.createElement("div");
			content.innerHTML = await foundry.applications.handlebars.renderTemplate(template, {
				folders: folders
					? [{ value: "", label: "" }, ...folders.map(({ id, name }) => ({ value: id, label: name }))]
					: null,
				name: data.name || _loc("DOCUMENT.New", { type: label }),
				folder: data.folder,
				hasFolders: folders.length >= 1,
				type: selectedType,
				categories,
				types: extraTypes.reduce((obj, t) => {
					const label = CONFIG[documentName]?.typeLabels?.[t] ?? t;
					obj[t] = _loc(label);
					return obj;
				}, {})
			});

			// Render the confirmation dialog window
			return foundry.applications.api.DialogV2.prompt(
				foundry.utils.mergeObject(
					{
						content,
						window: { title },
						position: { width: 360 },
						render: (event, dialog) => {
							if (!hasTypes) return;
							dialog.element.querySelector('[name="type"]').addEventListener("change", e => {
								const nameInput = dialog.element.querySelector('[name="name"]');
								nameInput.placeholder = cls.defaultName({ type: e.target.value, parent, pack });
							});
						},
						ok: {
							label: title,
							callback: (event, button) => {
								const fd = new foundry.applications.ux.FormDataExtended(button.form);
								foundry.utils.mergeObject(data, fd.object);
								if (!data.folder) delete data.folder;
								if (types.length === 1) data.type = types[0];
								if (!data.name?.trim()) data.name = this.defaultName({ type: data.type, parent, pack });
								lastCreated[documentName] = data.type;
								game.user.setFlag(game.system.id, "lastCreatedTypes", lastCreated);
								return cls.create(data, { renderSheet: true, ...createOptions });
							}
						}
					},
					dialogOptions
				)
			);
		}
	};

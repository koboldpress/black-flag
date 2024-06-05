import BackportedEmbedMixin from "./embed.mjs";

/**
 * Mixin used to share some logic between Actor & Item documents.
 * @type {function(Class): Class}
 * @mixin
 */
export default Base =>
	class extends BackportedEmbedMixin(Base) {
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
		/*        Socket Event Handlers        */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _preCreate(data, options, user) {
			let allowed = await super._preCreate(data, options, user);
			if (allowed !== false && game.release.generation < 12)
				allowed = await this.system._preCreate?.(data, options, user);
			return allowed;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _preUpdate(changed, options, user) {
			let allowed = await super._preUpdate(changed, options, user);
			if (allowed !== false && game.release.generation < 12)
				allowed = await this.system._preUpdate?.(changed, options, user);
			return allowed;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _preDelete(options, user) {
			let allowed = await super._preDelete(options, user);
			if (allowed !== false && game.release.generation < 12) allowed = await this.system._preDelete?.(options, user);
			return allowed;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_onCreate(data, options, userId) {
			super._onCreate(data, options, userId);
			if (game.release.generation < 12) this.system._onCreate?.(data, options, userId);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_onUpdate(changed, options, userId) {
			super._onUpdate(changed, options, userId);
			if (game.release.generation < 12) this.system._onUpdate?.(changed, options, userId);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_onDelete(options, userId) {
			super._onDelete(options, userId);
			if (game.release.generation < 12) this.system._onDelete?.(options, userId);
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

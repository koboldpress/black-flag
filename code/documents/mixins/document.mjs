import BackportedEmbedMixin from "./embed.mjs";

/**
 * Mixin used to share some logic between Actor & Item documents.
 * @type {function(Class): Class}
 * @mixin
 */
export default Base =>
	class extends BackportedEmbedMixin(Base) {
		static getDefaultArtwork(data = {}) {
			const dataModel = CONFIG[this.metadata.name]?.dataModels[data.type];
			const { img } = super.getDefaultArtwork(data);
			return { img: dataModel?.metadata.img ?? img };
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*        Socket Event Handlers        */
		/* <><><><> <><><><> <><><><> <><><><> */

		async _preCreate(data, options, user) {
			let allowed = await super._preCreate(data, options, user);
			if (allowed !== false && game.release.generation < 12)
				allowed = await this.system._preCreate?.(data, options, user);
			return allowed;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		async _preUpdate(changed, options, user) {
			let allowed = await super._preUpdate(changed, options, user);
			if (allowed !== false && game.release.generation < 12)
				allowed = await this.system._preUpdate?.(changed, options, user);
			return allowed;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		async _preDelete(options, user) {
			let allowed = await super._preDelete(options, user);
			if (allowed !== false && game.release.generation < 12) allowed = await this.system._preDelete?.(options, user);
			return allowed;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		_onCreate(data, options, userId) {
			super._onCreate(data, options, userId);
			if (game.release.generation < 12) this.system._onCreate?.(data, options, userId);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		_onUpdate(changed, options, userId) {
			super._onUpdate(changed, options, userId);
			if (game.release.generation < 12) this.system._onUpdate?.(changed, options, userId);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		_onDelete(options, userId) {
			super._onDelete(options, userId);
			if (game.release.generation < 12) this.system._onDelete?.(options, userId);
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*       Importing and Exporting       */
		/* <><><><> <><><><> <><><><> <><><><> */

		static async createDialog(data = {}, { parent = null, pack = null, ...options } = {}) {
			const documentName = this.metadata.name;
			const types = foundry.utils.deepClone(
				game.documentTypes[documentName].filter(t => t !== CONST.BASE_DOCUMENT_TYPE)
			);
			const folders = parent ? [] : game.folders.filter(f => f.type === documentName && f.displayed);
			const label = game.i18n.localize(this.metadata.label);
			const title = game.i18n.format("DOCUMENT.Create", { type: label });

			const lastCreated = game.settings.get(game.system.id, "lastCreatedTypes");
			const selectedType = data.type ?? lastCreated[documentName] ?? CONFIG[documentName]?.defaultType ?? types[0];

			let categories;
			if (!foundry.utils.isEmpty(CONFIG[documentName]?.categories)) {
				categories = {};
				for (const [key, value] of Object.entries(CONFIG[documentName]?.categories)) {
					categories[key] = { label: game.i18n.localize(value.label), children: {} };
					for (const type of value.types) {
						const name = type.fullType;
						categories[key].children[name] = {
							label: game.i18n.localize(CONFIG[documentName]?.typeLabels?.[name] ?? name),
							chosen: name === selectedType
						};
					}
				}
			}

			// Render the document creation form
			const html = await renderTemplate("systems/black-flag/templates/item/item-create.hbs", {
				folders,
				name: data.name || game.i18n.format("DOCUMENT.New", { type: label }),
				folder: data.folder,
				hasFolders: folders.length >= 1,
				type: selectedType,
				categories,
				types: types.reduce((obj, t) => {
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
				callback: html => {
					const form = html[0].querySelector("form");
					const fd = new FormDataExtended(form);
					foundry.utils.mergeObject(data, fd.object, { inplace: true });
					if (!data.folder) delete data.folder;
					if (types.length === 1) data.type = types[0];
					if (!data.name?.trim()) data.name = this.defaultName();
					lastCreated[documentName] = data.type;
					game.settings.set(game.system.id, "lastCreatedTypes", lastCreated);
					return this.create(data, { parent, pack, renderSheet: true });
				},
				rejectClose: false,
				options
			});
		}
	};

import BFApplication from "../api/application.mjs";

const { BooleanField, NumberField, StringField } = foundry.data.fields;

/**
 * Base application for configuring system settings.
 */
export default class BaseSettingsConfig extends BFApplication {
	/** @override */
	static DEFAULT_OPTIONS = {
		tag: "form",
		classes: ["black-flag", "standard-form", "form-list"],
		position: {
			width: 500
		},
		form: {
			closeOnSubmit: true,
			handler: BaseSettingsConfig.#onCommitChanges
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/setting/base-config.hbs"
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		context.fields = [];
		context.buttons = [
			{
				type: "submit",
				cssClass: "light-button",
				icon: "fa-solid fa-save",
				label: "BF.Action.SaveChanges"
			}
		];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create the field data for a specific setting.
	 * @param {string} name - Setting key within the dnd5e namespace.
	 * @returns {object}
	 */
	createSettingField(name) {
		const setting = game.settings.settings.get(`${game.system.id}.${name}`);
		if (!setting) throw new Error(`Setting \`${game.system.id}.${name}\` not registered.`);
		const Field = { [Boolean]: BooleanField, [Number]: NumberField, [String]: StringField }[setting.type];
		if (!Field) throw new Error("Automatic field generation only available for Boolean, Number, or String types");
		const data = {
			field: new Field({ label: game.i18n.localize(setting.name), hint: game.i18n.localize(setting.hint) }),
			name,
			value: game.settings.get(game.system.id, name)
		};
		if (setting.choices)
			data.options = Object.entries(setting.choices).map(([value, label]) => ({
				value,
				label: game.i18n.localize(label)
			}));
		return data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Commit settings changes.
	 * @this {BaseSettingsConfig}
	 * @param {SubmitEvent} event - The submission event.
	 * @param {HTMLFormElement} form - The submitted form element.
	 * @param {FormDataExtended} formData - The submitted form data.
	 * @returns {Promise}
	 */
	static async #onCommitChanges(event, form, formData) {
		let requiresClientReload = false;
		let requiresWorldReload = false;
		for (const [key, value] of Object.entries(foundry.utils.expandObject(formData.object))) {
			const current = game.settings.get(game.system.id, key);
			if (foundry.utils.getType(value) === "Object") {
				if (foundry.utils.objectsEqual(value, current)) continue;
			} else if (current === value) continue;
			await game.settings.set(game.system.id, key, value);

			const s = game.settings.settings.get(`${game.system.id}.${key}`);
			requiresClientReload ||= s.scope === "client" && s.requiresReload;
			requiresWorldReload ||= s.scope === "world" && s.requiresReload;
		}
		if (requiresClientReload || requiresWorldReload) SettingsConfig.reloadConfirm({ world: requiresWorldReload });
	}
}

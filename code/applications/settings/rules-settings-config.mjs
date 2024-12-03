import RulesSetting from "../../data/settings/rules-setting.mjs";
import BaseSettingsConfig from "./base-settings-config.mjs";

/**
 * An application for configuring variant rules.
 */
export default class RulesSettingsConfig extends BaseSettingsConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		window: {
			title: "BF.Settings.Rules.Label"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		const fields = RulesSetting.schema.fields;
		const source = game.settings.get(game.system.id, "rulesConfiguration");
		for (const [name, field] of Object.entries(fields)) {
			const data = { field, name: `rulesConfiguration.${name}`, value: source[name], localize: true };
			if (source.required[name]) {
				data.disabled = true;
				data.value = true;
				const sources = game.i18n.getListFormatter().format(source.requiredSources(name));
				data.hint = `${game.i18n.localize(field.hint)} ${game.i18n.format("BF.Settings.Rules.Required", { sources })}`;
			}
			context.fields.push(data);
		}
		return context;
	}
}

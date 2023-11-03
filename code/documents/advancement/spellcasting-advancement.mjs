import SpellcastingConfig from "../../applications/advancement/spellcasting-config.mjs";
import { SpellcastingConfigurationData } from "../../data/advancement/spellcasting-data.mjs";
import Advancement from "./advancement.mjs";

export default class SpellcastingAdvancement extends Advancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "spellcasting",
			dataModels: {
				configuration: SpellcastingConfigurationData
			},
			order: 35,
			icon: "systems/black-flag/artwork/advancement/spellcasting.svg",
			title: game.i18n.localize("BF.Advancement.Spellcasting.Title"),
			hint: game.i18n.localize("BF.Advancement.Spellcasting.Hint"),
			apps: {
				config: SpellcastingConfig
			}
		});
	}
}

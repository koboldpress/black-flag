import SizeConfig from "../../applications/advancement/size-config.mjs";
import SizeFlow from "../../applications/advancement/size-flow.mjs";
import { SizeConfigurationData, SizeValueData } from "../../data/advancement/size-data.mjs";
import Advancement from "./advancement.mjs";

export default class SizeAdvancement extends Advancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "size",
			dataModels: {
				configuration: SizeConfigurationData,
				value: SizeValueData
			},
			order: 10,
			icon: "systems/black-flag/artwork/advancement/size.svg",
			title: game.i18n.localize("BF.Advancement.Size.Title"),
			hint: game.i18n.localize("BF.Advancement.Size.Hint"),
			apps: {
				config: SizeConfig,
				flow: SizeFlow
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	warningKey(levels) {
		return `${this.relativeID}.${this.relavantLevel(levels)}.select-size`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareWarnings(levels, notifications) {
		if ( this.configuredForLevel(levels) ) return;
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`, section: "progression", level: "warn",
			message: game.i18n.localize("BF.Advancement.Size.Notification")
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	configuredForLevel(levels) {
		return !!this.value.selected;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	titleForLevel(levels, { flow=false }={}) {
		let sizes;
		if ( flow && this.value.selected ) {
			sizes = [game.i18n.localize(CONFIG.BlackFlag.sizes[this.value.selected].label)];
		} else if ( !flow ) {
			sizes = this.configuration.options.map(s => game.i18n.localize(CONFIG.BlackFlag.sizes[s].label));
		}
		if ( !sizes ) return this.title;
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { style: "short", type: "disjunction" });
		return `${this.title}: <em>${listFormatter.format(sizes)}</em>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static availableForItem(item) {
		return !item.system.advancement.byType("size").length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async apply(levels, data, { initial=false }={}) {
		if ( initial ) {
			if ( this.configuration.options.size !== 1 ) return;
			data = this.configuration.options.first();
		}
		if ( !data ) return;

		const updates = { "system.traits.size": data, [`${this.valueKeyPath}.selected`]: data };
		return await this.actor.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async reverse(levels) {
		const updates = { "system.traits.size": "", [`${this.valueKeyPath}.-=selected`]: null };
		return await this.actor.update(updates);
	}
}

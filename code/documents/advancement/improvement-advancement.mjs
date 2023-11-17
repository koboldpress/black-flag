// import ImprovementConfig from "../../applications/advancement/improvement-config.mjs";
// import ImprovementFlow from "../../applications/advancement/improvement-flow.mjs";
import { ImprovementConfigurationData, ImprovementValueData } from "../../data/advancement/improvement-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that allows player to increase one ability score and select a talent from a specific talent list.
 * **Can only be added to classes.**
 */
export default class ImprovementAdvancement extends Advancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "improvement",
			dataModels: {
				configuration: ImprovementConfigurationData,
				value: ImprovementValueData
			},
			order: 45,
			icon: "systems/black-flag/artwork/advancement/improvement.svg",
			title: game.i18n.localize("BF.Advancement.Improvement.Title"),
			hint: game.i18n.localize("BF.Advancement.Improvement.Hint"),
			// apps: {
			// 	config: ImprovementConfig,
			// 	flow: ImprovementFlow
			// }
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	warningKey(levels) {
		return `${this.relativeID}.${levels.class}.no-improvement`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareWarnings(levels, notifications) {
		if ( this.configuredForLevel(levels) ) return;
		// TODO: Display separate warnings for selecting ability & talent
		// notifications.set(this.warningKey(levels), {
		// 	category: `level-${levels.character}`, section: "progression", level: "warn",
		// 	message: game.i18n.localize("BF.Advancement.Improvement.Notification")
		// });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	configuredForLevel(levels) {
		return this.value.ability && this.value.added;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	titleForLevel(levels, { flow=false }={}) {
		return super.titleForLevel(levels, { flow });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static availableForItem(item) {
		return !item.system.advancement.byType(this.metadata.name).length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	changes(levels) {
		return [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async apply(levels, data, { initial=false, render=true }={}) {
		// TODO: Add talent & save ability
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async reverse(levels, data, { render=true }={}) {
		// TODO: Remove talent & values
	}
}

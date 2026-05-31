import { SizeConfigurationData, SizeValueData } from "../../data/advancement/size-data.mjs";
import Advancement from "./advancement.mjs";

export default class SizeAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "size",
				dataModels: {
					configuration: SizeConfigurationData,
					value: SizeValueData
				},
				order: 10,
				icon: "systems/black-flag/artwork/advancement/size.svg",
				title: "BF.Advancement.Size.Title",
				hint: "BF.Advancement.Size.Hint",
				configurableHint: true,
				singleton: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get levels() {
		return [0];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	warningKey(levels) {
		return `${this.relativeID}.${this.relavantLevel(levels)}.select-size`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareWarnings(levels, notifications) {
		if (this.configuredForLevel(levels)) return;
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`,
			section: "progression",
			level: "warn",
			message: _loc("BF.Advancement.Size.Notification")
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		return !!this.value.selected;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	titleForLevel(levels, { flow = false } = {}) {
		let sizes;
		if (flow && this.value.selected) {
			sizes = [_loc(CONFIG.BlackFlag.sizes[this.value.selected].label)];
		} else if (!flow) {
			sizes = this.configuration.options.map(s => _loc(CONFIG.BlackFlag.sizes[s].label));
		}
		if (!sizes) return this.title;
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { style: "short", type: "disjunction" });
		return `${this.title}: <em>${listFormatter.format(sizes)}</em>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	changes(levels) {
		if (!this.value.selected) return;
		return [
			{
				key: "system.traits.size",
				type: "override",
				value: this.value.selected
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		if (initial) {
			if (this.configuration.options.size !== 1) return;
			data = { size: this.configuration.options.first() };
		}
		if (!data?.size) return;

		return await this.actor.update({ [`${this.valueKeyPath}.selected`]: data.size }, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		return await this.actor.update({ [`${this.valueKeyPath}.selected`]: _del }, { render });
	}
}

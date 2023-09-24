import KeyAbilityConfig from "../../applications/advancement/key-ability-config.mjs";
import KeyAbilityFlow from "../../applications/advancement/key-ability-flow.mjs";
import { KeyAbilityConfigurationData, KeyAbilityValueData } from "../../data/advancement/key-ability-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that indicates the key & secondary ability on a class and sets the appropriate saving throw proficiencies
 * if the class is the character's original. **Can only be added to classes and each class can only have one.**
 */
export default class KeyAbilityAdvancement extends Advancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "keyAbility",
			dataModels: {
				configuration: KeyAbilityConfigurationData,
				value: KeyAbilityValueData
			},
			order: 15,
			icon: "systems/black-flag/artwork/advancement/key-ability.svg",
			title: game.i18n.localize("BF.Advancement.KeyAbility.Title"),
			hint: game.i18n.localize("BF.Advancement.KeyAbility.Hint"),
			apps: {
				config: KeyAbilityConfig,
				flow: KeyAbilityFlow
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	warningKey(levels) {
		return `${this.relativeID}.${levels.class}.no-key-ability`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareWarnings(levels, notifications) {
		if ( this.configuredForLevel(levels) ) return;
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`, section: "progression", level: "warn",
			message: game.i18n.localize("BF.Advancement.KeyAbility.Notification")
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
		if ( flow && !this.configuredForLevel(levels) ) return this.title;

		const localize = key => {
			const config = CONFIG.BlackFlag.abilities[key];
			return (config ? game.i18n.localize(config.labels.abbreviation) : key).toUpperCase();
		};

		const options = flow && this.value.selected ? [this.value.selected] : this.configuration.options;
		const key = Array.from(options).map(localize).join("/");
		const secondary = localize(this.configuration.secondary);
		const abilities = [key, secondary].filter(a => a);
		if ( !abilities.length ) return this.title;

		const listFormatter = new Intl.ListFormat(game.i18n.lang, { style: "short", type: "conjunction" });
		return `${this.title}: <em>${listFormatter.format(abilities)}</em>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static availableForItem(item) {
		return !item.system.advancement.byType("keyAbility").length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	changes(levels) {
		if ( !this.configuredForLevel(levels) ) return;
		return [{
			key: `system.abilities.${this.value.selected}.save.proficiency.multiplier`,
			mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
			value: 1
		}, {
			key: `system.abilities.${this.configuration.secondary}.save.proficiency.multiplier`,
			mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
			value: 1
		}]
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async apply(levels, data, { initial=false }={}) {
		if ( initial ) {
			if ( this.configuration.options.size !== 1 ) return;
			data = this.configuration.options.first();
		}
		if ( !data ) return;

		const updates = { [`${this.valueKeyPath}.selected`]: data };
		return await this.actor.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async reverse(levels) {
		const updates = { [`${this.valueKeyPath}.-=selected`]: null };
		return await this.actor.update(updates);
	}
}

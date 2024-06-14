import { TraitConfigurationData, TraitValueData } from "../../data/advancement/trait-data.mjs";
import SelectChoices from "../../documents/select-choices.mjs";
import { numberFormat } from "../../utils/number.mjs";
import { filteredKeys } from "../../utils/object.mjs";
import * as Trait from "../../utils/trait.mjs";
import Advancement from "./advancement.mjs";

export default class TraitAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "trait",
				dataModels: {
					configuration: TraitConfigurationData,
					value: TraitValueData
				},
				order: 30,
				icon: "systems/black-flag/artwork/advancement/trait.svg",
				title: "BF.Advancement.Trait.Title",
				hint: "BF.Advancement.Trait.Hint",
				configurableHint: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data for the Advancement.
	 */
	prepareData() {
		const traitConfig = CONFIG.BlackFlag.traits[this.bestGuessTrait()];
		this.title = this.title || game.i18n.localize(traitConfig?.labels.title || this.metadata.title);
		this.icon = this.icon || traitConfig?.icon || this.metadata.icon;
		this.identifier = this.identifier || this.title.slugify({ strict: true });
		if (!this.metadata.multiLevel) this.level ??= this.minimumLevel;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	warningKey(levels) {
		return `${this.relativeID}.${this.relavantLevel(levels)}.select-${this.title.slugify()}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareWarnings(levels, notifications) {
		if (this.configuredForLevel(levels)) return;
		const { label } = this.availableChoices() ?? {};
		if (!label) return;
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`,
			section: "progression",
			level: "warn",
			message: label
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		return this.unfulfilledChoices().available.length === 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	sortingValueForLevel(levels) {
		const traitOrder = Object.keys(CONFIG.BlackFlag.traits).findIndex(k => k === this.bestGuessTrait());
		const modeOrder = Object.keys(CONFIG.BlackFlag.traitModes).findIndex(k => k === this.configuration.mode);
		const order = traitOrder + modeOrder * 100;
		return `${this.metadata.order.paddedString(4)} ${order.paddedString(4)} ${this.titleForLevel(levels)}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		if (this.hint) return `<p>${this.hint}</p>`;
		return `<p>${Trait.localizedList(this.configuration.grants, this.configuration.choices, {
			choiceMode: this.configuration.choiceMode
		})}</p>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	changes(levels) {
		if (!this.value.selected) return;
		const changes = [];
		for (const key of this.value.selected) {
			const keyPath = Trait.changeKeyPath(key);
			const existingValue = foundry.utils.getProperty(this.actor, keyPath);
			if (foundry.utils.getType(existingValue) === "Set") {
				changes.push({
					key: keyPath,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
					value: key.split(":").pop()
				});
			} else if (this.configuration.mode !== "expertise" || existingValue !== 0) {
				changes.push({
					key: keyPath,
					mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
					value:
						this.configuration.mode === "default" || (this.configuration.mode === "upgrade" && existingValue === 0)
							? 1
							: 2
				});
			}
		}
		return changes;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		if (initial) {
			data = new Set();

			// Any grants will be included automatically
			// this.configuration.grants.forEach(k => data.add(k));

			const { available } = this.unfulfilledChoices();
			for (const { set } of available) {
				if (set.size !== 1) continue;
				data.add(set.first());
			}
		}
		if (!data?.size) return;

		const selectedCollection = this.value.selected ?? new Set();
		data.forEach(d => selectedCollection.add(d));
		return await this.actor.update({ [`${this.valueKeyPath}.selected`]: Array.from(selectedCollection) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		if (!this.value.selected) return;
		if (!data) return await this.actor.update({ [`${this.valueKeyPath}.-=selected`]: null });

		const selectedCollection = this.value.selected;
		selectedCollection.delete(data);
		return await this.actor.update({ [`${this.valueKeyPath}.selected`]: Array.from(selectedCollection) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Helper Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Two sets of keys based on actor data, one that is considered "selected" and thus unavailable to be chosen
	 * and another that is "available". This is based off configured advancement mode.
	 * @returns {{selected: Set<string>, available: Set<string>}}
	 */
	actorSelected() {
		const selected = new Set();
		const available = new Set();

		// If "default" mode is selected, return all traits
		// If any other mode is selected, only return traits that support expertise
		const traitTypes =
			this.configuration.mode === "default"
				? Object.keys(CONFIG.BlackFlag.traits)
				: filteredKeys(CONFIG.BlackFlag.traits, t => t.expertise);

		for (const trait of traitTypes) {
			const actorValues = Trait.actorValues(this.actor, trait);
			const choices = Trait.choices(trait, { prefixed: true });
			for (const key of choices.set) {
				const value = actorValues[key] ?? 0;
				if (this.configuration.mode === "default") {
					if (value >= 1) selected.add(key);
					else available.add(key);
				} else {
					if (value === 2) selected.add(key);
					if (this.configuration.mode === "expertise" && value === 1) available.add(key);
					else if (this.configuration.mode !== "expertise" && value < 2) available.add(key);
				}
			}
		}

		return { selected, available };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Guess the trait type from the grants & choices on this advancement.
	 * @param {Set<string>[]} [pools] - Trait pools to use when figuring out the type.
	 * @returns {string|void}
	 */
	bestGuessTrait(pools) {
		let trait;
		pools ??= [this.configuration.grants, ...this.configuration.choices.map(c => c.pool)];
		for (const pool of pools) {
			for (const key of pool) {
				const type = key.split(":").shift();
				if (!trait) trait = type;
				if (trait !== type) return;
			}
		}
		return trait;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the list of available traits from which the player can choose.
	 * @returns {{choices: SelectChoices, label: string}|null}
	 */
	availableChoices() {
		let { available, choices } = this.unfulfilledChoices();

		// If all traits of this type are already assigned, then nothing new can be selected
		if (foundry.utils.isEmpty(choices))
			return {
				choices,
				label: game.i18n.format("BF.Advancement.Trait.Notification", {
					count: numberFormat(available.length, { spelledOut: true }),
					type: Trait.traitLabel(this.bestGuessTrait(), available.length)
				})
			};

		// Remove any grants that have no choices remaining
		available = available.filter(a => a.set.size > 0);

		const remainingSet = new Set(available.flatMap(a => Array.from(a.set)));
		choices.filter(remainingSet);

		// Simplify label if exclusive mode and more than one set of choices still available
		const simplifyNotification =
			this.configuration.choiceMode === "exclusive" && new Set(available.map(a => a._index)).size > 1;

		return {
			choices,
			label: game.i18n.format(`BF.Advancement.Trait.Notification${simplifyNotification ? "Simple" : ""}`, {
				count: numberFormat(available.length, { spelledOut: true }),
				type: Trait.traitLabel(this.bestGuessTrait(available.map(a => a.set)), available.length)
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine which of the provided grants, if any, still needs to be fulfilled.
	 * @returns {{ available: SelectChoices[], choices: SelectChoices }}
	 */
	unfulfilledChoices() {
		const actorData = this.actorSelected();
		const selected = {
			actor: actorData.selected,
			item: this.value.selected ?? new Set()
		};

		// Duplicate choices a number of times equal to their count to get numbers correct
		const choices = Array.from(this.configuration.choices.entries()).reduce((arr, [index, choice]) => {
			const set = new Set(choice.pool);
			set._index = index;
			let count = choice.count;
			while (count > 0) {
				arr.push(set);
				count -= 1;
			}
			return arr;
		}, []);

		// If everything has already been selected, no need to go further
		if (this.configuration.grants.size + choices.length <= selected.item.size) {
			return { available: [], choices: new SelectChoices() };
		}

		let available = [
			...this.configuration.grants.map(g => Trait.mixedChoices(new Set([g]))),
			...choices.map(c => {
				const choices = Trait.mixedChoices(c);
				if (c._index !== undefined) Object.defineProperty(choices, "_index", { value: c._index, enumerable: false });
				return choices;
			})
		];
		available.sort((lhs, rhs) => lhs.set.size - rhs.set.size);

		// Remove any fulfilled grants
		if (this.configuration.choiceMode === "inclusive") this.removeFullfilledInclusive(available, selected);
		else this.removeFullfilledExclusive(available, selected);

		// Merge all possible choices into a single SelectChoices
		const allChoices = Trait.mixedChoices(actorData.available);
		allChoices.exclude(new Set([...(selected.actor ?? []), ...selected.item]));
		available = available
			.map(a => {
				const filtered = allChoices.filtered(a);
				if (a._index !== undefined) Object.defineProperty(filtered, "_index", { value: a._index, enumerable: false });
				return filtered;
			})
			.filter(a => !foundry.utils.isEmpty(a));

		return { available, choices: allChoices };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove any fulfilled grants, handling choices using the "inclusive" elimination mode.
	 * @param {Set<string>[]} available - List of grant/choice pools.
	 * @param {Set<string>} selected - Currently selected trait keys.
	 */
	removeFullfilledInclusive(available, selected) {
		for (const key of selected.item) available.findSplice(grant => grant.set.has(key));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove any fulfilled grants, handling choices using the "exclusive" elimination mode.
	 * @param {Set<string>[]} available - List of grant/choice pools.
	 * @param {Set<string>} selected - Currently selected trait keys.
	 */
	removeFullfilledExclusive(available, selected) {
		const indices = new Set(available.map(a => a._index));
		for (const key of selected.item) {
			// Remove first selected grant
			const index = available.findIndex(grant => grant.set.has(key));
			const firstMatch = available[index];
			available.splice(index, 1);

			if (firstMatch?._index !== undefined) {
				for (const index of indices) {
					if (index === firstMatch._index) continue;
					// If it has an index, remove any other choices by index that don't have this choice
					const anyMatch = available.filter(a => a._index === index).some(grant => grant.set.has(key));
					if (!anyMatch) {
						let removeIndex = available.findIndex(a => a._index === index);
						while (removeIndex !== -1) {
							available.splice(removeIndex, 1);
							removeIndex = available.findIndex(a => a._index === index);
						}
						indices.delete(index);
					}
				}
			}
		}
	}
}

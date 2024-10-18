import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Cast activities.
 */
export default class SummonSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["summon-activity"],
		actions: {
			addProfile: SummonSheet.#addProfile,
			deleteProfile: SummonSheet.#deleteProfile
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		identity: {
			template: "systems/black-flag/templates/activity/summon-identity.hbs",
			templates: super.PARTS.identity.templates
		},
		effect: {
			template: "systems/black-flag/templates/activity/summon-effect.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-effects.hbs",
				"systems/black-flag/templates/activity/parts/summon-changes.hbs",
				"systems/black-flag/templates/activity/parts/summon-profiles.hbs"
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		sheet: "identity",
		activation: "time",
		effect: "profiles"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);

		context.creatureSizeOptions = CONFIG.BlackFlag.sizes.localizedOptions;
		context.creatureTypeOptions = CONFIG.BlackFlag.creatureTypes.localizedOptions;

		context.profileModes = [
			{ value: "", label: game.i18n.localize("BF.SUMMON.FIELDS.summon.mode.Direct") },
			{ value: "cr", label: game.i18n.localize("BF.SUMMON.FIELDS.summon.mode.CR") }
		];
		context.profiles = this.activity.system.profiles
			.map((data, index) => ({
				data,
				index,
				collapsed: this.expandedSections.get(`profiles.${data._id}`) ? "" : "collapsed",
				fields: context.systemFields.profiles.element.fields,
				prefix: `system.profiles.${index}.`,
				rootId: `${context.partId}-profile-${index}`,
				source: context.source.system.profiles[index] ?? data,
				document: data.uuid ? fromUuidSync(data.uuid) : null,
				mode: this.activity.system.summon.mode,
				typeOptions:
					this.activity.system.summon.mode === "cr"
						? context.creatureTypeOptions.map(t => ({
								...t,
								selected: data.types.has(t.value)
							}))
						: null
			}))
			.sort((lhs, rhs) =>
				(lhs.name || lhs.document?.name || "").localeCompare(rhs.name || rhs.document?.name || "", game.i18n.lang)
			);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getTabs() {
		const tabs = super._getTabs();
		tabs.effect.label = "BF.SUMMON.SECTIONS.Summoning";
		tabs.effect.icon = "fa-solid fa-spaghetti-monster-flying";
		tabs.effect.tabs = this._markTabs({
			profiles: {
				id: "profiles",
				group: "effect",
				icon: "fa-solid fa-address-card",
				label: "BF.SUMMON.SECTIONS.Profiles"
			},
			changes: {
				id: "changes",
				group: "effect",
				icon: "fa-solid fa-sliders",
				label: "BF.SUMMON.SECTIONS.Changes"
			}
		});
		return tabs;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onRender() {
		super._onRender();
		this.element.querySelector(".activity-profiles").addEventListener("drop", this.#onDrop.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding a new entry to the summoning profiles list.
	 * @this {SummonSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #addProfile(event, target) {
		this.activity.update({ "system.profiles": [...this.activity.system._source.profiles, {}] });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing an entry from the summoning profiles list.
	 * @this {SummonSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #deleteProfile(event, target) {
		const profiles = this.activity.system.toObject().profiles;
		profiles.splice(target.closest("[data-index]").dataset.index, 1);
		this.activity.update({ "system.profiles": profiles });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle dropping actors onto the sheet.
	 * @param {Event} event - Triggering drop event.
	 */
	async #onDrop(event) {
		// Try to extract the data
		const data = TextEditor.getDragEventData(event);

		// Handle dropping linked items
		if (data?.type !== "Actor") return;
		const actor = await Actor.implementation.fromDropData(data);
		const profiles = this.activity.system.toObject().profiles;

		// If dropped onto existing profile, add or replace link
		const profileId = event.target.closest("[data-profile-id]")?.dataset.profileId;
		if (profileId) {
			const profile = profiles.find(p => p._id === profileId);
			profile.uuid = actor.uuid;
			this.activity.update({ "system.profiles": profiles });
		}

		// Otherwise create a new profile
		else this.activity.update({ "system.profiles": [...profiles, { uuid: actor.uuid }] });
	}
}

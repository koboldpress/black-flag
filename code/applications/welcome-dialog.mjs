import BFApplication from "./api/application.mjs";

const REMOTE_PATH = "https://koboldpress.github.io/black-flag-docs/assets/json/official-modules.json";
const LOCAL_PATH = "systems/black-flag/json/official-modules.json";

/**
 * Application that displays important links and official module information on first starting a new world.
 */
export default class WelcomeDialog extends BFApplication {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["welcome"],
		window: {
			title: "BF.WELCOME.Title",
			icon: "fa-solid fa-flag-checkered"
		},
		position: {
			width: 720,
			top: 100
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		tabs: {
			template: "templates/generic/tab-navigation.hbs"
		},
		main: {
			template: "systems/black-flag/templates/welcome-main.hbs"
		},
		modules: {
			template: "systems/black-flag/templates/welcome-modules.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		sheet: "main"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef {object} OfficialModules
	 * @property {OfficialModuleDetails[]} core - Core rules modules (e.g. Player's Guide or Monster Vault).
	 * @property {OfficialModuleDetails[]} adventures - Adventure modules.
	 */

	/**
	 * @typedef {OfficialModuleDetails}
	 * @property {string} id - Foundry ID for the module.
	 * @property {string} name - Display name in the interface.
	 * @property {string} description - Brief description in HTML.
	 * @property {string} img - Path to the artwork.
	 */

	/**
	 * Cached version of the module JSON.
	 * @type {Promise<OfficialModules|void>}
	 */
	static #modules;

	/**
	 * Information on the official modules to display.
	 * @type {Promise<OfficialModules>}
	 */
	get modules() {
		const grab = path =>
			fetch(path).then(response => {
				if (!response.ok) throw Error(`HTTP Error: ${response.status}`);
				return response.json();
			});
		if (!WelcomeDialog.#modules) WelcomeDialog.#modules = grab(REMOTE_PATH).catch(err => grab(LOCAL_PATH).catch());
		return WelcomeDialog.#modules;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mapping of modules that have had their enabled status changed.
	 * @type {Map<string, boolean>}
	 */
	get toggledModules() {
		const status = new Map();
		for (const checkbox of this.element.querySelectorAll('input[type="checkbox"]')) {
			if (checkbox.checked !== game.modules.get(checkbox.name)?.active) {
				status.set(checkbox.name, checkbox.checked);
			}
		}
		return status;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		return {
			...(await super._prepareContext(options)),
			modules: await this.modules,
			tabs: this._getTabs()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "main":
				return this._prepareMainContext(context, options);
			case "modules":
				return this._prepareModulesContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the main tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareMainContext(context, options) {
		context.tab = context.tabs.main;
		context.message = `
			${game.i18n.localize("BF.WELCOME.Message.Introduction")}
			<ul>
			  <li>${game.i18n.localize("BF.WELCOME.Message.Documentation")}</li>
				<li>${game.i18n.localize("BF.WELCOME.Message.Content")}</li>
				<li>${game.i18n.localize("BF.WELCOME.Message.Bugs")}</li>
			</ul>
		`.replace(
			/<documentation-link>(?<content>[^<]+)<\/documentation-link>/i,
			`
			<a href="https://koboldpress.github.io/black-flag-docs/">$<content></a>
		`
		);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the modules tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareModulesContext(context, options) {
		context.tab = context.tabs.modules;
		if (!context.modules) return context;
		context.modules = foundry.utils.deepClone(context.modules);
		for (const category of Object.values(context.modules)) {
			for (const module of category) {
				const config = game.modules.get(module.id);
				module.installed = !!config;
				module.enabled = config?.active === true;
			}
		}
		context.disabled = !game.user.isGM;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the tab information for the sheet.
	 * @returns {Record<string, Partial<ApplicationTab>>}
	 * @protected
	 */
	_getTabs() {
		const tabs = {
			main: {
				id: "main",
				group: "sheet",
				icon: "fa-solid fa-face-grin-stars",
				label: "BF.WELCOME.SECTION.Main"
			},
			modules: {
				id: "modules",
				group: "sheet",
				icon: "fa-solid fa-play",
				label: "BF.WELCOME.SECTION.Modules"
			}
		};
		for (const v of Object.values(tabs)) {
			v.active = this.tabGroups[v.group] === v.id;
			v.cssClass = v.active ? "active" : "";
		}
		return tabs;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preClose(options) {
		await super._preClose(options);
		game.settings.set(game.system.id, "_firstRun", false);
		const toggled = this.toggledModules;
		if (toggled.size) {
			const moduleConfiguration = game.modules.values().reduce((obj, config) => {
				obj[config.id] = toggled.get(config.id) ?? config.active;
				return obj;
			}, {});
			await game.settings.set("core", "moduleConfiguration", moduleConfiguration);
			SettingsConfig.reloadConfirm({ world: true });
		}
	}
}

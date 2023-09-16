import { sortObjectEntries } from "../utils/objects.mjs";
import log from "../utils/logging.mjs";
import { slugify } from "../utils/text.mjs";

/**
 * @typedef {object} ItemRegistration
 * @property {string} name - Item's name.
 * @property {string} img - Item's icon.
 * @property {string[]} source - UUIDs of where this item is defined.
 */

/**
 * Registered item information grouped by type and identifier.
 * @type {{[key: string]: {[key: string]: ItemRegistration}}}
 * @private
 */
export const all = {};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Has the initial registration been completed?
 * @type {boolean}
 */
export let ready = false;

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Documents that will be reinitialized when registration is ready to ensure they can access cached data.
 * @type {Document[]}
 */
export const reinitiatlizeOnReady = new Set();

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                         Lookup                        */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Fetch the item registration for the provided identifier if it exists.
 * @param {string} type - Item type to get.
 * @param {string} identifier - Identifier to get.
 * @returns {ItemRegistration|undefined}
 */
export function get(type, identifier) {
	return all[type]?.[identifier];
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @callback RegistrationFilterCallback
 * @param {Document} element - The current element being processed.
 * @param {string} identifier - Identifier of the item.
 * @returns {boolean}
 */

/**
 * Filter registered items.
 * @param {string} type - Item type to filter.
 * @param {RegistrationFilterCallback} [callbackFn] - Function executed to perform the filtering.
 * @returns {{[key: string]: ItemRegistration}|undefined}
 */
export async function filter(type, callbackFn) {
	let obj = list(type);
	if ( !obj ) return;
	obj = foundry.utils.deepClone(obj);
	for ( const [identifier, data] of Object.entries(obj) ) {
		const element = await fromUuid(data.sources[data.sources.length - 1]);
		if ( !element ) return obj;
		if ( callbackFn && !callbackFn(element, identifier) ) delete obj[identifier];
	}
	return obj;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Fetch all registered items of the specified type.
 * @param {string} type - Item type to list.
 * @returns {{[key: string]: ItemRegistration}|undefined}
 */
export function list(type) {
	return all[type];
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                      Registration                     */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register all item types with `register` to to `true` in their metadata.
 * @private
 */
export function registerItemTypes() {
	const indexes = _indexCompendiums();
	log("Preparing central item registrations");
	const registrations = [];
	for ( const type of Item.TYPES ) {
		const dataModel = CONFIG.Item.dataModels[type];
		if ( !dataModel?.metadata?.register ) continue;
		registrations.push(_registerItemType(dataModel.metadata.type, indexes));
	}

	// When all settled, populate registration, set to ready, and emit registration complete hook
	Promise.all(registrations).then(registrations => {
		registrations.forEach(r => all[r.type] = r.registrations);
		ready = true;
		log("Central item registration setup complete");

		/**
		 * A hook event that fires when startup item registration is complete.
		 * @function blackFlag.registrationComplete
		 * @memberof hookEvents
		 */
		Hooks.callAll("blackFlag.registrationComplete");

		reinitiatlizeOnReady.forEach(d => d.reset());
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register all items of the specified type within compendiums or the world. Should only be called once per item type.
 * @param {string} type - Item type to register.
 * @param {Map[]} [indexes] - Previously prepared indexes of all Item compendiums.
 * @returns {{
 *   type: string,
 *   shouldCache: boolean,
 *   registrations: {[key: string]: ItemRegistration}
 * }}
 * @private
 */
async function _registerItemType(type, indexes) {
	const config = CONFIG.Item.dataModels[type].metadata.register;

	indexes = await (indexes ?? _indexCompendiums());
	const registerItem = (item, uuidPrefix) => {
		const identifier = item.system?.identifier?.value ?? slugify(item.name, { strict: true });
		registrations[identifier] ??= { sources: [] };
		registrations[identifier].name = item.name;
		registrations[identifier].img = item.img;
		registrations[identifier].sources.push(`${uuidPrefix}.${item._id}`);
	};

	log(`Registering ${type} items`, {level: "groupCollapsed"});
	const registrations = {};
	for ( const [pack, index] of Object.entries(indexes) ) {
		for ( const item of index ) {
			const dataModel = CONFIG.Item.dataModels[item.type];
			if ( dataModel?.metadata.type !== type ) continue;
			log(`Registering ${item.name} from ${pack}`);
			registerItem(item, `Compendium.${pack}`);
		}
	}
	for ( const item of game.items.values() ) {
		if ( item.system.constructor.metadata?.type !== type ) continue;
		log(`Registering ${item.name} in world`);
		registerItem(item, "Item");
	}
	console.groupEnd();

	if ( config?.cache === true ) await Promise.all(
		Object.values(registrations).map(async r => r.cached = await fromUuid(r.sources[0]))
	);

	return {
		type,
		shouldCache: config?.cache === true,
		registrations: sortObjectEntries(registrations, "name")
	};
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Enable the hooks needed to handle registration changes during item CRUD operations.
 */
export function setupRegistrationHooks() {
	Hooks.on("createItem", _onCreateItem);
	Hooks.on("preUpdateItem", _preUpdateItem);
	Hooks.on("updateItem", _onUpdateItem);
	Hooks.on("deleteItem", _onDeleteItem);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

const message = operation => `Attempted to ${operation} item before registration was completed which may lead to invalid registration data. Wait until the "blackFlag.registrationComplete" hook has fired or "CONFIG.BlackFlag.registration.ready" is true before performing any automatic item management.`;

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register a new item type when an item is created.
 * @param {BlackFlagItem} item - Newly created item.
 * @param {object} options - Item creation options.
 * @param {string} userId - ID of the user that created the item.
 */
function _onCreateItem(item, options, userId) {
	if ( item.isEmbedded || !item.system.constructor.metadata.register ) return;
	if ( !ready ) log(message("create"), { level: "warn" });
	const type = item.system.constructor.metadata.type;
	let source = all[type] ??= {};
	if ( !source ) source = all[type] = {};
	_handleCreate(source, item.identifier, item);

	all[type] = sortObjectEntries(source, "name");
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Store the item's identifier before it is changed.
 * @param {BlackFlagItem} item - Updated item.
 * @param {object} changes - Changes being made.
 * @param {object} options - Item update options.
 * @param {string} userId - ID of the user that update the item.
 */
function _preUpdateItem(item, changes, options, userId) {
	options.blackFlag ??= {};
	options.blackFlag.identifier = item.identifier;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Update a registered item's name or image if it is the primary for an identifier or move
 * if its identifier has changed.
 * @param {BlackFlagItem} item - Updated item.
 * @param {object} changes - Changes that were made.
 * @param {object} options - Item update options.
 * @param {string} userId - ID of the user that update the item.
 */
function _onUpdateItem(item, changes, options, userId) {
	if ( item.isEmbedded || !item.system.constructor.metadata.register ) return;
	if ( !ready ) log(message("update"), { level: "warn" });
	const type = item.system.constructor.metadata.type;
	const source = all[type] ??= {};

	// Identifier has changed, move this to the new location
	if ( item.identifier !== options.blackFlag?.identifier ) {
		if ( !source[item.identifier] ) _handleCreate(source, item.identifier, item);
		else source[item.identifier].sources.push(item.uuid);
		_handleDelete(source, options.blackFlag.identifier, item);
	} else if ( !source[item.identifier] ) _handleCreate(source, item.identifier, item);

	// Cached values should only be updated if this is the last item in the sources list
	const idx = source[item.identifier].sources.findIndex(i => i === item.uuid);
	if ( idx !== source[item.identifier].sources.length - 1 ) return;
	source[item.identifier].name = item.name;
	source[item.identifier].img = item.img;

	all[type] = sortObjectEntries(source, "name");
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Un-register an item when it has been deleted.
 * @param {ItemEH} item - Deleted item.
 * @param {object} options - Item deletion options.
 * @param {string} userId - ID of the user that deleted the item.
 */
function _onDeleteItem(item, options, userId) {
	if ( item.isEmbedded || !item.system.constructor.metadata.register ) return;
	if ( !ready ) log(message("delete"), { level: "warn" });
	const type = item.system.constructor.metadata.type;
	const source = all[type] ??= {};
	if ( !source?.[item.identifier] ) return;
	_handleDelete(source, item.identifier, item);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                         Utils                         */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle creating an entry.
 * @param {{[key: string]: ItemRegistration}} source - Item registration for this item's type.
 * @param {string} identifier - Identifier to use for creating the entry.
 * @param {ItemEH} item - Item being created.
 */
function _handleCreate(source, identifier, item) {
	source[identifier] ??= { sources: [] };
	source[identifier].name = item.name;
	source[identifier].img = item.img;
	source[identifier].sources.push(item.uuid);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle deleting an entry.
 * @param {{[key: string]: ItemRegistration}} source - Item registration for this item's type.
 * @param {string} identifier - Identifier to use when deleting entry.
 * @param {ItemEH} item - Item being deleted.
 */
function _handleDelete(source, identifier, item) {
	source[identifier].sources.findSplice(i => i === item.uuid);
	if ( source[identifier].sources.length === 0 ) {
		delete source[identifier];
		return;
	}
	const newSource = fromUuidSync(source[identifier].sources[source[identifier].sources.length - 1]);
	source[identifier].name = newSource.name;
	source[identifier].img = newSource.img;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Re-index all Item compendiums to include the identifier.
 * @returns {{[key: string]: Collection}}
 * @private
 */
async function _indexCompendiums() {
	return Object.fromEntries(await Promise.all(Array.from(game.packs.entries())
		.filter(p => p[1].metadata.type === "Item")
		.map(async p => [p[0], await p[1].getIndex({ fields: ["system.identifier.value"] })])
	));
}

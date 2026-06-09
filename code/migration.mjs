import { log } from "./utils/_module.mjs";

const migrationMethods = new Map([
	["ActiveEffect", migrateActiveEffect],
	["Actor", migrateActor],
	["Item", migrateItem],
	["Scene", migrateScene]
]);

/**
 * Check whether this world needs migration and perform the migration if necessary.
 * @returns {Promise|void}
 */
export function _migrate() {
	if (!game.user.isGM) return;

	const lastVersion =
		game.settings.get(game.system.id, "_lastMigratedVersion") ?? game.world.flags[game.system.id]?.version;

	// Worlds don't need migration when first created
	if (!lastVersion && _countWorldDocuments() === 0) {
		return game.settings.get(game.system.id, "_lastMigratedVersion", game.system.version);
	}

	// If already migrated on this version or later, no migration required
	if (
		lastVersion &&
		!foundry.utils.isNewerVersion(game.system.flags[game.system.id]?.needsMigrationVersion, lastVersion)
	) {
		return;
	}

	// Perform the migration
	return migrateWorld();
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Perform a system migration for the world.
 * @param {object} [options={}]
 * @param {boolean} [options.bypassVersionCheck=false] - Bypass certain migration restrictions gated behind system
 *                                                       version stored in item stats.
 * @returns {Promise}
 */
export async function migrateWorld({ bypassVersionCheck = false } = {}) {
	const version = game.system.version;
	const progress = ui.notifications.info("BF.Migration.World.Begin", {
		console: false,
		format: { version },
		permanent: true,
		progress: true
	});
	const { packs, packDocuments } = game.packs.reduce(
		(obj, pack) => {
			if (_shouldMigrateCompendium(pack)) {
				obj.packs.push(pack);
				obj.packDocuments += pack.index.size;
			}
			return obj;
		},
		{ packs: [], packDocuments: 0 }
	);
	const tokenDocuments = game.scenes.reduce((total, s) => total + s.tokens.size, 0);
	const totalDocuments = tokenDocuments + packDocuments + _countWorldDocuments();
	let migrated = 0;
	const incrementProgress = () => progress.update({ pct: ++migrated / totalDocuments });

	let hasErrors = false;
	const logError = (err, type, name) => {
		err.message = `Migration failed for ${type} ${name}: ${err.message}`;
		console.error(err);
		hasErrors = true;
	};

	for (const documentName of CONST.ALL_DOCUMENT_TYPES) {
		const collection = game.collections.get(documentName);
		const documentClass = getDocumentClass(documentName);
		const migrate = migrationMethods.get(documentName);
		if (!collection || !migrate) continue;

		const documents = collection
			.map(d => [d, true])
			.concat(Array.from(collection.invalidDocumentIds).map(id => [collection.getInvalid(id), false]));
		const operations = [];
		const mergeOptions = { inplace: false, applyOperators: true };
		log(`Migrating ${documents.length} ${documentName} documents in World`);
		for (const [doc, valid] of documents) {
			try {
				const options = { bypassVersionCheck, logError, incrementProgress, operations, persistSourceMigration: false };
				const source = valid ? doc.toObject() : game.data[documentClass.collection].find(d => d._id === doc.id);
				let updateData = migrate(doc, source, options);
				if (foundry.utils.isEmpty(updateData)) continue;

				log(`Migrating ${documentName} document ${doc.name} [${doc.uuid}]`);
				if (options.persistSourceMigration) updateData = _persistUpdates(documentClass, source, updateData);
				operations.push({
					action: "update",
					documentName,
					updates: [{ _id: doc.id, ...updateData }],
					diff: valid && !options.persistSourceMigration,
					recursive: !options.persistSourceMigration
				});
			} catch (err) {
				logError(err, documentName, doc.name);
			} finally {
				incrementProgress();
			}
		}

		await foundry.documents.modifyBatch(operations);
		log(`Migrated all ${documentName} documents in World`);
	}

	// Migrate Compendium Packs
	for (const pack of packs) {
		await migrateCompendium(pack, { incrementProgress });
	}

	// Set the migration as complete
	game.settings.set(game.system.id, "_lastMigratedVersion", game.system.version);
	progress.element?.classList.add(hasErrors ? "warning" : "success");
	progress.update({ message: "BF.Migration.World.Complete", format: { version }, pct: 1 });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Apply migration rules to all Documents within a single Compendium pack
 * @param {CompendiumCollection} pack - Pack to be migrated.
 * @param {object} [options={}]
 * @param {boolean} [options.bypassVersionCheck=false] - Bypass certain migration restrictions gated behind system
 *                                                       version stored in document stats.
 * @param {Function} [options.incrementProgress] - Function that can be called to increment the global progress bar.
 * @param {boolean} [options.strict=false] - Migrate errors should stop the whole process.
 * @returns {Promise}
 */
export async function migrateCompendium(pack, { bypassVersionCheck = false, incrementProgress, strict = false } = {}) {
	const migrate = migrationMethods.get(pack.documentName);
	if (!migrate) return;

	const format = { compendium: pack.collection, version: game.system.version };
	const progress = ui.notifications.info("BF.Migration.Compendium.Migrate", { console: false, format, progress: true });
	let migrated = 0;

	let hasErrors = false;
	const logError = (err, type, name) => {
		err.message = `Migration failed for document ${name} in pack ${pack.collection}: ${err.message}`;
		console.error(err);
		hasErrors = true;
	};

	// Unlock the pack for editing
	const wasLocked = pack.locked;
	try {
		await pack.configure({ locked: false });
		game.compendiumArt.enabled = false;

		// Begin by requesting server-side data model migration and get the migrated content
		const documents = await pack.getDocuments();
		const mergeOptions = { inplace: false, applyOperators: true };
		const operations = [];
		log(`Migrating ${documents.length} ${pack.documentName} documents in Compendium ${pack.collection}`);

		// Iterate over compendium entries - applying fine-tuned migration functions
		for (let doc of documents) {
			try {
				const options = { bypassVersionCheck, logError, operations, persistSourceMigration: false };
				const source = doc.toObject();
				let updateData = migrate(doc, source, options);
				if (foundry.utils.isEmpty(updateData)) continue;

				log(`Migrating ${pack.documentName} document ${doc.name} in Compendium ${pack.collection}`);
				if (options.persistSourceMigration) updateData = _persistUpdates(pack.documentClass, source, updateData);
				operations.push({
					action: "update",
					documentName: pack.documentName,
					updates: [{ _id: doc.id, ...updateData }],
					pack: pack.metadata.id,
					diff: !options.persistSourceMigration,
					recursive: !options.persistSourceMigration
				});
			} catch (err) {
				logError(err, pack.documentName, doc.name);
				if (strict) {
					progress.element?.classList.add("error");
					progress.update({ format, message: "BF.Migration.Compendium.Failed" });
					throw err;
				}
			} finally {
				incrementProgress?.();
				progress.update({ pct: ++migrated / pack.index.size });
			}
		}

		await foundry.documents.modifyBatch(operations);
		log(`Migrated all ${pack.documentName} documents in Compendium ${pack.collection}`);
	} finally {
		// Apply the original locked status for the pack
		await pack.configure({ locked: wasLocked });
		game.compendiumArt.enabled = true;
	}

	progress.element?.classList.add(hasErrors ? "warning" : "success");
	progress.update({ format, message: "BF.Migration.Compendium.Migrate", pct: 1 });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Actors                         */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Migrate a single Actor document.
 * @param {Actor} actor - Full document instance.
 * @param {object} source - Document's raw source data.
 * @param {object} [options={}] - Migration options.
 * @returns {object} - The update data to apply.
 */
function migrateActor(actor, source, options = {}) {
	const updateData = {};

	// Migrate embedded effects
	const effectUpdateData = _migrateEmbeddedDocuments("ActiveEffect", actor, source, options);
	if (effectUpdateData.length > 0) updateData.effects = effectUpdateData;

	// Migrate embedded items
	const itemUpdateData = _migrateEmbeddedDocuments("Item", actor, source, options);
	if (itemUpdateData.length > 0) updateData.items = itemUpdateData;

	return updateData;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Effects                        */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Migrate a single ActiveEffect document.
 * @param {ActiveEffect} effect - Full document instance.
 * @param {object} source - Document's raw source data.
 * @param {object} [options={}] - Migration options.
 * @returns {object} - The update data to apply.
 */
function migrateActiveEffect(effect, source, options = {}) {
	const updateData = {};

	return updateData;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                         Items                         */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Migrate a single Item document.
 * @param {Item} item - Full document instance.
 * @param {object} source - Document's raw source data.
 * @param {object} [options={}] - Migration options.
 * @returns {object} - The update data to apply.
 */
function migrateItem(item, source, options = {}) {
	const updateData = {};

	// Migrate embedded effects
	const effectUpdateData = _migrateEmbeddedDocuments("ActiveEffect", item, source, options);
	if (effectUpdateData.length > 0) updateData.effects = effectUpdateData;

	return updateData;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Scenes                         */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Migrate a single Scene document.
 * @param {Scene} scene - Full document instance.
 * @param {object} source - Document's raw source data.
 * @param {object} [options={}] - Migration options.
 * @returns {object} - The update data to apply.
 */
function migrateScene(scene, source, options = {}) {
	const { bypassVersionCheck, incrementProgress, logError, operations } = options;
	const updateData = {};

	// Migrate ActorDeltas individually in order to avoid issues with ActorDelta bulk updates.
	for (const token of scene.tokens) {
		if (token.actorLink || !token.actor) {
			incrementProgress?.();
			continue;
		}
		try {
			const options = { bypassVersionCheck, persistSourceMigration: false };
			const source = token.actor.toObject();
			let updateData = migrateActor(token.actor, source, options);
			if (!foundry.utils.isEmpty(updateData)) {
				log(`Migrating ActorDelta document ${token.actor.name} in Scene ${scene.name} [${token.actor.uuid}]`);
				if (options.persistSourceMigration) {
					updateData = foundry.utils.mergeObject(source, updateData, { inplace: false });
				} else {
					// Workaround for core issue of bulk updating ActorDelta collections.
					["items", "effects"].forEach(col => {
						for (const [i, update] of (updateData[col] ?? []).entries()) {
							const original = token.actor[col].get(update._id);
							updateData[col][i] = foundry.utils.mergeObject(original.toObject(), update, { inplace: false });
						}
					});
				}
				operations.push({
					action: "update",
					documentName: "ActorDelta",
					updates: [{ _id: token.delta.id, ...updateData }],
					parent: token,
					enforceTypes: false,
					diff: !options.persistSourceMigration,
					recursive: !options.persistSourceMigration
				});
			}
		} catch (err) {
			logError(err, "ActorDelta", `[${token.uuid}]`);
		}
		incrementProgress?.();
	}

	return updateData;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Helpers                        */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Count the number of documents that are in the world needing migration.
 * @returns {number}
 */
function _countWorldDocuments() {
	let count = 0;
	for (const documentName of migrationMethods.keys()) {
		count += game.collections.get(documentName)?.size ?? 0;
	}
	return count;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle migrating all embedded collections within a document.
 * @param {string} documentName - Name of child documents to migrate.
 * @param {Document} parent - Parent document that contains child collection.
 * @param {object} source - Parent document's raw source data.
 * @param {object} [options={}] - Migration options.
 * @param {Function} [options.callback] - Method called on each child for additional migration.
 * @returns {object[]} - The update data to apply.
 */
function _migrateEmbeddedDocuments(documentName, parent, source, options = {}) {
	const collectionName = parent.constructor.metadata.embedded?.[documentName];
	const collection = parent[collectionName];
	const migrate = migrationMethods.get(documentName);
	const updateData = [];
	if (!collection || !migrate) return updateData;

	for (const childSource of source[collectionName] ?? []) {
		const child = collection.get(childSource._id) ?? collection.getInvalid(childSource._id);
		if (child) {
			const childUpdateData = migrate(child, childSource, options);
			options.callback?.(child, childSource, childUpdateData, options);
			if (!foundry.utils.isEmpty(childUpdateData)) {
				childUpdateData._id = childSource._id;
				updateData.push(foundry.utils.expandObject(childUpdateData));
			}
		}
	}

	return updateData;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle merging update data into source data when `persistSourceMigration` is set.
 * @param {typeof Document} documentClass - Class of document being merged.
 * @param {object} source - Document's raw source data.
 * @param {object} updateData - The update data to apply.
 * @param {object} [mergeOptions={}] - Options used for the merging.
 */
function _persistUpdates(documentClass, source, updateData, mergeOptions = { inplace: false, applyOperators: true }) {
	for (const collectionName of Object.values(documentClass.metadata.embedded)) {
		if (!(collectionName in updateData)) continue;
		updateData[collectionName] = (source[collectionName] ?? []).map(s =>
			foundry.utils.mergeObject(s, updateData[collectionName].find(u => u._id === s._id) ?? {}, mergeOptions)
		);
	}
	return foundry.utils.mergeObject(source, updateData, mergeOptions);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Determine whether a compendium pack should be migrated during `migrateWorld`.
 * @param {Compendium} pack
 * @returns {boolean}
 */
function _shouldMigrateCompendium(pack) {
	// We only care about compendiums that have migration methods
	if (!migrationMethods.has(pack.documentName)) return false;

	// World compendiums should all be migrated, system ones should never by migrated
	if (pack.metadata.packageType === "world") return true;
	if (pack.metadata.packageType === "system") return false;

	// Module compendiums should only be migrated if they don't have a download or manifest URL
	const module = game.modules.get(pack.metadata.packageName);
	return !module.download && !module.manifest;
}

/**
 * Recreate all documents in the compendium to commit any migrations and clean any deprecated data.
 * @param {CompendiumCollection} pack - Pack to refresh.
 */
export async function refreshCompendium(pack) {
	if ( !pack?.documentName ) return;
	const DocumentClass = CONFIG[pack.documentName].documentClass;
	const wasLocked = pack.locked;
	await pack.configure({ locked: false });
	await pack.migrate();

	ui.notifications.info(`Beginning to refresh Compendium ${pack.collection}`);
	const documents = await pack.getDocuments();
	for ( const doc of documents ) {
		const data = doc.toObject();
		await doc.delete();
		await DocumentClass.create(data, { keepId: true, keepEmbeddedIds: true, pack: pack.collection });
	}
	await pack.configure({ locked: wasLocked });
	ui.notifications.info(`Refreshed all documents from Compendium ${pack.collection}`);
}

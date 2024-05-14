/**
 * Creates an HTML document link for the provided UUID.
 * @param {string} uuid - UUID for which to produce the link.
 * @param {object} [options={}]
 * @param {boolean} [options.element=false] - Should a HTMLElement be returned?
 * @returns {string|HTMLElement|void} - Link to the item or empty string if item wasn't found.
 */
export function linkForUUID(uuid, { element=false }={}) {
	let doc = fromUuidSync(uuid);
	if ( !doc ) return;

	if ( uuid.startsWith("Compendium.") && !(doc instanceof foundry.abstract.Document) ) {
		const { collection } = foundry.utils.parseUuid(uuid);
		const cls = collection.documentClass;
		doc = new cls(foundry.utils.deepClone(doc), { pack: collection.metadata.id });
	}

	const result = doc?.toAnchor();
	return element ? result : result.outerHTML;
}

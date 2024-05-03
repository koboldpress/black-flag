/**
 * Creates an HTML document link for the provided UUID.
 * @param {string} uuid - UUID for which to produce the link.
 * @param {object} [options={}]
 * @param {boolean} [options.element=false] - Should a HTMLElement be returned?
 * @returns {string|HTMLElement} - Link to the item or empty string if item wasn't found.
 */
export function linkForUUID(uuid, { element=false }={}) {
	let result;

	if ( game.release.generation < 12 ) result = TextEditor._createContentLink(["", "UUID", uuid]);

	// TODO: When v11 support is dropped we can make this method async and return to using TextEditor._createContentLink.
	else if ( uuid.startsWith("Compendium.") ) {
		let [, scope, pack, documentName, id] = uuid.split(".");
		if ( !CONST.PRIMARY_DOCUMENT_TYPES.includes(documentName) ) id = documentName;
		const data = {
			classes: ["content-link"],
			dataset: {},
			attrs: { draggable: "true" }
		};
		TextEditor._createLegacyContentLink("Compendium", [scope, pack, id].join("."), "", data);
		data.dataset.link = "";
		result = TextEditor.createAnchor(data);
	}

	else result = fromUuidSync(uuid).toAnchor();

	return element ? result : result.outerHTML;
}

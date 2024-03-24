/**
 * Creates an HTML document link for the provided UUID.
 * @param {string} uuid - UUID for which to produce the link.
 * @param {object} [options={}]
 * @param {boolean} [options.element=false] - Should a HTMLElement be returned?
 * @returns {string|HTMLElement} - Link to the item or empty string if item wasn't found.
 */
export function linkForUUID(uuid, { element=false }={}) {
	if ( game.release.generation < 12 ) {
		const result = TextEditor._createContentLink(["", "UUID", uuid]);
		return element ? result : result.outerHTML;
	}

	// TODO: When v11 support is dropped we can make this method async and return to using TextEditor._createContentLink.
	if ( uuid.startsWith("Compendium.") ) {
		let [, scope, pack, documentName, id] = uuid.split(".");
		if ( !CONST.PRIMARY_DOCUMENT_TYPES.includes(documentName) ) id = documentName;
		const data = {
			classes: ["content-link"],
			attrs: { draggable: "true" }
		};
		TextEditor._createLegacyContentLink("Compendium", [scope, pack, id].join("."), "", data);
		data.dataset.link = "";
		return TextEditor.createAnchor(data).outerHTML;
	}
	return fromUuidSync(uuid).toAnchor().outerHTML;
}

/**
 * Creates an HTML document link for the provided UUID.
 * @param {string} uuid - UUID for which to produce the link.
 * @returns {string} - Link to the item or empty string if item wasn't found.
 */
export function linkForUUID(uuid) {
	return TextEditor._createContentLink(["", "UUID", uuid]).outerHTML;
}

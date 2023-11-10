/**
 * Creates an HTML document link for the provided UUID.
 * @param {string} uuid - UUID for which to produce the link.
 * @param {object} [options={}]
 * @param {boolean} [options.element=false] - Should a HTMLElement be returned?
 * @returns {string|HTMLElement} - Link to the item or empty string if item wasn't found.
 */
export function linkForUUID(uuid, { element=false }={}) {
	const result = TextEditor._createContentLink(["", "UUID", uuid]);
	return element ? result : result.outerHTML;
}

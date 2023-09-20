/**
 * Insert a new element into an array in a specific position.
 * @param {Array} array - Array into which to insert.
 * @param {*} toInsert - Element to insert.
 * @param {{after: [*|Function], before: [*|Function]}[]} positions - List of objects that describe where the new
 *                                                                    element should be inserted, if matching elements
 *                                                                    are found, or functions to call to do the same.
 * @returns {number} - Index of the newly inserted element.
 */
export function insertBetween(array, toInsert, positions) {
	for ( const position of positions ) {
		let matcher = position.after ?? position.before;
		if ( foundry.utils.getType(matcher) !== "function" ) matcher = e => e === (position.after ?? position.before);
		let insertIdx = array.findIndex(matcher);
		if ( insertIdx === -1 ) continue;
		if ( position.after ) insertIdx += 1;
		array.splice(insertIdx, 0, toInsert);
		return insertIdx;
	}
	array.push(toInsert);
	return array.length - 1;
}

import * as filter from "./filter.mjs";

/**
 * Search compendiums for documents that match the given options.
 * @param {typeof Document} documentClass - Class of document should be searched (e.g. Actor or Item).
 * @param {object} [options={}]
 * @param {string} [options.type] - Individual document subtype to find (e.g. "talent" or "spell").
 * @param {Set<string>} [options.types] - Set of document subtypes to find.
 * @param {FilterDescription} [options.filters] - Additional filtering to apply.
 * @param {boolean} [options.index=true] - Should indexes be returned, or the full documents.
 * @param {Set<string>} [options.indexFields] - Key paths of fields to index.
 * @param {boolean|string} [options.sort] - Should the contents be sorted or what keyPath should they be sorted on?
 * @returns {Document[]}
 */
export async function compendiums(documentClass, {
	type, types=new Set(), filters, index=true, indexFields=new Set(), sort=true
}={}) {
	// If type is provided, stick it into the types set
	if ( type ) types.add(type);

	// If filters are provided, merge their keys with any other fields needing to be indexed
	if ( filters?.length ) indexFields = indexFields.union(filter.uniqueKeys(filters));

	// Iterate over all packs
	let documents = game.packs

		// Skip Packs that have the wrong document class
		.filter(p => p.metadata.type === documentClass.metadata.name

			// And if types are set and specified in the compendium flag, only include those that include the correct types
			&& (!types.size || !p.metadata.flags.types || new Set(p.metadata.flags.types).intersects(types)))

		// Generate an index based on the needed fields
		.map(async p => await Promise.all((await p.getIndex({ fields: Array.from(indexFields) }))

			// Remove any documents that don't match the specified types or the provided filters
			.filter(i => types.has(i.type) && (!filters?.length || filter.performCheck(i, filters)))

			// If full documents are required, retrieve those, otherwise stick with the indices
			.map(async i => index ? i : await fromUuid(i.uuid))
		));

	// Wait for everything to finish loading and flatten the arrays
	documents = (await Promise.all(documents)).flat();

	if ( sort === true ) sort = "name";
	if ( sort ) documents.sort((lhs, rhs) =>
		foundry.utils.getProperty(lhs, sort).localeCompare(foundry.utils.getProperty(rhs, sort))
	);

	return documents;
}

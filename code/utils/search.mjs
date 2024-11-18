import * as Filter from "./filter.mjs";
import { slugify } from "./text.mjs";

/**
 * Search compendiums for documents that match the given options.
 * @param {typeof Document} documentClass - Class of document should be searched (e.g. Actor or Item).
 * @param {object} [options={}]
 * @param {boolean} [options.deduplicate=true] - Perform identifier-based de-duplication on the result.
 * @param {FilterDescription} [options.filters] - Additional filtering to apply.
 * @param {boolean} [options.index=true] - Should indexes be returned, or the full documents.
 * @param {Set<string>} [options.indexFields] - Key paths of fields to index.
 * @param {boolean|string} [options.sort] - Should the contents be sorted or what keyPath should they be sorted on?
 * @param {string} [options.type] - Individual document subtype to find (e.g. "talent" or "spell").
 * @param {Set<string>} [options.types] - Set of document subtypes to find.
 * @returns {Document[]}
 */
export async function compendiums(documentClass, {
	deduplicate=true, filters=[], index=true, indexFields=new Set(), sort=true, type, types=new Set()
}={}) {
	// Nothing within containers should be shown
	filters.push({ k: "system.container", o: "in", v: [null, undefined] });

	// If de-duplicating, the identifier must be fetched
	if ( deduplicate ) indexFields.add("system.identifier.value");

	// If type is provided, stick it into the types set
	if ( type ) types.add(type);

	// If filters are provided, merge their keys with any other fields needing to be indexed
	if ( filters?.length ) indexFields = indexFields.union(Filter.uniqueKeys(filters));

	// Iterate over all packs
	let documents = game.packs

		// Skip Packs that have the wrong document class
		.filter(p => p.metadata.type === documentClass.metadata.name

			// Do not show entries inside compendia that are not visible to current user
			&& p.visible

			// And if types are set and specified in the compendium flag, only include those that include the correct types
			&& (!types.size || !p.metadata.flags.types || new Set(p.metadata.flags.types).intersects(types)))

		// Generate an index based on the needed fields
		.map(async p => await Promise.all((await p.getIndex({ fields: Array.from(indexFields) }))

			// Ensure all values have identifier if required
			.map(i => {
				if ( deduplicate && !i.system?.identifier?.value ) {
					foundry.utils.setProperty(i, "system.identifier.value", slugify(i.name, { strict: true }));
				}
				return i;
			})

			// Remove any documents that don't match the specified types or the provided filters
			.filter(i => types.has(i.type) && (!filters?.length || Filter.performCheck(i, filters)))

			// If full documents are required, retrieve those, otherwise stick with the indices
			.map(async i => index ? i : await fromUuid(i.uuid))
		));

	// Wait for everything to finish loading and flatten the arrays
	documents = (await Promise.all(documents)).flat();

	// De-duplicate results based on identifiers
	if ( deduplicate ) documents = Array.from(
		documents.reduce((map, d) => {
			const key = `${d.type}-${d.system.identifier.value}`;
			if ( !map.has(key) ) map.set(key, []);
			map.get(key).push(d);
			return map;
		}, new Map()).values()
	).map(a => a.pop());

	// Sort final results
	if ( sort === true ) sort = "name";
	if ( sort ) documents.sort((lhs, rhs) =>
		foundry.utils.getProperty(lhs, sort).localeCompare(foundry.utils.getProperty(rhs, sort))
	);

	return documents;
}

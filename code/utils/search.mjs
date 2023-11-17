import * as filter from "./filter.mjs";

/**
 * Search compendiums for documents that match the given options.
 * @param {typeof Document} documentClass - Class of document should be searched (e.g. Actor or Item).
 * @param {string} type - Individual document type to find (e.g. "talent" or "spell").
 * @param {FilterDescription} [filters=[]] - Additional filtering to apply.
 * @returns {Document[]}
 */
export async function compendiums(documentClass, type, filters=[]) {
	const fields = filters.length ? Array.from(filter.uniqueKeys(filters)) : [];

	const documents = game.packs
		.filter(p => p.metadata.type === documentClass.metadata.name
			&& (!p.metadata.flags.types || p.metadata.flags.types.includes(type)))
		.map(async p => await Promise.all((await p.getIndex({ fields }))
			.filter(i => i.type === type && (!filters.length || filter.performCheck(i, filters)))
			.map(async i => await fromUuid(i.uuid))
		));

	return (await Promise.all(documents))
		.flat()
		.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
}

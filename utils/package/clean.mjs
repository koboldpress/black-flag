/**
 * Removes unwanted flags, permissions, and other data from entries before extracting or compiling.
 * @param {object} data - Data for a single entry to clean.
 * @param {object} [options]
 * @param {boolean} [options.clearSourceId] - Should the core sourceId flag be deleted.
 * @param {string} [options.userId] - Static ID that will be used for `lastModifiedBy`.
 */
export function cleanPackEntry(data, { clearSourceId=true, userId="koboldpress" }={}) {
	if ( "ownership" in data ) Object.keys(data.ownership).forEach(key => {
		if ( key !== "default" ) delete data.ownership[key];
	});
	if ( clearSourceId ) {
		delete data._stats?.compendiumSource;
		delete data.flags?.core?.sourceId;
	}
	delete data.flags?.importSource;
	delete data.flags?.exportSource;
	if ( data._stats?.lastModifiedBy ) data._stats.lastModifiedBy = staticID(userId);

	// Remove empty entries in flags
	if ( !data.flags ) data.flags = {};
	Object.entries(data.flags).forEach(([key, contents]) => {
		if ( Object.keys(contents).length === 0 ) delete data.flags[key];
	});

	// If scenes present, assume is an adventure document
	if ( "scenes" in data ) {
		for ( const type of ["actors", "items", "journal", "scenes"] ) {
			if ( data[type] ) data[type].forEach(i => cleanPackEntry(i, { userId }));
		}
	} else {
		if ( data.effects ) data.effects.forEach(i => cleanPackEntry(i, { clearSourceId: false, userId }));
		if ( data.items ) data.items.forEach(i => cleanPackEntry(i, { clearSourceId: false, userId }));
		if ( data.pages ) data.pages.forEach(i => cleanPackEntry(i, { userId }));
	}
}

/**
 * Create an ID from the input truncating or padding the value to make it reach 16 characters.
 * @param {string} id
 * @returns {string}
 */
export function staticID(id) {
	if ( id.length >= 16 ) return id.substring(0, 16);
	return id.padEnd(16, "0");
}

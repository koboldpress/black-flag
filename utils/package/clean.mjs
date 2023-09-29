/**
 * Removes unwanted flags, permissions, and other data from entries before extracting or compiling.
 * @param {object} data - Data for a single entry to clean.
 * @param {object} [options]
 * @param {boolean} [options.clearSourceId] - Should the core sourceId flag be deleted.
 */
export function cleanPackEntry(data, { clearSourceId=true }={}) {
	if ( data.ownership ) data.ownership = { default: 0 };
	if ( clearSourceId ) delete data.flags?.core?.sourceId;
	delete data.flags?.importSource;
	delete data.flags?.exportSource;
	if ( data._stats?.lastModifiedBy ) data._stats.lastModifiedBy = "blackflag0000000";

	// Remove empty entries in flags
	if ( !data.flags ) data.flags = {};
	Object.entries(data.flags).forEach(([key, contents]) => {
		if ( Object.keys(contents).length === 0 ) delete data.flags[key];
	});

	if ( data.effects ) data.effects.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
	if ( data.items ) data.items.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
}

/**
 * Data field that selects the appropriate advancement value data model if available, otherwise defaults to generic
 * `ObjectField` to prevent issues with custom types that aren't currently loaded.
 */
export default class AdvancementValueField extends foundry.data.fields.ObjectField {
	initialize(value, model, options={}) {
		const obj = foundry.utils.deepClone(value);
		for ( const [itemID, values] of Object.entries(obj) ) {
			const item = model.parent?.items?.get(itemID);
			if ( !item ) continue;
			for ( const [advancementID, advancementValue] of Object.entries(values ?? {}) ) {
				const advancement = item.system.advancement?.get(advancementID);
				const dataModel = advancement?.constructor.metadata.dataModels?.value;
				if ( !dataModel ) continue;
				obj[itemID][advancementID] = new dataModel(advancementValue, { parent: model, ...options });
			}
		}
		return obj;
	}
}

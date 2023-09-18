import BackgroundData from "./background-data.mjs";
import ClassData from "./class-data.mjs";
import HeritageData from "./heritage-data.mjs";
import LineageData from "./lineage-data.mjs";

export {
	BackgroundData,
	ClassData,
	HeritageData,
	LineageData
};

export {default as ConceptTemplate} from "./templates/concept-template.mjs";

export const config = {
	background: BackgroundData,
	class: ClassData,
	heritage: HeritageData,
	lineage: LineageData
};

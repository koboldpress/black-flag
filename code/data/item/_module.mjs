import BackgroundData from "./background-data.mjs";
import ClassData from "./class-data.mjs";
import FeatureData from "./feature-data.mjs";
import HeritageData from "./heritage-data.mjs";
import LineageData from "./lineage-data.mjs";
import TalentData from "./talent-data.mjs";

export {
	BackgroundData,
	ClassData,
	FeatureData,
	HeritageData,
	LineageData,
	TalentData
};

export {default as ConceptTemplate} from "./templates/concept-template.mjs";

export const config = {
	background: BackgroundData,
	class: ClassData,
	feature: FeatureData,
	heritage: HeritageData,
	lineage: LineageData,
	talent: TalentData
};

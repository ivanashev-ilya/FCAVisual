import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class ConceptNodeSettings {
    rectangleColor: string;
    lineThickness: number;
}
export declare class VisualSettings extends DataViewObjectsParser {
    conceptNode: ConceptNodeSettings;
}

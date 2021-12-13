import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import "./../style/visual.less";
export declare function logExceptions(): MethodDecorator;
export declare class Visual implements IVisual {
    private target;
    private reactRoot;
    private viewport;
    private settings;
    private data;
    private concepts;
    private conceptsIds;
    private adjacencyLists;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject;
    constructor(options: VisualConstructorOptions);
    private getObjects;
    private getNewAttributes;
    private expand;
    private computeFilteredEdges;
    private getCoordinates;
    update(options: VisualUpdateOptions): void;
    private clear;
}

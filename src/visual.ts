"use strict";
import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataViewTableRow = powerbi.DataViewTableRow;
import PrimitiveValue = powerbi.PrimitiveValue;

import IViewport = powerbi.IViewport;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import { VisualSettings } from "./settings";

// Import React dependencies and the added component
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactConceptLattice, initialState, Point, Edge } from "./component";

import "./../style/visual.less";
import { Numeric } from "d3-array";

export function logExceptions(): MethodDecorator {
    return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> {
        return {
            value: function () {
                try {
                    return descriptor.value.apply(this, arguments);
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            }
        }
    }
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private reactRoot: React.ComponentElement<any, any>;
    private viewport: IViewport;
    private settings: VisualSettings;

    private data: boolean[][];
    private concepts: Set<number>[];
    private conceptsIds: Map<string, number>;
    private adjacencyLists: Set<number>[];

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }

    constructor(options: VisualConstructorOptions) {
        this.reactRoot = React.createElement(ReactConceptLattice, {});
        this.target = options.element;

        ReactDOM.render(this.reactRoot, this.target);
    }

    private getObjects(attributes: Set<number>): number[] {
        var objects = new Array<number>();
        for (var i = 0; i < this.data.length; ++i) {
            if ([...attributes].every((j: number) => this.data[i][j])) {
                objects.push(i);
            }
        }
        return objects;
    }

    private getNewAttributes(attributes: Set<number>): number[] {
        var objects = this.getObjects(attributes);
        var common = new Array(this.data[0].length).fill(true);
        for (var i = 0; i < objects.length; ++i) {
            for (var j = 0; j < common.length; ++j) {
                common[j] = common[j] && this.data[objects[i]][j];
            }
        }

        var res = new Array<number>();
        for (var j = 0; j < common.length; ++j) {
            if (common[j] && !attributes.has(j)) {
                res.push(j);
            }
        }
        return res;
    }

    @logExceptions()
    private expand(attributes: Set<number>, max_considered: number): void {
        if (attributes.size == this.data[0].length) {
            return;
        }
        var conceptId = this.conceptsIds.get(JSON.stringify([...attributes].sort()));
        for (var attr = 0; attr < this.data[0].length; ++attr) {
            if (attributes.has(attr)) {
                continue;
            }

            var attributesCopy = new Set(attributes);
            attributesCopy.add(attr);
            var newAttributes = this.getNewAttributes(attributesCopy);

            for (var i = 0; i < newAttributes.length; ++i) {
                attributesCopy.add(newAttributes[i]);
            }

            if (attr > max_considered && (newAttributes.length == 0 || newAttributes[0] > attr)) {
                this.conceptsIds.set(JSON.stringify([...attributesCopy].sort()), this.conceptsIds.size);
                this.concepts.push(attributesCopy);
                this.adjacencyLists.push(new Set<number>())
                this.expand(attributesCopy, attr);
            }
            var newId = this.conceptsIds.get(JSON.stringify([...attributesCopy].sort()));
            this.adjacencyLists[conceptId].add(newId);
        }
    }

    private computeFilteredEdges() {
        var edges = new Array<Edge>();
        for (var i = 0; i < this.adjacencyLists.length; ++i) {
            for (var j of this.adjacencyLists[i]) {
                var addEdge = true;
                for (var k of this.adjacencyLists[i]) {
                    if (this.adjacencyLists[k].has(j)) {
                        addEdge = false;
                        break;
                    }
                }
                if (addEdge) {
                    edges.push(new Edge(i, j));
                }
            }
        }
        return edges;
    }

    @logExceptions()
    private getCoordinates(concepts: Set<number>[], height: number, width: number) {
        var order = new Array(concepts.length);
        order = [...order.keys()];
        order.sort(function(lhs, rhs) {
            return concepts[lhs].size - concepts[rhs].size;
        })

        var sizes = new Array<number>();
        var sizeConcepts = new Array<Array<number>>();
        var curSize = -1;
        for (var i = 0; i < order.length; ++i) {
            if (concepts[order[i]].size != curSize) {
                curSize = concepts[order[i]].size;
                sizeConcepts.push(new Array<number>());
                sizes.push(curSize);
            }
            sizeConcepts[sizeConcepts.length - 1].push(order[i]);
        }

        var maxSizeCount = 0;
        var yStep = height / sizes.length;
        var coords = new Array<Point>(concepts.length);
        var curY = yStep / 2;
        for (var i = 0; i < sizes.length; ++i) {
            var xStep = width / sizeConcepts[i].length;
            var curX = xStep / 2;
            for (var j = 0; j < sizeConcepts[i].length; ++j) {
                coords[sizeConcepts[i][j]] = new Point(curX, curY);
                curX += xStep;
            }
            curY += yStep;
            maxSizeCount = Math.max(maxSizeCount, sizeConcepts[i].length);
        }
 
        return {
            coords: coords,
            nodeWidth: 0.8 * width / maxSizeCount,
            nodeHeight: 0.8 * yStep
        };
    }

    @logExceptions()
    public update(options: VisualUpdateOptions) {
        if(options.dataViews && options.dataViews[0]){
            const dataView: DataView = options.dataViews[0];

            this.viewport = options.viewport;
            const { width, height } = this.viewport;
            this.settings = VisualSettings.parse(dataView) as VisualSettings;
            const object = this.settings.conceptNode;

            this.data = [];

            var objectsNames = new Array<String>();

            dataView.table.rows.forEach((row: DataViewTableRow) => {
                var curRow = new Array<boolean>();
                for (var i = 0; i < row.length; ++i) {
                    if (typeof dataView.table.columns[i].identityExprs === "undefined") {
                        curRow.push(Boolean(row[i].valueOf()));
                    } else {
                        objectsNames.push(row[i].valueOf().toString());
                    }
                }
                this.data.push(curRow);
            });

            var attrNames = []
            for (var column of dataView.table.columns) {
                if (typeof column.identityExprs === "undefined") {
                    attrNames.push(column.displayName);
                }
            }

            var commonAttrs = new Set<number>(this.getNewAttributes(new Set<number>()));
            this.concepts = [commonAttrs];
            this.conceptsIds = new Map<string, number>();
            this.conceptsIds.set(JSON.stringify([...commonAttrs].sort()), 0);
            this.adjacencyLists = [new Set<number>()];
            this.expand(commonAttrs, -1);

            var edges = this.computeFilteredEdges();

            var coordsAndSize = this.getCoordinates(this.concepts, height, width);
            var coords = coordsAndSize.coords;
            var nodeWidth = coordsAndSize.nodeWidth;
            var nodeHeight = coordsAndSize.nodeHeight;

            var conceptsAttributes = new Array<String>();
            var conceptsObjects = new Array<String>();
            for (var i = 0; i < this.concepts.length; ++i) {
                if (this.concepts[i].size == this.data[0].length) {
                    conceptsAttributes.push("[all]");
                } else {
                    conceptsAttributes.push("[" + [...this.concepts[i]].map((id: number) => {
                        return attrNames[id];
                    }).join() + "]");
                }
                
                var objects = this.getObjects(this.concepts[i]);
                if (objects.length == this.data.length) {
                    conceptsObjects.push("[all]");
                } else {
                    conceptsObjects.push("[" + objects.map((id: number) => {
                        return objectsNames[id];
                    }).join() + "]");
                }
            }
        
            ReactConceptLattice.update({
                width: width,
                height: height,
                nodeWidth: nodeWidth,
                nodeHeight: nodeHeight,
                coords: coords,
                conceptsAttributes: conceptsAttributes,
                conceptsObjects: conceptsObjects,
                edges: edges,
                lineThickness: object && object.lineThickness ? object.lineThickness : undefined,
                background: object && object.rectangleColor ? object.rectangleColor : undefined
            });
        } else {
            this.clear();
        }
    }

    private clear() {
        ReactConceptLattice.update(initialState);
    }
}
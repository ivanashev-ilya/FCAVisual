import { Numeric } from "d3-array";
import * as React from "react";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

export class Point {
    constructor(X: number, Y: number) {
        this.x = X;
        this.y = Y;
    }

    public x: number;
    public y: number;
}

export class Edge {
    constructor(Beg: number, End: number) {
        this.beg = Beg;
        this.end = End;
    }

    public beg: number;
    public end: number;
}
 
export interface State {
    width: number,
    height: number,
    nodeWidth: number,
    nodeHeight: number,
    coords: Point[],
    conceptsAttributes: String[],
    conceptsObjects: String[],
    objectsCount: number,
    conceptsObjectsCount: number[],
    edges: Edge[]
    background?: string,
    lineThickness?: number
}

export const initialState: State = {
    width: 200,
    height: 200,
    nodeWidth: 200,
    nodeHeight: 200,
    coords: [],
    conceptsAttributes: [],
    conceptsObjects: [],
    objectsCount: 0,
    conceptsObjectsCount: [],
    edges: []
}

export class ReactConceptLattice extends React.Component<{}, State>{

    constructor(props: any){
        super(props);
        this.state = initialState;
        this.addFilter = this.addFilter.bind(this);
        this.addIdeal = this.addIdeal.bind(this);
    }

    addFilter(id: number) {
        this.filterConcept = id;
        this.idealConcept = -1;
        ReactConceptLattice.update(this.state);
    }

    addIdeal(id: number) {
        this.idealConcept = id;
        this.filterConcept = -1;
        ReactConceptLattice.update(this.state);
    }

    setConfidenceConcept(id: number) {
        this.confidenceConcept = id;
        this.supportConcept = -1;
        ReactConceptLattice.update(this.state);
    }

    setSupportConcept(id: number) {
        this.supportConcept = id;
        this.confidenceConcept = -1;
        ReactConceptLattice.update(this.state);
    }

    removeFilterAndIdeal() {
        this.idealConcept = -1;
        this.filterConcept = -1;
        ReactConceptLattice.update(this.state);
    }

    removeAssociationRules() {
        this.supportConcept = -1;
        this.confidenceConcept = -1;
        ReactConceptLattice.update(this.state);
    }

    dfs(cur: number, adjacencyLists: number[][], nodes: Set<number>) {
        nodes.add(cur);
        for (var neigh of adjacencyLists[cur]) {
            this.dfs(neigh, adjacencyLists, nodes);
        }
    }

    getFilterOrIdealNodes(start: number, conceptsCount: number, edges: Edge[],
        nodes: Set<number>, type: string)
    {
        var adjacencyLists = [];
        for (var i = 0; i < conceptsCount; ++i) {
            adjacencyLists[i] = [];
        }
        for (var edge of edges) {
            if (type == "ideal") {
                adjacencyLists[edge.beg].push(edge.end);
            } else {
                adjacencyLists[edge.end].push(edge.beg);
            }
        }
        console.error(adjacencyLists);
        this.dfs(start, adjacencyLists, nodes);
    }

    addAssociationRules(concept, edges, coords, objectsCount, conceptsObjectsCount, type, shapes) {
        for (var edge of edges) {
            if (edge.beg == concept) {
                if (type == "confidence") {
                    var value = conceptsObjectsCount[edge.end] / conceptsObjectsCount[edge.beg];
                } else {
                    var value = conceptsObjectsCount[edge.end] / objectsCount;
                }
                const style: React.CSSProperties = {
                    left: (coords[edge.beg].x + coords[edge.end].x) / 2,
                    top: (coords[edge.beg].y + coords[edge.end].y) / 2,
                    position: "absolute"
                };
                shapes.push(<div style={style}>
                    <p style={{ color: "red", background: "white"}}>{value.toFixed(2)}</p>
                </div>);
            }
        }
    }

    render(){
        const { width, height, nodeWidth, nodeHeight, coords,
            conceptsAttributes, conceptsObjects, objectsCount, conceptsObjectsCount,
            edges, background, lineThickness } = this.state;

        var shapes = [
            <div>
                <ContextMenuTrigger id={"Background"}>
                    <svg width={width} height={height}>{
                        edges.map((edge) => {
                            return <line x1={coords[edge.beg].x} y1={coords[edge.beg].y}
                                x2={coords[edge.end].x} y2={coords[edge.end].y}
                                stroke="black" strokeWidth={lineThickness}/>;
                        })
                    }</svg>
                </ContextMenuTrigger>
            
                <ContextMenu id={"Background"}>
                    <MenuItem onClick={() => this.removeFilterAndIdeal()}>
                    Hide filter/ideal
                    </MenuItem>
                    <MenuItem divider />
                    <MenuItem onClick={() => this.removeAssociationRules()}>
                    Hide association rules info
                    </MenuItem>
                </ContextMenu>
            </div>
        ];

        var filterNodes = new Set<number>();
        var idealNodes = new Set<number>();
        if (this.filterConcept != -1) {
            this.getFilterOrIdealNodes(this.filterConcept, coords.length, edges, filterNodes, "filter");
        } else if (this.idealConcept != -1) {
            this.getFilterOrIdealNodes(this.idealConcept, coords.length, edges, idealNodes, "ideal");
        }

        for (let i = 0; i < coords.length; ++i) {
            var borderColor = "black";
            if (filterNodes.has(i)) {
                borderColor = "green";
            } else if (idealNodes.has(i)) {
                borderColor = "red";
            }
            const style: React.CSSProperties = { 
                width: nodeWidth, height: nodeHeight,
                left: coords[i].x - nodeWidth / 2,
                top: coords[i].y - nodeHeight / 2,
                position: "absolute",
                background: background,
                borderWidth: lineThickness,
                borderColor: borderColor
            };
            shapes.push(
                <div>
                    <ContextMenuTrigger id={String(i)}>
                        <div className="conceptNode" style={style}>
                            <p>
                                {conceptsObjects[i]}
                                <br/>
                                <em>{conceptsAttributes[i]}</em>
                            </p>
                        </div>
                    </ContextMenuTrigger>
                
                    <ContextMenu id={String(i)}>
                        <MenuItem onClick={() => this.addFilter(i)}>
                        Draw filter
                        </MenuItem>
                        <MenuItem onClick={() => this.addIdeal(i)}>
                        Draw ideal
                        </MenuItem>
                        <MenuItem divider />
                        <MenuItem onClick={() => this.setConfidenceConcept(i)}>
                        Show association rules confidence
                        </MenuItem>
                        <MenuItem onClick={() => this.setSupportConcept(i)}>
                        Show association rules support
                        </MenuItem>
                    </ContextMenu>
                </div>
            )
        }

        if (this.confidenceConcept != -1) {
            this.addAssociationRules(this.confidenceConcept,  edges, coords,
                objectsCount, conceptsObjectsCount, "confidence", shapes);
        } else if (this.supportConcept != -1) {
            this.addAssociationRules(this.supportConcept,  edges, coords,
                objectsCount, conceptsObjectsCount, "support", shapes);
        }

        return <tbody>{shapes}</tbody>;
    }

    private static updateCallback: (data: object) => void = null;

    public static update(newState: State) {
        if(typeof ReactConceptLattice.updateCallback === 'function'){
            ReactConceptLattice.updateCallback(newState);
        }
    }

    public state: State = initialState;
    public filterConcept: number = -1;
    public idealConcept: number = -1;
    public confidenceConcept: number = -1;
    public supportConcept: number = -1;

    public componentWillMount() {
        ReactConceptLattice.updateCallback = (newState: State): void => { this.setState(newState); };
    }

    public componentWillUnmount() {
        ReactConceptLattice.updateCallback = null;
    }
}



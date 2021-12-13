import * as React from "react";
export declare class Point {
    constructor(X: number, Y: number);
    x: number;
    y: number;
}
export declare class Edge {
    constructor(Beg: number, End: number);
    beg: number;
    end: number;
}
export interface State {
    width: number;
    height: number;
    nodeWidth: number;
    nodeHeight: number;
    coords: Point[];
    conceptsAttributes: String[];
    conceptsObjects: String[];
    edges: Edge[];
    background?: string;
    lineThickness?: number;
}
export declare const initialState: State;
export declare class ReactConceptLattice extends React.Component<{}, State> {
    constructor(props: any);
    addFilter(id: number): void;
    addIdeal(id: number): void;
    removeFilterAndIdeal(): void;
    dfs(cur: number, adjacencyLists: number[][], nodes: Set<number>): void;
    getFilterOrIdealNodes(start: number, conceptsCount: number, edges: Edge[], nodes: Set<number>, type: string): void;
    render(): JSX.Element;
    private static updateCallback;
    static update(newState: State): void;
    state: State;
    filterConcept: number;
    idealConcept: number;
    componentWillMount(): void;
    componentWillUnmount(): void;
}

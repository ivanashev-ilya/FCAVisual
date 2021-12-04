import * as React from "react";

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
    edges: []
}

export class ReactConceptLattice extends React.Component<{}, State>{

    constructor(props: any){
        super(props);
        this.state = initialState;
    }

    render(){
        const { width, height, nodeWidth, nodeHeight, coords,
            conceptsAttributes, conceptsObjects, edges, background, lineThickness } = this.state;

        var shapes = [<svg width={width} height={height}>{
            edges.map((edge) => {
                return <line x1={coords[edge.beg].x} y1={coords[edge.beg].y}
                    x2={coords[edge.end].x} y2={coords[edge.end].y}
                    stroke="black" strokeWidth={lineThickness}/>;
            })
        }</svg>];

        for (var i = 0; i < coords.length; ++i) {
            const style: React.CSSProperties = { 
                width: nodeWidth, height: nodeHeight,
                left: coords[i].x - nodeWidth / 2,
                top: coords[i].y - nodeHeight / 2,
                position: "absolute",
                background: background,
                borderWidth: lineThickness
            };
            shapes.push(
                <div className="conceptNode" style={style}>
                    <p>
                        {conceptsObjects[i]}
                        <br/>
                        <em>{conceptsAttributes[i]}</em>
                    </p>
                </div>
            )
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

    public componentWillMount() {
        ReactConceptLattice.updateCallback = (newState: State): void => { this.setState(newState); };
    }

    public componentWillUnmount() {
        ReactConceptLattice.updateCallback = null;
    }
}
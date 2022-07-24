import React from "react";

interface Props {
    id: number,
    x: number,
    y: number,
    handleClick: (event: React.MouseEvent) => void,
}

interface State{}

class GraphPoint extends React.Component<Props, State> {
    id: number = this.props.id
    x: number = this.props.x
    y: number = this.props.y
    handleClick: (event: React.MouseEvent) => void = this.props.handleClick

    compareTo: (point: GraphPoint) => number = (point => {
        return this.x - point.x
    })

    render() {
        return <circle key={this.id} cx={this.x} cy={this.y} r="10" stroke="green" strokeWidth="4" fill="yellow" onClick={this.handleClick}/>
    }
}

export default GraphPoint
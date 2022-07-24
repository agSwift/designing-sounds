import {MouseEventHandler} from "react";

interface Props {
    label: string,
    onChange: MouseEventHandler<HTMLButtonElement>
}

const Button: (props: Props) => JSX.Element = (props) => {
    return <button onClick={props.onChange}>
        {props.label}
    </button>
}


export default Button

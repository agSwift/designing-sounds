import {ChangeEventHandler} from "react";

interface Props {
    keyVals: Map<string, string>,
    selectedValue: string
    onChange: ChangeEventHandler<HTMLSelectElement>
}

const Dropdown: (props: Props) => JSX.Element = (props) => {
    const options: JSX.Element[] = []
    props.keyVals.forEach((value, key) => {
        options.push(<option key={key} label={key} value={value}/>)
    })
    return (
        <select onChange={props.onChange} value={props.selectedValue}>
            {options}
        </select>
    )
}

export default Dropdown

import React from "react";
import {Line, XAxis, YAxis, Tooltip, ComposedChart, Scatter, CartesianGrid} from 'recharts';
import {PointFetcher, SOCKET_CONNECTION} from "../utils/PointFetcher";
import Slider from "./Slider";
import Dropdown from "./Dropdown";
import Button from "./Button";
import {exponentiatedQuadraticKernel, Kernel, kernels} from "../utils/Kernel";
import SoundGenerator from "../utils/SoundGenerator";
import {FetchRequestBody} from "../Interfaces";
import Collapsible from 'react-collapsible';

interface Props {
    width?: number,
    height?: number,
}

interface State {
    soundUserPoints: { x: number; y: number; }[]
    soundGeneratedPoints: { x: number; y: number; }[]
    amplitudeUserPoints: { x: number; y: number; }[]
    amplitudeGeneratedPoints: { x: number; y: number; }[],
    isSoundMode: boolean,
    sound : {
        kernel: Kernel,
        params: Map<string, number>,
        lengthScale: number,
        maxY: number,
        minY: number,
        maxX: number,
    },
    amplitude : {
        kernel: Kernel,
        params: Map<string, number>,
        lengthScale: number,
        maxY: number,
        minY: number,
        maxX: number,
    }
    soundGenerator: SoundGenerator,
    socketLoading: String,
}

class SoundGraph extends React.Component<Props, State> {
    width = this.props.width ?? 1600
    height = this.props.height ?? 600
    axisLength = 50
    soundDatatag = 0
    amplitudeDatatag = 0

    onData = (data: any) => {
        let generatedData: FetchRequestBody = JSON.parse(data);
        const soundMode = generatedData['soundMode'];
        if(generatedData['dataTag'] === this.getTag(soundMode)){
            console.log(generatedData.params);
            this.updateGeneratedPoints(generatedData.data, soundMode);
            generatedData.params?.forEach((keyValue) => {
                this.getGraphState().params.set(keyValue.name, keyValue.value)
            })
            this.setState({});
        }
    }

    setLoading = (value: string) => this.setState({socketLoading: value})

    pointFetcher = new PointFetcher(this.onData, this.setLoading);

    INIT_SOUND_USER_POINTS = [{x:0, y:0}, {x:1, y:0}]
    INIT_AMP_USER_POINTS = [{x:0, y:1}, {x:1, y:1}] 
    state: State = {
        soundUserPoints: this.INIT_SOUND_USER_POINTS,
        soundGeneratedPoints: [],
        amplitudeUserPoints: this.INIT_AMP_USER_POINTS,
        amplitudeGeneratedPoints: [],
        isSoundMode: true, // true when in sound mode, false when in amp modulation mode
        sound: {
            kernel: exponentiatedQuadraticKernel,
            params: new Map(),
            lengthScale: 1,
            maxY: 1,
            minY: -1,
            maxX: 1,
        },
        amplitude: {
            kernel: exponentiatedQuadraticKernel,
            params: new Map(),
            lengthScale: 1,
            maxY: 1,
            minY: 0,
            maxX: 1,
        },
        soundGenerator: new SoundGenerator(),   
        socketLoading: SOCKET_CONNECTION.CONNECTING,
    }


    soundGenerator = () => this.state.soundGenerator;

    handleGraphClick = (e:any) => {
        if (e) {
            const xCoord = e.chartX;
            const yCoord = e.chartY;
            const x = this.calcXFromXCoord(xCoord);
            console.log((xCoord - this.axisLength) / (this.width - this.axisLength));
            const y = this.calcYFromYCoord(yCoord);
            if (this.isSoundMode()) {
                this.soundDatatag += 1;
                this.state.soundUserPoints.push({x, y});
            } else {
                this.amplitudeDatatag += 1;
                this.state.amplitudeUserPoints.push({x,y});
            }
            this.onPlot(this.isSoundMode());
            this.setState({});
        }
    };

    setGraphState = (key: any, value: any, callback: (undefined | (()=>void))=undefined) => {
        var data: any = null;
        if (this.isSoundMode()) {
            data = {...this.state.sound};
            data[key] = value;
            data = {sound: {...data}}
        } else {
            data = {...this.state.amplitude};
            data[key] = value;
            data = {amplitude: {...data}}
        }
        this.setState(data, callback);
    }

    getGraphState = () => this.isSoundMode() ? this.state.sound : this.state.amplitude;

    handleLengthscaleSet = (e:any) => {
        this.setGraphState('lengthScale', parseInt(e.target.value));
        this.onPlot(true);
        this.onPlot(false);
    }

    calcXFromXCoord = (xCoord: number) => (xCoord - this.axisLength) / (this.width - 2 * this.axisLength) *  this.getGraphState().maxX;

    calcYFromYCoord = (yCoord: number) => this.getGraphState().maxY - ((yCoord - this.axisLength) / (this.height - 2 *this.axisLength) *  (this.getGraphState().maxY - this.getGraphState().minY));

    getUserSoundPoints: () => number[][] = () => {
        return this.state.soundUserPoints.map(point => [point.x, point.y])
    }

    getUserAmplitudePoints: () => number[][] = () => {
        return this.state.amplitudeUserPoints.map(point => [point.x, point.y])
    }

    getTag = (soundMode: boolean) => soundMode ? this.soundDatatag : this.amplitudeDatatag

    onPlot = async (soundMode: boolean, optimiseParams = false) => {
        //Stop any currently playing sound
        this.soundGenerator().resetSound();
        // Get the user points
        const userData = soundMode ? this.getUserSoundPoints() : this.getUserAmplitudePoints();
        // Get the correct data tag
        const tag = this.getTag(soundMode)
        // Get the gaussian data
        this.pointFetcher.sendData({ points: userData, kernel:  this.getGraphState().kernel.name, params:  this.getGraphState().params, optimiseParams}, tag, soundMode, this.state.amplitude.maxX);
    }

    generateDistributedDataFromPoints = (points: number[]) => {
        // Calculate the distribution for the number of data points and X axis
        const xDistribution =  this.getGraphState().maxX / points.length;
        return points.map((y, i) => ({x: xDistribution * i, y: y}));
    }

    updateGeneratedPoints = (generatedData: number[], soundMode: boolean) => {
        this.state.soundGeneratedPoints = soundMode ? this.generateDistributedDataFromPoints(generatedData) : this.state.soundGeneratedPoints;
        this.state.amplitudeGeneratedPoints = !soundMode ? this.generateDistributedDataFromPoints(generatedData) : this.state.amplitudeGeneratedPoints;
        // Force a component rerender by updating the state
        this.setState({});
    }

    resetPoints = () => {
        if (this.isSoundMode()) {
            this.state.soundUserPoints = [{x:0, y:0}, {x:1, y:0}]
            this.state.soundGeneratedPoints.splice(0, this.state.soundGeneratedPoints.length)
        } else {
            this.state.amplitudeUserPoints = [{x:0, y:1}, {x:1, y:1}] 
            this.state.amplitudeGeneratedPoints.splice(0, this.state.amplitudeGeneratedPoints.length)
        }
        this.getGraphState().params.clear()
        this.setState({})
    }

    isSoundMode = () => this.state.isSoundMode

    isAmplitudeMode = () => !this.state.isSoundMode

    soundGraphColour = () => this.isSoundMode() ? "blue":"lightblue"

    amplitudeGraphColour = () => (!this.isSoundMode()) ? "red":"pink"

    generateKernelDropdownAndParameters = () => {
        return <td className="params">
            <label className="paramLabel">
                <Dropdown keyVals={new Map(kernels.map(kernel => [kernel.label, kernel.name]))} selectedValue={this.getGraphState().kernel.name} onChange={(e) => {
                    this.setGraphState('kernel', kernels.find(kernel => kernel.name === e.target.value)!, () => {
                        this.onPlot(this.isSoundMode())
                    })
                }}/>
            </label>
            {this.getGraphState().kernel.parameters.map(param => {
                if (!this.getGraphState().params.has(param.name)) {
                    this.getGraphState().params.set(param.name, param.default)
                }
                return <Slider key={param.name} name={param.label} min={param.min} max={param.max} step={0.01} value={this.getGraphState().params.get(param.name)!} onChange={(e) => {
                    this.getGraphState().params.set(param.name, parseFloat(e.target.value))
                    this.setState({})
                }} onMouseUp={() => {
                    this.onPlot(this.isSoundMode())
                    this.setState({})
                }}/>
            })}
            <Button label="Optimise Parameters" onChange={() => this.onPlot(this.isSoundMode(), true)}/>
        </td>
    }

    generateTable: () => JSX.Element = () => {
        return  (
            <table className="optionTable">
                <tr>
                    <td>
                        <Collapsible trigger={"Graph Controls"} open={true} >
                            <table className="params">
                                <tbody>
                                    <tr>
                                        <td className="params" >
                                            <Dropdown keyVals={new Map([['Sound Mode', 'sound'], ['Amplitude Mode', 'amplitude']])} selectedValue={this.isSoundMode() ? 'sound':'amplitude'} onChange={(e)=>this.setState({isSoundMode: e.target.value === 'sound'})}/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="params">
                                            <Button label="Resample Graph" onChange={() => this.onPlot(this.isSoundMode())}/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="params">
                                            <Button label="Reset Graph" onChange={this.resetPoints}/>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Collapsible>
                    </td>
                    <td>
                        <Collapsible trigger={"Sound Controls"}  open={true}>
                            <table className="params">
                                <tbody>
                                    <tr>
                                        <td className="params">
                                            <Button label="Play" onChange={()=>this.soundGenerator().play(this.state.soundGeneratedPoints, this.state.amplitudeGeneratedPoints, this.state.amplitude.maxX)}/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={"params"}>
                                            <Button label="Download" onChange={()=>this.soundGenerator().downloadSound(this.state.amplitude.maxX)}/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={"params"}>
                                            <Slider name={"Sound length"} min={1} max={10} step={1} value={this.state.amplitude.maxX} 
                                            onChange={(e)=>{
                                                this.state.amplitude.maxX = parseInt(e.target.value);
                                                this.onPlot(false);
                                                }} 
                                            onMouseUp={()=>{}}/> 
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Collapsible>
                    </td>
                    <td>
                        <Collapsible trigger={"Advanced Controls"}  open={true} >
                            <table className="params">
                                <tbody>
                                    <tr>
                                        {this.generateKernelDropdownAndParameters()}
                                    </tr>
                                </tbody>
                            </table>
                        </Collapsible>
                    </td>
                </tr>
            </table>
        )
    }

    Overlay = () => {
        if(this.state.socketLoading === SOCKET_CONNECTION.CONNECTED) {
            return null;
        }

        const style = {
            height:this.height,
            width: this.width,
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            zIndex: 1,
            lineHeight: this.height + 'px',
            fontSize: '300%',
            fontWeight: 900,
        };

        return (
            <div style={{...style, position: 'absolute'}}>
                    {this.state.socketLoading}
            </div>
        );
    }

    render () {
            return (
                <div className="graphContainer"> 
                    <div style={{width: '80vw', margin: '0 10vw'}}>
                        <this.Overlay />
                        <ComposedChart width={this.width} height={this.height} onClick={this.handleGraphClick} >
                            <CartesianGrid strokeDasharray={"3 3"}/>
                            <Line xAxisId="sound" yAxisId="sound" dataKey="y" dot={false}  data={this.state.soundGeneratedPoints} stroke={this.soundGraphColour()} />
                            <Scatter xAxisId="sound" yAxisId="sound" dataKey="y" fill={this.soundGraphColour()} data={this.state.soundUserPoints} />
                            <Line  xAxisId="amp" yAxisId="amp" dataKey="y" dot={false}  data={this.state.amplitudeGeneratedPoints} stroke={this.amplitudeGraphColour()} />
                            <Scatter xAxisId="amp" yAxisId="amp" dataKey="y" fill={this.amplitudeGraphColour()} data={this.state.amplitudeUserPoints} />
                            <XAxis xAxisId="amp" orientation="top" label={"Time"}  axisLine={!this.isSoundMode()}  type="number" dataKey="x" domain={[0, this.state.amplitude.maxX]} interval={0} tickCount={this.state.amplitude.maxX + 1} height={this.axisLength} allowDataOverflow={true} />
                            <XAxis xAxisId="sound" orientation="bottom" label={"Ticks"}  axisLine={this.isSoundMode()}  type="number" dataKey="x" domain={[0, this.state.sound.maxX]} interval={0} tickCount={this.state.sound.maxX + 1} height={this.axisLength} allowDataOverflow={true} />
                            <YAxis yAxisId="sound" orientation='left' axisLine={this.isSoundMode()} type="number" domain={[this.state.sound.minY, this.state.sound.maxY]} interval={0} ticks={[this.state.sound.minY,0,this.state.sound.maxY]} width={this.axisLength}  allowDataOverflow={true} />
                            <YAxis yAxisId="amp" orientation='right' axisLine={this.isAmplitudeMode()} type="number" domain={[this.state.amplitude.minY, this.state.amplitude.maxY]} interval={0} ticks={[this.state.amplitude.minY,0,this.state.amplitude.maxY]} width={this.axisLength}  allowDataOverflow={true} />
                            <Tooltip />
                        </ComposedChart>
                    </div>
                    {this.generateTable()}
                </div>

            )
    }
}

export default SoundGraph;
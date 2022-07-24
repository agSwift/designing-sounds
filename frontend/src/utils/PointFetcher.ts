import {FetchDataBody} from "../Interfaces";

const BACKEND_WS_URL = 'ws://localhost:5000/gaussian'

const SOCKET_CONNECTION = {
    CONNECTING: 'Connecting...',
    CONNECTED: 'Connected :)',
    LOST_CONNECTION: 'Lost connection, trying to reconnect...',
}

class PointFetcher {
    ws = new WebSocket(BACKEND_WS_URL)
    onData: ((data: any) => void)
    setSocketLoading: (value: string) => void;

    constructor(onData: ((data: any) => void), setSocketLoading: (value: string) => void) {
        this.connectSocket();
        this.onData = onData;
        this.setSocketLoading = setSocketLoading;
    }

    connectSocket = () => { 
        this.ws.onopen = () => this.setSocketLoading(SOCKET_CONNECTION.CONNECTED);
        this.ws.onclose = () => this.setSocketLoading(SOCKET_CONNECTION.LOST_CONNECTION);
        this.ws.onmessage = (evt) => this.onData(evt.data)
        this.ws.onerror = () => {
            this.setSocketLoading(SOCKET_CONNECTION.LOST_CONNECTION);
            console.log("Socket failed, reestablishing connection")
            this.ws = new WebSocket(BACKEND_WS_URL)
            this.connectSocket()
        } 
    }

    sendData: (body: FetchDataBody, dataTag: number, soundMode: boolean, duration: number) => void
        = async (body: FetchDataBody, dataTag: number,  soundMode: boolean, duration: number) => {
        const soundDuration = soundMode ? 1: duration
        const postBody = {
            points: body.points,
            kernel: body.kernel,
            ...Object.fromEntries(body.params),
            optimiseParams: body.optimiseParams,
            dataTag,
            batches: [700],
            soundMode,
            soundDuration,
        };

        if (this.ws.readyState) {
            this.ws.send(JSON.stringify(postBody))
        }
    }
}

export {PointFetcher, SOCKET_CONNECTION};
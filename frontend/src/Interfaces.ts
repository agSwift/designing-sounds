export interface FetchDataBody {
    points: number[][],
    kernel: string,
    params: Map<string, number>,
    optimiseParams: boolean,
}

export interface FetchRequestBody {
    data: number[],
    params?: {
        name: string,
        value: number,
    }[]
    dataTag: number,
    soundMode: boolean,
}
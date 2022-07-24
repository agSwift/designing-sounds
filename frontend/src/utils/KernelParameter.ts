export interface Parameter {
    name: string
    label: string
    min: number
    max: number
    default: number
}

export const lengthScaleParam: Parameter = {
    name: 'lengthscale',
    label: 'Length Scale',
    min: 0.01,
    max: 1,
    default: 0.1,
}

export const amplitudeParam: Parameter = {
    name: 'amplitude',
    label: 'Amplitude',
    min: 0.01,
    max: 1,
    default: 0.5,
}

export const periodParam: Parameter = {
    name: 'period',
    label: 'Period',
    min: 0.01,
    max: 1,
    default: 0.1,
}

export const alphaParam: Parameter = {
    name: 'alpha',
    label: 'Alpha',
    min: 0.01,
    max: 1,
    default: 0.1,
}
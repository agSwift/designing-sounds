import {
    alphaParam,
    amplitudeParam,
    lengthScaleParam,
    Parameter,
    periodParam
} from "./KernelParameter";

export interface Kernel {
    name: string,
    label: string,
    parameters: Parameter[],
}

export const exponentiatedQuadraticKernel: Kernel = {
    name: 'exponentiated_quadratic_kernel',
    label: 'Exponentiated Quadratic Kernel',
    parameters: [lengthScaleParam, amplitudeParam]
}

export const rationalQuadraticKernel: Kernel = {
    name: 'rational_quadratic_kernel',
    label: 'Rational Quadratic Kernel',
    parameters: [lengthScaleParam, alphaParam, amplitudeParam]
}

export const periodicKernel: Kernel = {
    name: 'periodic_kernel',
    label: 'Periodic Kernel',
    parameters: [lengthScaleParam, periodParam, amplitudeParam]
}

export const matern12: Kernel = {
    name: 'matern12',
    label: 'Matern12',
    parameters: [lengthScaleParam, amplitudeParam]
}

export const matern32: Kernel = {
    name: 'matern32',
    label: 'Matern32',
    parameters: [lengthScaleParam, amplitudeParam]
}

export const matern52: Kernel = {
    name: 'matern52',
    label: 'Matern52',
    parameters: [lengthScaleParam, amplitudeParam]
}

export const kernels = [exponentiatedQuadraticKernel, rationalQuadraticKernel, periodicKernel, matern12, matern32, matern52]
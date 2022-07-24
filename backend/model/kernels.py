import numpy as np


class Kernel:
    def __init__(self):
        pass

    def update_params(self):
        pass

    def __call__(self, a, b):
        pass

    
class SquaredExponentialKernel(Kernel):
    def __init__(self, lengthscale=1., amplitude=1.):
        self.lengthscale = lengthscale
        self.amplitude = amplitude

    def update_params(self, lengthscale, amplitude):
        if not lengthscale:
            self.lengthscale = lengthscale
        if not amplitude:
            self.amplitude = amplitude

    def __call__(self, a, b):
        sqdist = np.sum(a**2, 1).reshape(-1, 1) + \
            np.sum(b**2, 1) - 2 * np.dot(a, b.T)

        return (self.amplitude ** 2) * np.exp(
            -.5 * (1 / self.lengthscale) * sqdist)
        

class RationalQuadraticKernel(Kernel):
    def __init__(self, lengthscale=1., alpha=1., amplitude=1.):
        self.lengthscale = lengthscale
        self.alpha = alpha
        self.amplitude = amplitude

    def update_params(self, lengthscale, alpha, amplitude):
        if not lengthscale:
            self.lengthscale = lengthscale
        if not alpha:
            self.alpha = alpha
        if not amplitude:
            self.amplitude = amplitude
    
    def __call__(self, a, b):
        sqdist = np.sum(a**2, 1).reshape(-1, 1) + \
            np.sum(b**2, 1) - 2 * np.dot(a, b.T)
        
        dist = np.float_power(
            1. + (1 / (2 * self.alpha * (self.lengthscale ** 2))) * sqdist,
            -self.alpha)
        
        return (self.amplitude ** 2) * dist

        
class PeriodicKernel(Kernel):
    def __init__(self, lengthscale=1., period=1., amplitude=1.):
        self.lengthscale = lengthscale
        self.period = period
        self.amplitude = amplitude

    def update_params(self, lengthscale, period, amplitude):
        if not lengthscale:
            self.lengthscale = lengthscale
        if not period:
            self.period = period
        if not amplitude:
            self.amplitude = amplitude
    
    def __call__(self, a, b):
        a = a.reshape(-1)
        b = b.reshape(-1)
        dist = np.array([[np.pi * np.abs(
            a_i - b_j) / self.period for b_j in b] for a_i in a])

        return (self.amplitude ** 2) * np.exp(
            (-2 / (self.lengthscale**2)) * (np.sin(dist) ** 2))


class LocalPeriodicKernel(Kernel):
    def __init__(self, periodic_lengthscale=1., period=1., 
                 local_lengthscale=1., amplitude=1.):
        self.periodic_lengthscale = periodic_lengthscale
        self.period = period
        self.local_lengthscale = local_lengthscale
        self.amplitude = amplitude

        self.periodic = PeriodicKernel(
            self.periodic_lengthscale, self.period, self.amplitude)
        self.local = SquaredExponentialKernel(
            self.local_lengthscale, self.amplitude)

    def update_params(self, periodic_lengthscale, period, 
                      local_lengthscale, amplitude):
        if not periodic_lengthscale:
            self.periodic_lengthscale = periodic_lengthscale
        if not period:
            self.period = period
        if not local_lengthscale:
            self.local_lengthscale = local_lengthscale
        if not amplitude:
            self.amplitude = amplitude

        self.periodic.update_params(periodic_lengthscale, period, amplitude)
        self.local.update_params(local_lengthscale, amplitude)

    def __call__(self, a, b):
        return self.periodic(a, b) * self.local(a, b)


class SpectralMixtureKernel(Kernel):
    def __init__(self):
        pass

    def __call__(self, a, b):
        pass

def parse_kernel(kernel_name, params):
    if kernel_name == 'exponentiated_quadratic_kernel':
        kernel = SquaredExponentialKernel()
        
        lengthscale = params.get('lengthscale')
        amplitude = params.get('amplitude')
        kernel.update_params(lengthscale, amplitude)
        
        return kernel
    elif kernel_name == 'rational_quadratic_kernel':
        kernel = RationalQuadraticKernel()
        lengthscale = params.get('lengthscale')
        alpha = params.get('alpha')
        amplitude = params.get('amplitude')
        kernel.update_params(lengthscale, alpha, amplitude)
        
        return kernel
    elif kernel_name == 'periodic_kernel':
        kernel = PeriodicKernel()
        
        lengthscale = params.get('lengthscale')
        period = params.get('period')
        amplitude = params.get('amplitude')
        kernel.update_params(lengthscale, period, amplitude)
        
        return kernel
    elif kernel_name == 'local_periodic_kernel':
        kernel = LocalPeriodicKernel()
        
        periodic_lengthscale = params.get('periodic_lengthscale')
        period = params.get('period')
        local_lengthscale = params.get('local_lengthscale')
        amplitude = params.get('amplitude')
        kernel.update_params(periodic_lengthscale, period, local_lengthscale, amplitude)
        
        return kernel
    else:
        return None
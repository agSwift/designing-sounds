import os

import numpy as np
import tensorflow as tf
from gpflow import kernels, optimizers
from gpflow.config import default_float as floatx
from gpflow.models import GPR, SGPR
from gpflow_sampling.models import PathwiseGPR
from gpflow_sampling.sampling.updates import cg as cg_update


class PathwiseGPModel:
    def __init__(self, train_x, train_y, kernel):
        self.model = PathwiseGPR(
            data=(train_x, train_y),
            kernel=kernel,
            noise_variance=2e-6
            )
        paths = self.model.generate_paths(num_samples=32, num_bases=512)
        self.model.set_paths(paths)

    def sample_from_posterior(self, test_x):

        with self.model.temporary_paths(
            num_samples=1, num_bases=512, update_rule=cg_update):
            f_plot = self.model.predict_f_samples(test_x)
 
            return f_plot.numpy().reshape(-1, 1)

class ExactGPModel:
    def __init__(self, train_x, train_y, kernel):
        self.model = GPR(
            data=(train_x, train_y),
            kernel=kernel,
            noise_variance=2e-6
        )

    def sample_from_posterior(self, test_x):
        return self.model.predict_f_samples(test_x).numpy().reshape(-1, 1)


def get_GPModel(kernel_name, kernel, train_x, train_y, sample_rate):
    
    kernels_supported_by_matherons = {'matern12', 'matern32', 'matern52', 'exponentiated_quadratic_kernel'}

    if kernel_name in kernels_supported_by_matherons:
        model = PathwiseGPModel(train_x, train_y, kernel)
    else:
        model = ExactGPModel(train_x, train_y, kernel)
        sample_rate = sample_rate // 10
        
    return model, sample_rate


class GPSoundGenerator:
    def __init__(self, sample_rate=44100):
        self.sample_rate = sample_rate
        
        self.train_x = np.array([])
        self.train_y = np.array([])
        self.model = None

    def update_train_data(self, train_x, train_y, params, kernel_name,
                          sample_rate):
        self.train_x = tf.convert_to_tensor(np.array(train_x, dtype=np.float).reshape(-1, 1))
        self.train_y = tf.convert_to_tensor(np.array(train_y, dtype=np.float).reshape(-1, 1))
        
        kernel = self.get_kernel(kernel_name, params)
        self.model, self.sample_rate = get_GPModel(kernel_name, kernel, self.train_x, self.train_y, sample_rate)

    def fit(self, train_iter=100, lr=0.1, verbose=0):
        # train model to return optimal parameters
        opt = optimizers.Scipy()
        opt_logs = opt.minimize(
            self.model.model.training_loss, self.model.model.trainable_variables, 
            options=dict(maxiter=train_iter))

        return self.get_hyperparameters()
 
    def sample_from_posterior(self, timeframe):
        # timeframe: the duration of the generated sound in seconds
        
        test_x = np.linspace(
            0, timeframe, num=timeframe * self.sample_rate)[:, None]

        return self.model.sample_from_posterior(test_x)

    def get_kernel(self, kernel_name, params):
        
        self.kernel_name = kernel_name
        
        lengthscale = params.get('lengthscale')
        variance = params.get('amplitude')

        if kernel_name == 'spectral_mixture_kernel':
            n_mixtures = params.get('n_mixtures')
            #TODO: implement spectral mixture kernel
            covariance = kernels.Matern52(variance=variance,
                                          lengthscales=lengthscale)
        elif kernel_name == 'periodic_kernel':
            period = params.get('period')
            base_kernel = kernels.Matern52(variance=variance,
                                           lengthscales=lengthscale)
            covariance = kernels.Periodic(base_kernel=base_kernel,
                                          period=period)
        elif kernel_name == 'exponentiated_quadratic_kernel':
            covariance = kernels.SquaredExponential(variance=variance,
                                                    lengthscales=lengthscale)
        elif kernel_name == 'rational_quadratic_kernel':
            alpha = params.get('alpha')
            covariance = kernels.RationalQuadratic(variance=variance,
                                                   lengthscales=lengthscale,
                                                   alpha=alpha)
        elif kernel_name == 'matern12':
            covariance = kernels.Matern12(variance=variance,
                                          lengthscales=lengthscale)
        elif kernel_name == 'matern32':
            covariance = kernels.Matern32(variance=variance,
                                          lengthscales=lengthscale)
        elif kernel_name == 'matern52':
            covariance = kernels.Matern52(variance=variance,
                                          lengthscales=lengthscale)
        else:
            print("Such kernel does not exist. Please double check.")
            return None

        return covariance

    def get_hyperparameters(self):
        hyperparameters = []
        model = self.model.model

        if self.kernel_name == 'spectral_mixture_kernel':
            hyperparameters.append(
                {'name': 'lengthscale',
                 'value': model.kernel.lengthscales.numpy().item()})

        elif self.kernel_name == 'periodic_kernel':
            hyperparameters.append(
                {'name': 'lengthscale',
                 'value': model.kernel.base_kernel.lengthscales.numpy().item()})
            hyperparameters.append(
                {'name': 'amplitude',
                 'value': model.kernel.base_kernel.variance.numpy().item()})
            hyperparameters.append(
                {'name': 'period',
                 'value': model.kernel.period.numpy().item()})
        elif self.kernel_name == 'exponentiated_quadratic_kernel':
            hyperparameters.append(
                {'name': 'lengthscale',
                 'value': model.kernel.lengthscales.numpy().item()})
            hyperparameters.append(
                {'name': 'amplitude',
                 'value': model.kernel.variance.numpy().item()})
        elif self.kernel_name == 'rational_quadratic_kernel':
            hyperparameters.append(
                {'name': 'lengthscale',
                 'value': model.kernel.lengthscales.numpy().item()})
            hyperparameters.append(
                {'name': 'amplitude',
                 'value': model.kernel.variance.numpy().item()})
            hyperparameters.append(
                {'name': 'alpha',
                 'value': model.kernel.alpha.numpy().item()})
        elif self.kernel_name == 'matern12':
            hyperparameters.append(
                {'name': 'lengthscale',
                 'value': model.kernel.lengthscales.numpy().item()})
            hyperparameters.append(
                {'name': 'amplitude',
                 'value': model.kernel.variance.numpy().item()})
        elif self.kernel_name == 'matern32':
            hyperparameters.append(
                {'name': 'lengthscale',
                 'value': model.kernel.lengthscales.numpy().item()})
            hyperparameters.append(
                {'name': 'amplitude',
                 'value': model.kernel.variance.numpy().item()})
        elif self.kernel_name == 'matern52':
            hyperparameters.append(
                {'name': 'lengthscale',
                 'value': model.kernel.lengthscales.numpy().item()})
            hyperparameters.append(
                {'name': 'amplitude',
                 'value': model.kernel.variance.numpy().item()})
        else:
            return None 

        return hyperparameters

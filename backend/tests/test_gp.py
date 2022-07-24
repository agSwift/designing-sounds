import numpy as np
import pytest

from model import GaussianProcess, negative_exponential_kernel


@pytest.mark.parametrize("seed", [10, 20, 30])
def test_negative_exponential_kernel(seed):
    np.random.seed(seed)

    kernel = negative_exponential_kernel

    # dummy data
    x = np.array([1, 1]).reshape(-1, 1)
    cov = np.ones((2, 2))
    
    assert np.array_equal(kernel(x, x), cov)


def test_initialize_gp():
    gp = GaussianProcess((0, 5), 1000)
    assert len(gp.xs) == 0
    assert len(gp.ys) == 0


def test_update_data():
    gp = GaussianProcess((0, 5), 1000)
    gp.update_data([[0]], [[1]])
    assert len(gp.xs) == 1
    assert len(gp.ys) == 1

    gp.update_data([[0],[1]], [[1],[2]])
    assert len(gp.xs) == 2
    assert len(gp.ys) == 2

    gp.update_data([[0]], [[1]])
    assert len(gp.xs) == 1
    assert len(gp.ys) == 1


def test_gaussian_process():
    gp = GaussianProcess((0, 5), 2)
    gp.update_data([[0], [1], [2]], [[1], [2], [5.5]])
    
    mu = np.array([[[9.99950662e-01], [1.57053351e-19]]])
    Lk = np.array([[ 9.99975001e-01, 5.16629148e-55],
                   [ 3.36879731e-07, 1.80484723e-35],
                   [-2.26976427e-09, 2.86251200e-20]])
    K_ = np.array([[1.0, 5.16642063e-55],
                   [5.16642063e-55, 1.0]])
    sigma = np.array([0.00707089, 1.])

    assert np.allclose(gp.mu, mu)
    assert np.allclose(gp.Lk, Lk)
    assert np.allclose(gp.K_, K_)
    assert np.allclose(gp.sigma, sigma)

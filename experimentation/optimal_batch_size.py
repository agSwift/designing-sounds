import requests
import csv

KERNELS = [
    'exponentiated_quadratic_kernel',
    'rational_quadratic_kernel',
]

PARAMS = {
    'lengthscale': 0.1,
    'amplitude': 0.5,
    'period': 0.1,
    'alpha': 0.1,
}

sample_request = {
    "points": [
        [
            0,
            0
        ],
        [
            1,
            0
        ],
        [
            0.294,
            -0.4119999999999999
        ]
    ],
    "kernel": "exponentiated_quadratic_kernel",
    "lengthscale": 0.1,
    "amplitude": 0.5,
    "optimiseParams": True,
    "dataTag": 1,
    "batches": [
        700
    ],
    "soundMode": True,
    "soundDuration": 1
}


def experiment(request_bodys):
    results = {}
    for body in request_bodys:
        response = requests.post('http://localhost:5000/', json=body)
        results[body['key']] = response.elapsed.total_seconds()
    return results


def test_batch_size_response(batches, repeats=5):
    data = dict()
    for kernel in KERNELS:
        data[kernel] = dict()
        for i in range(repeats):
            request_bodys = []
            for batch in batches:
                body = sample_request.copy()
                body['kernel'] = kernel
                body['batches'] = [batch]
                body['key'] = batch
                request_bodys.append(body)
            results = experiment(request_bodys)
            data[kernel][i] = results
    with open('test_batch_size_response.csv', 'w', newline='') as csvfile:
        spamwriter = csv.writer(csvfile)
        for kernel in data:
            print([kernel]+batches)
            spamwriter.writerow([kernel] + batches)
            for repeat in data[kernel]:
                print([repeat+1] + list(data[kernel][repeat].values()))
                spamwriter.writerow([repeat+1] + list(data[kernel][repeat].values()))


def test_batch_ranges():
    BATCHES = [100, 200, 300, 400, 500, 600, 700, 800, 800, 1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 50000, 100000]
    test_batch_size_response(BATCHES)


if __name__ == '__main__':
    test_batch_ranges()

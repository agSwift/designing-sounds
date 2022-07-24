import json
import os

from flask import Flask, request
from flask_cors import CORS
from flask_sock import Sock

from model import GPSoundGenerator

os.environ["CUDA_VISIBLE_DEVICES"] = "0"

app = Flask(__name__)
sock = Sock(app)
cors = CORS(app, resources={r"/": {"origins": "http://localhost:3000"}})

# CONSTANTS
SAMPLE_RATE = 44000  # 44kHz set as a default for a good sound quality

sound_generator = GPSoundGenerator(sample_rate=SAMPLE_RATE)


def handleRequest(request_body, sample_rate=SAMPLE_RATE):
    points = request_body['points']
    points = [(point[0], point[1]) for point in points]
    xs, ys = map(list, zip(*points))

    # Set kernel and its parameters
    kernel_name = request_body['kernel']
    if kernel_name is None:
        kernel_name = 'exponentiated_quadratic_kernel'
    params = request_body
    sound_generator.update_train_data(xs, ys, params, kernel_name, sample_rate)

    if request_body['optimiseParams']:
        trained_params = sound_generator.fit()
    else:
        trained_params = None
    sound_duration = request_body['soundDuration']
    points_gp = sound_generator.sample_from_posterior(sound_duration)
    response = {
        'dataTag': request_body['dataTag'],
        'soundMode': request_body['soundMode'],
    }
    response["data"] = points_gp.tolist()
    response["params"] = trained_params

    return response


@sock.route('/gaussian')
def socket_handler(ws):
    while True:
        raw_data = ws.receive()
        request_body = json.loads(raw_data)
        batches = request_body['batches']
        for batch in batches:
            response = handleRequest(request_body, batch)
            data_json = json.dumps(response)
            ws.send(data_json)


@app.route('/', methods=['POST'])
def generate_handler():
    request_body = request.get_json()
    print(request_body)
    batches = request_body['batches']
    data = handleRequest(request_body, batches[0])
    # Process input
    response = {}
    response["data"] = [data]

    return response


if __name__ == '__main__':
    app.run()

"""
REQ format: array of (array of [x, y] points)
{
   "points": [
      [1, 2],
      [3, 4]
   ]
}

RES format: array of [y-points] for each sample
{
   "samples": [
      [1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5, 6, 7]
   ]
}
"""

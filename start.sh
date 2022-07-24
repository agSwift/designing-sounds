#!/bin/sh

# Remove previous log files and set up logfile creation.
rm log/backend.log >/dev/null 2>&1 
rm log/frontend.log >/dev/null 2>&1
mkdir log >/dev/null 2>&1

# Run backend and store its PID.
echo 'Starting Backend...'
sh -c 'cd backend; ./venv.sh; ./run.sh' </dev/null >log/backend.log 2>&1 &
backend_pid=$!
# Wait until backend is fully running.
tail -f -n0 log/backend.log | grep -qe 'Serving Flask app'

# Run frontend and store its PID.
echo 'Starting Frontend...'
sh -c 'cd frontend; yarn install; yarn start' </dev/null >log/frontend.log 2>&1 &
frontend_pid=$!
# Wait until frontend is fully running.
tail -f -n0 log/frontend.log | grep -qe 'Starting the development server'

# Script exit routine
trap_ctrlc () {
  # Kill frontend then backend
  echo 'Terminating frontend...'
  kill $frontend_pid
  echo 'Success'
  echo 'Terminating backend...'
  kill $backend_pid
  # Python process has to be killed separately as `./run.sh` is a separate
  # process to the Flask server.
  kill $(lsof -t -i:"5000")
  echo 'Success'

  exit
}

# When signal 2 (SIGINT) is received (i.e. ctrl-c is pressed).
trap "trap_ctrlc" 2

# Wait until user presses ctrl-c.
echo 'Press ctrl-c to terminate the application.'
wait



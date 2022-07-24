python3 -m pip install --user virtualenv
python3 -m venv sound
# Command `source` does not work with non-Bash shells
. sound/bin/activate
pip3 install -r requirements.txt
git clone git@github.com:j-wilson/GPflowSampling.git
( cd GPflowSampling ; pip install -e . ; cd .. )
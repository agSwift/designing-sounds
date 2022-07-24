import React from 'react';
import './App.css';
import './SASSStyles.scss';
import SoundGraph from './components/SoundGraph';
import swal from "sweetalert";

function App() {

  const showHelp = () => swal({
    title: 'Designing Sounds by Drawing Them',
    className: 'instructions',
    text: `
    How to use this tool: 

    Plot the points for the mode you're in by clicking on the graph.

    Sound mode or Amplitude mode: Choose on which wave to operate on.

    Resample graph: Sample a new wave from the specified points.

    Reset graph: Reset the selected wave.

    Play: Play the sound for the duration of time.
    
    Download: Download the sound that would normally be played should you press Play as a .wav file.
    
    Sound Length: Specify a time length for how long you want the tone to play for (1 to 10 seconds)
    
    Kernels: Choose which kernel to use for generating the wave. You can tweak the parameters yourself, or optimise them automatically by clicking 'Optimise Parameters'.
    
    You can reopen this prompt at any time using the '?' button.
    `,
    closeOnClickOutside: true,
    closeOnEsc: true,
});

  showHelp();
  return  (
    <div>
      <div className="helpBox">
        <button onClick={showHelp} className="help">?</button>
      </div>
      <SoundGraph />
    </div>
  )
}
export default App;
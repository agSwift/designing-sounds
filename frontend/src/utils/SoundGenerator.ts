class SoundGenerator {
    audioSource: AudioBufferSourceNode | undefined;
    audioBuffer: AudioBuffer | undefined; 

    // Declare the sample rate of the audio.
    SAMPLE_RATE = 42000

    resetSound = () => {
        this.audioSource?.disconnect();
    }

    play = (soundPoints: {x: number, y: number}[], amplitudePoints: {x: number, y: number}[], duration=1) => {
        // Reset the previous sound playing.
        this.resetSound();
        // Fetch sample rate (FIXED)
        const sampleRate = this.SAMPLE_RATE;
        // Fetch the audio context
        const audioContext = new AudioContext({sampleRate});
        // Create a gain node to modulate amplitude
        const gainNode = audioContext.createGain();
        // Sound data array
        const data = soundPoints.map(point => point.y);
        
        // Schedule a linear ramp for each time point.
        amplitudePoints.forEach((point, i) => gainNode.gain.linearRampToValueAtTime(point.y,  duration * i / amplitudePoints.length))

        // Create a float array for the sound data
        const waveArray  = new Float32Array(data);

        // Create an audio buffer from the array
        this.audioBuffer = audioContext.createBuffer(1, waveArray.length, sampleRate);
        // Copy the array data to the buffer
        this.audioBuffer.copyToChannel(waveArray, 0);
        // Add an input buffer source to the audio context
        const source = audioContext.createBufferSource();
        // Ensure it loops
        source.loop = true;
        // Connect the audio data to the gain node
        gainNode.connect(audioContext.destination);
        // Connect the gain node to the audio output
        source.connect(gainNode);
        // Set the source buffer to the buffer data
        source.buffer = this.audioBuffer;
        // Start the audio source now, make it end once finished
        source.start(audioContext.currentTime, 0, audioContext.currentTime + duration);
        this.audioSource = source;
    }

    sum(a: number[]){
        return a.reduce((a, b) => a + b, 0);
    }

    concatFloatArray(arrays: Float32Array[]){
        const lens = arrays.map(a => a.length)
        const resultArray = new Float32Array(this.sum(lens));
        for (let i=0; i<arrays.length; i++){
            const start = this.sum(lens.slice(0,i));
            resultArray.set(arrays[i],start);
        }
        return resultArray;
    }

    downloadSound = (duration: number) => {
        //TODO make this same length as sound
        if (this.audioBuffer) {
            // Replicate the stored buffer points into a Float array
            const list = []
            const bufferdata = this.audioBuffer.getChannelData(0);
            for (var i = 0; i < Math.round(duration * this.SAMPLE_RATE / bufferdata.length); i++) {
                list.push(this.audioBuffer.getChannelData(0))
            }
            const arr = this.concatFloatArray(list)

            // Create a buffer with all the replicated points
            const buffer = new AudioBuffer({
                numberOfChannels: this.audioBuffer.numberOfChannels,
                length: arr.length,
                sampleRate: this.SAMPLE_RATE,
            })
            buffer.copyToChannel(arr, 0)

            // Convert the buffer to a .wav format
            const toWav = require('audiobuffer-to-wav');
            const wav = toWav(buffer)

            // Create the download URL
            const blob = new window.Blob([ new DataView(wav) ], {
                type: 'audio/wav'
            })
            const url = window.URL.createObjectURL(blob)

            // Create a dummy link object to download the file
            const link = document.createElement('a')
            link.setAttribute('style', 'display: none')
            link.href = url
            link.download = 'audio.wav'
            link.click()
            window.URL.revokeObjectURL(url)
        }
    }
}

export default SoundGenerator;
class TransientProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.threshold = 0.1;
    this.triggerCooldown = 0;
    this.port.onmessage = (event) => {
      if (event.data.type === 'set-threshold') {
        this.threshold = event.data.value;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const numChannels = input.length;
      const numSamples = input[0].length;
      
      for (let i = 0; i < numSamples; i++) {
        if (this.triggerCooldown > 0) {
          this.triggerCooldown--;
        } else {
          // 全チャンネルを走査し、左右のパンニングに関わらず最大の振幅を取得する
          let maxAmp = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            const amp = Math.abs(input[ch][i]);
            if (amp > maxAmp) maxAmp = amp;
          }

          if (maxAmp > this.threshold) {
            // currentTime（ブロックの開始時間）に、サンプル単位の正確な時間を加算して極限の精度を出す
            const exactTime = currentTime + (i / sampleRate);
            this.port.postMessage({ type: 'transient', time: exactTime });
            
            // 次の反応までのクールダウン（約100ms）
            this.triggerCooldown = sampleRate * 0.1; 
          }
        }
      }
    }
    return true;
  }
}

registerProcessor('transient-processor', TransientProcessor);

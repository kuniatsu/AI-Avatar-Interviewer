/**
 * Audio Manager - Web Audio API の音声入力・出力・解析
 * リアルタイム音量レベル解析でリップシンクに対応
 */

export interface AudioAnalyzerState {
  isListening: boolean;
  isSpeaking: boolean;
  volume: number; // 0-1 (正規化)
  frequency: number[];
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private dataArray: Uint8Array | null = null;
  private onVolumeChange: ((volume: number) => void) | null = null;
  private isListening: boolean = false;

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    // AudioContext の初期化
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Analyser ノードの作成
    if (this.audioContext) {
      this.analyser = this.audioContext.createAnalyser();
      if (this.analyser) {
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
  }

  async startListening(
    onVolumeChange: (volume: number) => void
  ): Promise<void> {
    await this.initialize();

    if (!this.audioContext || !this.analyser) {
      throw new Error('AudioContext not initialized');
    }

    try {
      // マイク入力の取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (!this.microphone && this.audioContext) {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      this.isListening = true;
      this.onVolumeChange = onVolumeChange;
      this.analyzeVolume();
    } catch (error) {
      console.error('Failed to access microphone:', error);
      throw error;
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
  }

  private analyzeVolume(): void {
    if (!this.isListening || !this.analyser || !this.dataArray) return;

    // 周波数データを取得
    this.analyser.getByteFrequencyData(this.dataArray as any);

    // 平均音量を計算（0-255 → 0-1に正規化）
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length / 255;

    // 音量変化をコールバック
    if (this.onVolumeChange) {
      this.onVolumeChange(average);
    }

    // 次のフレームをスケジュール
    this.animationFrameId = requestAnimationFrame(() => this.analyzeVolume());
  }

  async playAudio(audioUrl: string): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async synthesizeAndPlay(text: string): Promise<void> {
    // Web Speech API を使用して音声合成・再生
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech Synthesis API is not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  dispose(): void {
    this.stopListening();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// シングルトンインスタンス
let audioAnalyzerInstance: AudioAnalyzer | null = null;

export function getAudioAnalyzer(): AudioAnalyzer {
  if (!audioAnalyzerInstance) {
    audioAnalyzerInstance = new AudioAnalyzer();
  }
  return audioAnalyzerInstance;
}

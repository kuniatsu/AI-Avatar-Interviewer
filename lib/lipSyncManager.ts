/**
 * Lip-sync Manager - 音量レベルからアバターのリップシンク制御
 * 音声の周波数・音量に基づいて口の形状を変形
 */

import * as THREE from 'three';

export interface MorphTargets {
  A: number; // あ行
  I: number; // い行
  U: number; // う行
  E: number; // え行
  O: number; // お行
  neutral: number; // 閉じた状態
}

export interface FrequencyBands {
  O: number; // 低周波 0-500 Hz (お行)
  A: number; // 中低周波 500-1500 Hz (あ行)
  E: number; // 中周波 1500-3000 Hz (え行)
  I: number; // 中高周波 3000-5000 Hz (い行)
  U: number; // 高周波 5000-8000 Hz (う行)
}

export class LipSyncManager {
  private model: THREE.Scene | null = null;
  private morphTargets: Map<string, number> = new Map();
  private currentMorphWeights: MorphTargets = {
    A: 0,
    I: 0,
    U: 0,
    E: 0,
    O: 0,
    neutral: 1,
  };
  private smoothingFactor: number = 0.15; // スムーズな遷移用

  constructor(model?: THREE.Scene) {
    this.model = model || null;
    this.initializeMorphTargets();
  }

  private initializeMorphTargets(): void {
    // モデル内で利用可能な morph targets を検出
    if (this.model) {
      this.model.traverse((node) => {
        if (node instanceof THREE.Mesh && node.morphTargetDictionary) {
          Object.keys(node.morphTargetDictionary).forEach((key) => {
            this.morphTargets.set(key, 0);
          });
        }
      });
    }
  }

  /**
   * 音量レベルに基づいて口の形状を更新
   * @param volume 0-1 (正規化された音量)
   */
  updateFromVolume(volume: number): void {
    // 音量レベルから口の形状を決定
    // 簡易的には音量が高いほど口を大きく開く
    const mouthOpenness = Math.min(1, volume * 2);

    // 基本的なリップシンク形状に更新
    this.setMorphWeight('A', mouthOpenness);
    this.setMorphWeight('neutral', Math.max(0, 1 - mouthOpenness));

    this.applyMorphWeights();
  }

  /**
   * 周波数帯に基づいて口の形状を更新
   * @param bands 周波数帯のエネルギー値
   */
  updateFromFrequencyBands(bands: FrequencyBands): void {
    // 音量（全周波数帯の合計）を計算
    const totalEnergy = (bands.O + bands.A + bands.E + bands.I + bands.U) / 5;

    // 各周波数帯に対応する音韻のウェイトを設定
    // エネルギーが高いほどその音韻の口形が活性化
    this.setMorphWeight('O', Math.max(0, bands.O - 0.1));
    this.setMorphWeight('A', Math.max(0, bands.A - 0.1));
    this.setMorphWeight('E', Math.max(0, bands.E - 0.1));
    this.setMorphWeight('I', Math.max(0, bands.I - 0.1));
    this.setMorphWeight('U', Math.max(0, bands.U - 0.1));

    // 総エネルギーが低い場合は neutral を増加
    const neutralWeight = Math.max(0, 1 - totalEnergy * 2);
    this.setMorphWeight('neutral', neutralWeight);

    this.applyMorphWeights();
  }

  /**
   * 特定の口の形状を設定
   * @param phoneme 音韻 (A, I, U, E, O)
   * @param weight 重み (0-1)
   */
  setMorphWeight(phoneme: string, weight: number): void {
    weight = Math.max(0, Math.min(1, weight)); // 0-1 にクリップ

    // スムーズなアニメーション
    const current = this.currentMorphWeights[
      phoneme as keyof MorphTargets
    ] || 0;
    const target = weight;
    const smoothed =
      current + (target - current) * this.smoothingFactor;

    if (phoneme in this.currentMorphWeights) {
      this.currentMorphWeights[phoneme as keyof MorphTargets] = smoothed;
    }
  }

  /**
   * 特定の音声パターンでリップシンクを実行
   * @param phonemes 音韻のシーケンス
   * @param duration 各音韻の表示時間（ミリ秒）
   */
  playPhonemeSequence(phonemes: string[], duration: number = 100): void {
    phonemes.forEach((phoneme, index) => {
      setTimeout(() => {
        this.playPhoneme(phoneme);
      }, index * duration);
    });
  }

  /**
   * 単一の音韻を再生
   */
  playPhoneme(phoneme: string): void {
    // 全ての weight をリセット
    Object.keys(this.currentMorphWeights).forEach((key) => {
      if (key !== 'neutral') {
        this.setMorphWeight(key, 0);
      }
    });

    // 指定された音韻のみアクティブに
    if (phoneme !== 'neutral') {
      this.setMorphWeight(phoneme, 1);
      this.setMorphWeight('neutral', 0);
    } else {
      this.setMorphWeight('neutral', 1);
    }

    this.applyMorphWeights();
  }

  /**
   * 計算されたモーフウェイトをモデルに適用
   */
  private applyMorphWeights(): void {
    if (!this.model) return;

    this.model.traverse((node) => {
      if (node instanceof THREE.Mesh && node.morphTargetInfluences) {
        // VRM または 標準モデルのモーフターゲットに適用
        Object.entries(this.currentMorphWeights).forEach(
          ([phoneme, weight]) => {
            if (node.morphTargetDictionary && phoneme in node.morphTargetDictionary) {
              const index = node.morphTargetDictionary[phoneme];
              if (node.morphTargetInfluences && index !== undefined) {
                node.morphTargetInfluences[index] = weight;
              }
            }
          }
        );
      }
    });
  }

  /**
   * リップシンクをリセット
   */
  reset(): void {
    this.currentMorphWeights = {
      A: 0,
      I: 0,
      U: 0,
      E: 0,
      O: 0,
      neutral: 1,
    };
    this.applyMorphWeights();
  }

  /**
   * スムーズさの調整
   * @param factor 0-1 (小さいほど素早い)
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * モデルを更新
   */
  setModel(model: THREE.Scene): void {
    this.model = model;
    this.initializeMorphTargets();
    this.applyMorphWeights();
  }
}

// シングルトンインスタンス
let lipSyncManagerInstance: LipSyncManager | null = null;

export function getLipSyncManager(): LipSyncManager {
  if (!lipSyncManagerInstance) {
    lipSyncManagerInstance = new LipSyncManager();
  }
  return lipSyncManagerInstance;
}

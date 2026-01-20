/**
 * Expression Controller - アバターの表情制御
 * VRM モデルのブレンドシェイプを使用
 */

import * as THREE from 'three';
import type { EmotionType } from './emotionAnalyzer';

export type ExpressionType = 'smile' | 'sad' | 'neutral' | 'surprised' | 'angry';

export interface ExpressionState {
  type: ExpressionType;
  intensity: number; // 0-1
  eyelidClosedness: number; // 0-1（0 = 開く、1 = 閉じる）
  eyebrowHeight: number; // 0-1
}

export class ExpressionController {
  private model: THREE.Scene | null = null;
  private currentExpression: ExpressionState = {
    type: 'neutral',
    intensity: 0,
    eyelidClosedness: 0,
    eyebrowHeight: 0.5,
  };
  private targetExpression: ExpressionState = {
    type: 'neutral',
    intensity: 0,
    eyelidClosedness: 0,
    eyebrowHeight: 0.5,
  };
  private smoothingFactor: number = 0.1; // スムーズなアニメーション
  private blendShapeMap: Map<string, number> = new Map();

  constructor(model?: THREE.Scene) {
    this.model = model || null;
    this.initializeBlendShapes();
  }

  private initializeBlendShapes(): void {
    // VRM モデルで利用可能なブレンドシェイプを検出
    if (this.model) {
      this.model.traverse((node) => {
        if (node instanceof THREE.Mesh && node.morphTargetDictionary) {
          Object.keys(node.morphTargetDictionary).forEach((key) => {
            this.blendShapeMap.set(key, 0);
          });
        }
      });
    }
  }

  /**
   * 表情を設定
   */
  setExpression(
    type: ExpressionType,
    intensity: number = 1.0,
    duration: number = 300
  ): void {
    this.targetExpression = {
      type,
      intensity: Math.max(0, Math.min(1, intensity)),
      eyelidClosedness: this.getEyelidClosednessForExpression(type),
      eyebrowHeight: this.getEyebrowHeightForExpression(type),
    };

    // スムーズなトランジション
    this.animateToTarget(duration);
  }

  /**
   * 感情から表情に変換して設定
   */
  setExpressionFromEmotion(emotion: EmotionType, intensity: number): void {
    let expression: ExpressionType = 'neutral';

    switch (emotion) {
      case 'positive':
        expression = 'smile';
        break;
      case 'negative':
        expression = 'sad';
        break;
      case 'neutral':
      default:
        expression = 'neutral';
        break;
    }

    this.setExpression(expression, intensity);
  }

  /**
   * 表情タイプから目のとじ具合を取得
   */
  private getEyelidClosednessForExpression(expression: ExpressionType): number {
    switch (expression) {
      case 'smile':
        return 0.3; // 笑顔は目が少し細くなる
      case 'sad':
        return 0.2; // 悲しい顔
      case 'surprised':
        return 0.0; // 驚いた顔は目が大きく開く
      case 'angry':
        return 0.4; // 怒った顔
      case 'neutral':
      default:
        return 0;
    }
  }

  /**
   * 表情タイプから眉の高さを取得
   */
  private getEyebrowHeightForExpression(expression: ExpressionType): number {
    switch (expression) {
      case 'smile':
        return 0.6; // 笑顔は眉が上がる
      case 'sad':
        return 0.2; // 悲しい顔は眉が下がる
      case 'surprised':
        return 0.9; // 驚いた顔は眉がとても上がる
      case 'angry':
        return 0.3; // 怒った顔は眉が内寄りで下げ気味
      case 'neutral':
      default:
        return 0.5;
    }
  }

  /**
   * ターゲット表情にアニメーション
   */
  private animateToTarget(duration: number): void {
    const frames = Math.max(1, Math.floor(duration / 16)); // 約60fps

    const startExpression = { ...this.currentExpression };

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      const progress = Math.min(1, frameCount / frames);

      // スムーズな補間
      this.currentExpression = {
        type: this.targetExpression.type,
        intensity:
          startExpression.intensity +
          (this.targetExpression.intensity - startExpression.intensity) *
            progress,
        eyelidClosedness:
          startExpression.eyelidClosedness +
          (this.targetExpression.eyelidClosedness -
            startExpression.eyelidClosedness) *
            progress,
        eyebrowHeight:
          startExpression.eyebrowHeight +
          (this.targetExpression.eyebrowHeight - startExpression.eyebrowHeight) *
            progress,
      };

      this.applyExpression();

      if (frameCount < frames) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * 現在の表情をモデルに適用
   */
  private applyExpression(): void {
    if (!this.model) return;

    const { type, intensity, eyelidClosedness, eyebrowHeight } =
      this.currentExpression;

    // ブレンドシェイプを更新
    this.model.traverse((node) => {
      if (node instanceof THREE.Mesh && node.morphTargetInfluences) {
        // 笑顔制御
        if (node.morphTargetDictionary) {
          const smileIndex = node.morphTargetDictionary['smile'] ||
            node.morphTargetDictionary['Smile'] ||
            node.morphTargetDictionary['Smile_L'] ||
            node.morphTargetDictionary['Smile_R'];

          if (smileIndex !== undefined) {
            const smileValue =
              type === 'smile' ? intensity * 0.8 : intensity * 0.2;
            node.morphTargetInfluences[smileIndex] = Math.min(1, smileValue);
          }

          // 悲しい表情
          const sadIndex = node.morphTargetDictionary['sad'] ||
            node.morphTargetDictionary['Sad'];
          if (sadIndex !== undefined) {
            const sadValue = type === 'sad' ? intensity : 0;
            node.morphTargetInfluences[sadIndex] = Math.min(1, sadValue);
          }

          // 驚いた表情
          const surprisedIndex = node.morphTargetDictionary['surprised'] ||
            node.morphTargetDictionary['Surprised'];
          if (surprisedIndex !== undefined) {
            const surprisedValue =
              type === 'surprised' ? intensity * 0.7 : 0;
            node.morphTargetInfluences[surprisedIndex] = Math.min(
              1,
              surprisedValue
            );
          }

          // 怒った表情
          const angryIndex = node.morphTargetDictionary['angry'] ||
            node.morphTargetDictionary['Angry'];
          if (angryIndex !== undefined) {
            const angryValue = type === 'angry' ? intensity * 0.6 : 0;
            node.morphTargetInfluences[angryIndex] = Math.min(1, angryValue);
          }

          // 目のとじ具合
          const eyelidIndex = node.morphTargetDictionary['Blink'] ||
            node.morphTargetDictionary['blink'];
          if (eyelidIndex !== undefined) {
            node.morphTargetInfluences[eyelidIndex] = Math.min(
              1,
              eyelidClosedness
            );
          }

          // 眉の高さ
          const browIndex = node.morphTargetDictionary['Brows_Up'] ||
            node.morphTargetDictionary['BrowsUp'];
          if (browIndex !== undefined) {
            node.morphTargetInfluences[browIndex] = Math.min(1, eyebrowHeight);
          }
        }
      }
    });
  }

  /**
   * 瞬きアニメーション
   */
  blink(): void {
    const originalEyelidClosedness = this.currentExpression.eyelidClosedness;

    // 瞬きの開閉
    const blinkSequence = [0, 0.5, 1, 0.5, 0]; // フレーム
    const frameInterval = 50; // ms

    blinkSequence.forEach((closedness, index) => {
      setTimeout(() => {
        this.currentExpression.eyelidClosedness = Math.min(
          1,
          Math.max(0, originalEyelidClosedness + closedness - originalEyelidClosedness)
        );
        this.applyExpression();
      }, index * frameInterval);
    });
  }

  /**
   * 定期的に瞬きを実行
   */
  startBlinking(interval: number = 3000): void {
    setInterval(() => {
      this.blink();
    }, interval);
  }

  /**
   * モデルを更新
   */
  setModel(model: THREE.Scene): void {
    this.model = model;
    this.initializeBlendShapes();
    this.applyExpression();
  }

  /**
   * 現在の表情状態を取得
   */
  getCurrentExpression(): ExpressionState {
    return { ...this.currentExpression };
  }

  /**
   * リセット
   */
  reset(): void {
    this.currentExpression = {
      type: 'neutral',
      intensity: 0,
      eyelidClosedness: 0,
      eyebrowHeight: 0.5,
    };
    this.targetExpression = { ...this.currentExpression };
    this.applyExpression();
  }
}

// シングルトンインスタンス
let expressionControllerInstance: ExpressionController | null = null;

export function getExpressionController(): ExpressionController {
  if (!expressionControllerInstance) {
    expressionControllerInstance = new ExpressionController();
  }
  return expressionControllerInstance;
}

/**
 * Motion Controller - アバターのジェスチャーとボディモーション制御
 * 骨格アニメーションとトランスフォーム制御
 */

import * as THREE from 'three';

export type MotionType =
  | 'nod'
  | 'shake'
  | 'wave'
  | 'think'
  | 'shrug'
  | 'point'
  | 'idle';

export interface MotionState {
  type: MotionType;
  intensity: number; // 0-1
  duration: number; // ms
}

export class MotionController {
  private model: THREE.Scene | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animationClips: Map<string, THREE.AnimationClip> = new Map();
  private activeActions: Map<string, THREE.AnimationAction> = new Map();
  private boneMap: Map<string, THREE.Bone> = new Map();

  constructor(model?: THREE.Scene, mixer?: THREE.AnimationMixer) {
    this.model = model || null;
    this.mixer = mixer || null;
    this.initializeBones();
  }

  /**
   * ボーンマップを初期化
   */
  private initializeBones(): void {
    if (!this.model) return;

    this.model.traverse((node) => {
      if (node instanceof THREE.Bone) {
        // 骨の名前で識別
        const boneName = node.name.toLowerCase();
        this.boneMap.set(boneName, node);

        // VRM互換の骨名
        if (boneName.includes('head') || boneName.includes('neck')) {
          this.boneMap.set('head', node);
        }
        if (boneName.includes('leftarm') || boneName.includes('arm.l')) {
          this.boneMap.set('leftarm', node);
        }
        if (boneName.includes('rightarm') || boneName.includes('arm.r')) {
          this.boneMap.set('rightarm', node);
        }
      }
    });
  }

  /**
   * モーション実行
   */
  async playMotion(type: MotionType, intensity: number = 1.0): Promise<void> {
    intensity = Math.max(0, Math.min(1, intensity));

    switch (type) {
      case 'nod':
        this.playNod(intensity);
        break;
      case 'shake':
        this.playShake(intensity);
        break;
      case 'wave':
        this.playWave(intensity);
        break;
      case 'think':
        this.playThink(intensity);
        break;
      case 'shrug':
        this.playShrug(intensity);
        break;
      case 'point':
        this.playPoint(intensity);
        break;
      case 'idle':
        this.playIdle(intensity);
        break;
    }
  }

  /**
   * うなずきモーション
   */
  private playNod(intensity: number): void {
    const head = this.boneMap.get('head');
    if (!head) return;

    const originalRotation = head.rotation.clone();
    const frames = 8;
    const duration = 600 * (1 / intensity);

    this.animateHeadRotation(
      head,
      originalRotation,
      new THREE.Euler(Math.PI / 8 * intensity, 0, 0),
      duration,
      2 // 2 回繰り返す
    );
  }

  /**
   * 首を振るモーション
   */
  private playShake(intensity: number): void {
    const head = this.boneMap.get('head');
    if (!head) return;

    const originalRotation = head.rotation.clone();
    const duration = 400 * (1 / intensity);

    this.animateHeadRotation(
      head,
      originalRotation,
      new THREE.Euler(0, Math.PI / 6 * intensity, 0),
      duration,
      3 // 3 回繰り返す
    );
  }

  /**
   * 手を振るモーション
   */
  private playWave(intensity: number): void {
    const rightArm = this.boneMap.get('rightarm');
    if (!rightArm) return;

    const originalRotation = rightArm.rotation.clone();
    const amplitude = Math.PI / 4 * intensity;
    const duration = 1000 * (1 / intensity);

    let frameCount = 0;
    const totalFrames = Math.floor(duration / 16);

    const animate = () => {
      frameCount++;
      const progress = (frameCount % totalFrames) / totalFrames;
      const angle = Math.sin(progress * Math.PI * 4) * amplitude;

      rightArm.rotation.set(
        originalRotation.x + Math.PI / 6,
        originalRotation.y + angle,
        originalRotation.z
      );

      if (frameCount < totalFrames * 2) {
        // 2サイクル実行
        requestAnimationFrame(animate);
      } else {
        rightArm.rotation.copy(originalRotation);
      }
    };

    animate();
  }

  /**
   * 考えるモーション（あごに手をやる）
   */
  private playThink(intensity: number): void {
    const rightArm = this.boneMap.get('rightarm');
    if (!rightArm) return;

    const originalRotation = rightArm.rotation.clone();
    const duration = 800 * (1 / intensity);

    // 腕を上げてあごに近づける
    this.animateArmRotation(
      rightArm,
      originalRotation,
      new THREE.Euler(
        Math.PI / 3 * intensity,
        -Math.PI / 6 * intensity,
        0
      ),
      duration
    );
  }

  /**
   * 肩をすくめるモーション
   */
  private playShrug(intensity: number): void {
    // 左右の肩を上げる（簡易実装）
    const duration = 600 * (1 / intensity);
    const frameCount = Math.floor(duration / 16);

    let frame = 0;
    const animate = () => {
      frame++;
      const progress = (frame / frameCount) * 2; // 上昇と下降

      // アニメーション処理（実装簡略）
      if (frame < frameCount) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * 指差すモーション
   */
  private playPoint(intensity: number): void {
    const rightArm = this.boneMap.get('rightarm');
    if (!rightArm) return;

    const originalRotation = rightArm.rotation.clone();
    const duration = 800 * (1 / intensity);

    // 腕を前に伸ばす
    this.animateArmRotation(
      rightArm,
      originalRotation,
      new THREE.Euler(0, 0, 0),
      duration
    );
  }

  /**
   * アイドルモーション（呼吸など）
   */
  private playIdle(intensity: number): void {
    const head = this.boneMap.get('head');
    if (!head) return;

    const originalRotation = head.rotation.clone();
    const amplitude = Math.PI / 16 * intensity;
    const duration = 3000; // 3秒で 1サイクル

    let frameCount = 0;

    const animate = () => {
      frameCount++;
      const progress = (frameCount / (duration / 16)) % 1;
      const angle = Math.sin(progress * Math.PI * 2) * amplitude;

      head.rotation.y = originalRotation.y + angle;

      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * 頭部ロテーションアニメーション
   */
  private animateHeadRotation(
    bone: THREE.Bone,
    start: THREE.Euler,
    target: THREE.Euler,
    duration: number,
    repeat: number
  ): void {
    let cycleCount = 0;

    const animateCycle = () => {
      let frameCount = 0;
      const totalFrames = Math.floor(duration / 16);

      const animate = () => {
        frameCount++;
        const progress = frameCount / totalFrames;

        // スムーズな補間（easingを使用）
        const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        bone.rotation.x = start.x + (target.x - start.x) * eased;
        bone.rotation.y = start.y + (target.y - start.y) * eased;
        bone.rotation.z = start.z + (target.z - start.z) * eased;

        if (frameCount < totalFrames) {
          requestAnimationFrame(animate);
        } else {
          // 戻す
          if (cycleCount < repeat - 1) {
            cycleCount++;
            setTimeout(animateCycle, 100);
          } else {
            bone.rotation.copy(start);
          }
        }
      };

      animate();
    };

    animateCycle();
  }

  /**
   * 腕ロテーションアニメーション
   */
  private animateArmRotation(
    bone: THREE.Bone,
    start: THREE.Euler,
    target: THREE.Euler,
    duration: number
  ): void {
    let frameCount = 0;
    const totalFrames = Math.floor(duration / 16);

    const animate = () => {
      frameCount++;
      const progress = frameCount / totalFrames;

      // スムーズな補間
      const eased =
        progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      bone.rotation.x = start.x + (target.x - start.x) * eased;
      bone.rotation.y = start.y + (target.y - start.y) * eased;
      bone.rotation.z = start.z + (target.z - start.z) * eased;

      if (frameCount < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        bone.rotation.copy(start);
      }
    };

    animate();
  }

  /**
   * モデルとミキサーを設定
   */
  setModel(model: THREE.Scene, mixer?: THREE.AnimationMixer): void {
    this.model = model;
    if (mixer) {
      this.mixer = mixer;
    }
    this.initializeBones();
  }

  /**
   * ボーン検索（デバッグ用）
   */
  findBone(pattern: string): THREE.Bone | null {
    const lower = pattern.toLowerCase();
    for (const [name, bone] of this.boneMap) {
      if (name.includes(lower)) {
        return bone;
      }
    }
    return null;
  }

  /**
   * 利用可能なボーン一覧を取得
   */
  getAvailableBones(): string[] {
    return Array.from(this.boneMap.keys());
  }
}

// シングルトンインスタンス
let motionControllerInstance: MotionController | null = null;

export function getMotionController(): MotionController {
  if (!motionControllerInstance) {
    motionControllerInstance = new MotionController();
  }
  return motionControllerInstance;
}

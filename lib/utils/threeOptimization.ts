/**
 * Three.js Optimization Utilities
 * Dynamic imports and lazy loading for Three.js components
 */

/**
 * Three.js ライブラリの遅延ロード
 */
export async function loadThree() {
  return import('three');
}

/**
 * React Three Fiber の遅延ロード
 */
export async function loadReactThreeFiber() {
  const { Canvas } = await import('@react-three/fiber');
  return { Canvas };
}

/**
 * Drei の遅延ロード
 */
export async function loadDrei() {
  const {
    PerspectiveCamera,
    OrbitControls,
    useGLTF,
    Environment,
    useProgress,
    Html,
    Loader,
  } = await import('@react-three/drei');
  return {
    PerspectiveCamera,
    OrbitControls,
    useGLTF,
    Environment,
    useProgress,
    Html,
    Loader,
  };
}

/**
 * VRM ローダーの遅延ロード
 */
export async function loadVRMLoader() {
  const { VRM, VRMLoaderPlugin } = await import('@pixiv/three-vrm');
  const { GLTFLoader } = await import('three-stdlib');
  return { VRM, VRMLoaderPlugin, GLTFLoader };
}

/**
 * アニメーションミキサーの生成
 */
export async function createAnimationMixer(model: any) {
  const THREE = await loadThree();
  return new THREE.AnimationMixer(model);
}

/**
 * テクスチャローダーの生成
 */
export async function createTextureLoader() {
  const THREE = await loadThree();
  return new THREE.TextureLoader();
}

/**
 * シーンとカメラのセットアップ
 */
export async function setupScene() {
  const THREE = await loadThree();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  return { scene, camera, renderer };
}

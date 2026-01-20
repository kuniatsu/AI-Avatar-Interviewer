import React, { Suspense, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

interface VRMLoaderProps {
  modelUrl: string;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
}

// Suspense-based component for loading models
const VRMModel: React.FC<{ modelUrl: string; onLoaded?: () => void }> = ({
  modelUrl,
  onLoaded,
}) => {
  const { scene, animations } = useGLTF(modelUrl);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const { scene: threeScene } = useThree();

  useEffect(() => {
    const clonedScene = scene.clone();
    threeScene.add(clonedScene);

    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(clonedScene);
      animations.forEach((clip) => {
        const action = mixerRef.current?.clipAction(clip);
        if (action) {
          action.play();
        }
      });
    }

    onLoaded?.();

    return () => {
      threeScene.remove(clonedScene);
    };
  }, [scene, animations, threeScene, onLoaded]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return null;
};

export const VRMLoader: React.FC<VRMLoaderProps> = ({
  modelUrl,
  onLoaded,
  onError,
}) => {
  return (
    <Suspense fallback={null}>
      <VRMModel
        modelUrl={modelUrl}
        onLoaded={onLoaded}
      />
    </Suspense>
  );
};

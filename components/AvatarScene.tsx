import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { VRMLoader } from './VRMLoader';

interface AvatarSceneProps {
  onAvatarLoaded?: () => void;
  modelUrl?: string;
}

const Scene: React.FC<{ onAvatarLoaded?: () => void; modelUrl?: string }> = ({
  onAvatarLoaded,
  modelUrl,
}) => {
  const groupRef = React.useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  React.useEffect(() => {
    if ((modelUrl ? modelLoaded : groupRef.current) && onAvatarLoaded) {
      onAvatarLoaded();
    }
  }, [modelLoaded, onAvatarLoaded, modelUrl]);

  const handleModelLoaded = () => {
    setModelLoaded(true);
  };

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 7]} intensity={1} castShadow />
      <directionalLight position={[-5, -10, -7]} intensity={0.3} />

      {/* Ground plane */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={0xffffff} />
      </mesh>

      {/* VRM Model or Placeholder */}
      {modelUrl ? (
        <Suspense fallback={null}>
          <VRMLoader modelUrl={modelUrl} onLoaded={handleModelLoaded} />
        </Suspense>
      ) : (
        // Placeholder avatar - cube
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
          <meshStandardMaterial color={0x4a90e2} />
        </mesh>
      )}
    </group>
  );
};

export const AvatarScene: React.FC<AvatarSceneProps> = ({ onAvatarLoaded, modelUrl }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1, 3], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[0xcccccc]} />
      <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={45} />
      <Suspense fallback={null}>
        <Scene onAvatarLoaded={onAvatarLoaded} modelUrl={modelUrl} />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
};

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarSceneProps {
  onAvatarLoaded?: () => void;
}

const Scene: React.FC<{ onAvatarLoaded?: () => void }> = ({
  onAvatarLoaded,
}) => {
  const groupRef = React.useRef<THREE.Group>(null);

  React.useEffect(() => {
    if (groupRef.current && onAvatarLoaded) {
      onAvatarLoaded();
    }
  }, [onAvatarLoaded]);

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      <directionalLight position={[-5, -10, -7]} intensity={0.3} />

      {/* Ground plane */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={0xffffff} />
      </mesh>

      {/* Placeholder avatar - cube for now */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 1.5, 0.5]} />
        <meshStandardMaterial color={0x4a90e2} />
      </mesh>
    </group>
  );
};

export const AvatarScene: React.FC<AvatarSceneProps> = ({ onAvatarLoaded }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1, 3], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[0xcccccc]} />
      <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={45} />
      <Suspense fallback={null}>
        <Scene onAvatarLoaded={onAvatarLoaded} />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
};

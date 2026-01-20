import React, { useState } from 'react';
import Head from 'next/head';
import { AvatarScene } from '../components/AvatarScene';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const handleAvatarLoaded = () => {
    setAvatarLoaded(true);
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>AI Avatar Interviewer</title>
        <meta name="description" content="3D Avatar Interview Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        <AvatarScene onAvatarLoaded={handleAvatarLoaded} />
      </div>

      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
        >
          <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
        </div>
      )}
    </>
  );
}

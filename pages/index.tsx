import React, { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { AvatarScene } from '../components/AvatarScene';
import type { InterviewItem } from '../lib/claudeApiClient';

// InterviewUI を動的にインポート（クライアント側のみ）
const InterviewUI = dynamic(
  () => import('../components/InterviewUI').then((mod) => mod.InterviewUI),
  { ssr: false }
);

// サンプルのヒアリング項目
const SAMPLE_INTERVIEW_ITEMS: InterviewItem[] = [
  {
    id: '1',
    key: 'name',
    question: 'お名前を教えてください',
    description: 'ユーザーの名前',
    required: true,
  },
  {
    id: '2',
    key: 'email',
    question: 'メールアドレスを教えてください',
    description: 'ユーザーのメールアドレス',
    required: true,
  },
  {
    id: '3',
    key: 'interest',
    question: '興味のある分野を教えてください',
    description: 'ユーザーの関心分野',
    required: false,
  },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [interviewResult, setInterviewResult] = useState<Record<
    string,
    string | undefined
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const modelUrl = process.env.NEXT_PUBLIC_MODEL_URL;

  const handleAvatarLoaded = () => {
    setAvatarLoaded(true);
    setIsLoading(false);
  };

  const handleInterviewComplete = (result: Record<string, string | undefined>) => {
    setInterviewResult(result);
    setShowInterview(false);
    console.log('Interview completed:', result);
  };

  const handleInterviewError = (error: string) => {
    setError(error);
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
        <AvatarScene
          onAvatarLoaded={handleAvatarLoaded}
          modelUrl={modelUrl}
        />
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

      {/* スタートボタン */}
      {avatarLoaded && !showInterview && !interviewResult && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setShowInterview(true)}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            インタビュー開始
          </button>
        </div>
      )}

      {/* インタビューUI */}
      {showInterview && (
        <InterviewUI
          interviewItems={SAMPLE_INTERVIEW_ITEMS}
          onComplete={handleInterviewComplete}
          onError={handleInterviewError}
        />
      )}

      {/* 完了画面 */}
      {interviewResult && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: 40,
            right: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            zIndex: 100,
            maxHeight: '40vh',
            overflowY: 'auto',
          }}
        >
          <h3>インタビュー完了</h3>
          <pre style={{ fontSize: '12px', marginTop: '10px' }}>
            {JSON.stringify(interviewResult, null, 2)}
          </pre>
          <button
            onClick={() => {
              setInterviewResult(null);
            }}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            閉じる
          </button>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: '#d32f2f',
            color: 'white',
            padding: '15px',
            borderRadius: '4px',
            zIndex: 100,
          }}
        >
          {error}
        </div>
      )}
    </>
  );
}

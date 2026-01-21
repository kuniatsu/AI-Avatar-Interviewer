import React, { useState, useEffect, useRef } from 'react';
import { getAudioAnalyzer } from '../lib/audioAnalyzer';
import { getLipSyncManager } from '../lib/lipSyncManager';
import { getApiClient } from '../lib/api/apiClient';
import type { InterviewItem } from '../lib/claudeApiClient';
import { getInterviewManager } from '../lib/interviewManager';
import { getEmotionAnalyzer } from '../lib/emotionAnalyzer';
import { getExpressionController } from '../lib/expressionController';
import { getMotionController } from '../lib/motionController';
import { getDataStorage, type InterviewRecord } from '../lib/dataStorage';

interface InterviewUIProps {
  interviewItems: InterviewItem[];
  onComplete?: (result: Record<string, string | undefined>) => void;
  onError?: (error: string) => void;
}

export const InterviewUI: React.FC<InterviewUIProps> = ({
  interviewItems,
  onComplete,
  onError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioAnalyzerRef = useRef(getAudioAnalyzer());
  const lipSyncManagerRef = useRef(getLipSyncManager());
  const apiClientRef = useRef(getApiClient());
  const interviewManagerRef = useRef(getInterviewManager());
  const emotionAnalyzerRef = useRef(getEmotionAnalyzer());
  const expressionControllerRef = useRef(getExpressionController());
  const motionControllerRef = useRef(getMotionController());
  const dataStorageRef = useRef(getDataStorage());
  const startTimeRef = useRef<number>(Date.now());
  const emotionsRef = useRef<Array<{ timestamp: number; type: string; score: number }>>([]);
  const recognitionRef = useRef<any>(null);

  // 初期化
  useEffect(() => {
    const initialize = async () => {
      try {
        // Audio Analyzer を初期化
        await audioAnalyzerRef.current.initialize();

        // API Client を初期化（バックエンド使用）
        // システムプロンプトはサーバーで構築されるため、ここでは設定不要

        // Interview Manager を初期化
        interviewManagerRef.current.initializeItems(interviewItems);
        interviewManagerRef.current.onStateChanged((state) => {
          setProgress(interviewManagerRef.current.getProgress());
          if (state.status === 'completed' && state.result) {
            // インタビュー記録を保存
            const duration = Date.now() - startTimeRef.current;
            const record: InterviewRecord = {
              id: `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              duration,
              items: state.result,
              messages: apiClientRef.current.getConversationHistory(),
              emotions: emotionsRef.current as any,
            };

            dataStorageRef.current.saveInterview(record).catch((err) => {
              console.error('Failed to save interview record:', err);
            });

            onComplete?.(state.result);
          }
        });

        // Speech Recognition の初期化
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.lang = 'ja-JP';
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;

          recognitionRef.current.onstart = () => {
            setIsListening(true);
            setTranscript('');
          };

          recognitionRef.current.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                handleUserMessage(transcript);
              } else {
                interim += transcript;
              }
            }
            setTranscript(interim);
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current.onerror = (event: any) => {
            setError(`Recognition error: ${event.error}`);
          };
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Initialization failed');
        onError?.(error || 'Initialization failed');
      }
    };

    initialize();

    return () => {
      audioAnalyzerRef.current.dispose();
    };
  }, [interviewItems, onComplete, onError]);

  // ユーザーのメッセージを処理
  const handleUserMessage = async (userText: string) => {
    if (!userText.trim()) return;

    try {
      // ユーザーメッセージを表示
      setMessages((prev) => [...prev, { role: 'user', text: userText }]);

      // バックエンド API で応答を生成
      setIsSpeaking(true);
      const response = await apiClientRef.current.processUserMessage(
        userText,
        undefined,
        interviewItems
      );

      // 応答を表示
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);

      // Phase 3: 応答テキストから感情を分析
      const emotionScore = emotionAnalyzerRef.current.analyze(response);
      console.log('Emotion detected:', emotionScore);

      // 感情を記録
      emotionsRef.current.push({
        timestamp: Date.now(),
        type: emotionScore.type,
        score: emotionScore.score,
      });

      // 感情に基づいて表情を更新
      expressionControllerRef.current.setExpressionFromEmotion(
        emotionScore.type,
        emotionScore.intensity
      );

      // 感情に基づいてモーション実行
      if (emotionScore.type === 'positive') {
        motionControllerRef.current.playMotion('nod', emotionScore.intensity);
      } else if (emotionScore.type === 'negative') {
        motionControllerRef.current.playMotion('think', emotionScore.intensity);
      }

      // 応答を音声で再生
      await audioAnalyzerRef.current.synthesizeAndPlay(response);

      // Interview Manager で項目を更新
      interviewManagerRef.current.completeCurrentItem(userText);

      setIsSpeaking(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Processing failed';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // リスニング開始
  const startListening = async () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      // マイク音量解析開始
      await audioAnalyzerRef.current.startListening((volume) => {
        setVolume(volume);
        lipSyncManagerRef.current.updateFromVolume(volume);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // リスニング停止
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    audioAnalyzerRef.current.stopListening();
    setIsListening(false);
  };

  if (!isInitialized) {
    return <div style={styles.container}>Initializing...</div>;
  }

  return (
    <div style={styles.container}>
      {/* エラー表示 */}
      {error && <div style={styles.error}>{error}</div>}

      {/* 進捗バー */}
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progress * 100}%`,
          }}
        />
      </div>

      {/* メッセージ表示エリア */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={
              msg.role === 'user'
                ? styles.userMessage
                : styles.assistantMessage
            }
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* 音量表示 */}
      <div style={styles.volumeIndicator}>
        <div
          style={{
            ...styles.volumeBar,
            width: `${volume * 100}%`,
          }}
        />
      </div>

      {/* 制御ボタン */}
      <div style={styles.controls}>
        {!isListening ? (
          <button onClick={startListening} style={styles.button}>
            🎤 Start Listening
          </button>
        ) : (
          <button onClick={stopListening} style={styles.buttonActive}>
            ⏹ Stop Listening
          </button>
        )}

        {isSpeaking && (
          <div style={styles.speakingIndicator}>🔊 Speaking...</div>
        )}
      </div>

      {/* デバッグ用トランスクリプト */}
      {transcript && (
        <div style={styles.transcript}>
          <small>Transcript: {transcript}</small>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxHeight: '50vh',
    overflowY: 'auto',
    zIndex: 100,
  },
  error: {
    backgroundColor: '#d32f2f',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#444',
    borderRadius: '4px',
    marginBottom: '15px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.3s ease',
  },
  messagesContainer: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userMessage: {
    backgroundColor: '#1976d2',
    padding: '10px',
    borderRadius: '4px',
    alignSelf: 'flex-end',
    maxWidth: '80%',
    textAlign: 'right',
  },
  assistantMessage: {
    backgroundColor: '#555',
    padding: '10px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  volumeIndicator: {
    height: '4px',
    backgroundColor: '#333',
    borderRadius: '2px',
    marginBottom: '15px',
    overflow: 'hidden',
  },
  volumeBar: {
    height: '100%',
    backgroundColor: '#ff9800',
    transition: 'width 0.05s linear',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonActive: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  speakingIndicator: {
    padding: '10px',
    backgroundColor: '#ff9800',
    borderRadius: '4px',
    fontSize: '12px',
  },
  transcript: {
    marginTop: '10px',
    color: '#aaa',
    fontSize: '12px',
  },
};

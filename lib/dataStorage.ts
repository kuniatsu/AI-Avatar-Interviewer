/**
 * Data Storage - インタビューデータの永続化と統計
 * ローカルストレージとIndexedDB を利用
 */

export interface InterviewRecord {
  id: string;
  timestamp: number; // Unix timestamp
  duration: number; // ミリ秒
  items: Record<string, string | undefined>;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  emotions: Array<{
    timestamp: number;
    type: 'positive' | 'negative' | 'neutral';
    score: number;
  }>;
  metadata?: {
    userAgent?: string;
    language?: string;
    [key: string]: any;
  };
}

export interface InterviewStats {
  totalCount: number;
  averageDuration: number;
  completionRate: number;
  positiveEmotions: number;
  negativeEmotions: number;
  neutralEmotions: number;
  mostCommonAnswers: Record<string, string>;
}

export class DataStorage {
  private storageKey = 'interview_data_v1';
  private dbName = 'InterviewDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  /**
   * IndexedDB を初期化
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('interviews')) {
          const store = db.createObjectStore('interviews', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * インタビュー記録を保存
   */
  async saveInterview(record: InterviewRecord): Promise<void> {
    // ローカルストレージにも保存（バックアップ）
    try {
      const existing = this.getFromLocalStorage();
      existing.push(record);
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(existing.slice(-100)) // 最新100件を保持
      );
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // IndexedDB に保存
    if (!this.db) {
      await this.initializeDB();
    }

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['interviews'], 'readwrite');
        const store = transaction.objectStore('interviews');
        const request = store.add(record);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * ローカルストレージから取得
   */
  private getFromLocalStorage(): InterviewRecord[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
      return [];
    }
  }

  /**
   * 全ての記録を取得
   */
  async getAllRecords(): Promise<InterviewRecord[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction(['interviews'], 'readonly');
      const store = transaction.objectStore('interviews');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 指定期間の記録を取得
   */
  async getRecordsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<InterviewRecord[]> {
    const allRecords = await this.getAllRecords();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return allRecords.filter(
      (record) =>
        record.timestamp >= startTime && record.timestamp <= endTime
    );
  }

  /**
   * 統計を計算
   */
  async getStats(): Promise<InterviewStats> {
    const records = await this.getAllRecords();

    if (records.length === 0) {
      return {
        totalCount: 0,
        averageDuration: 0,
        completionRate: 0,
        positiveEmotions: 0,
        negativeEmotions: 0,
        neutralEmotions: 0,
        mostCommonAnswers: {},
      };
    }

    // 平均時間
    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / records.length;

    // 感情統計
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    records.forEach((record) => {
      record.emotions?.forEach((emotion) => {
        switch (emotion.type) {
          case 'positive':
            positiveCount++;
            break;
          case 'negative':
            negativeCount++;
            break;
          case 'neutral':
            neutralCount++;
            break;
        }
      });
    });

    const totalEmotions =
      positiveCount + negativeCount + neutralCount || 1;

    // 最も一般的な回答
    const answerFrequency: Record<string, number> = {};
    records.forEach((record) => {
      Object.values(record.items).forEach((answer) => {
        if (answer) {
          answerFrequency[answer] = (answerFrequency[answer] || 0) + 1;
        }
      });
    });

    const mostCommonAnswers: Record<string, string> = {};
    Object.entries(answerFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([answer]) => {
        mostCommonAnswers[answer] = answer;
      });

    return {
      totalCount: records.length,
      averageDuration,
      completionRate: 1.0, // すべての記録は完了済み
      positiveEmotions: (positiveCount / totalEmotions) * 100,
      negativeEmotions: (negativeCount / totalEmotions) * 100,
      neutralEmotions: (neutralCount / totalEmotions) * 100,
      mostCommonAnswers,
    };
  }

  /**
   * 記録を削除
   */
  async deleteRecord(id: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction(['interviews'], 'readwrite');
      const store = transaction.objectStore('interviews');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 全データを削除
   */
  async clearAll(): Promise<void> {
    localStorage.removeItem(this.storageKey);

    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction(['interviews'], 'readwrite');
      const store = transaction.objectStore('interviews');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * JSON として エクスポート
   */
  async exportAsJSON(): Promise<string> {
    const records = await this.getAllRecords();
    const stats = await this.getStats();
    return JSON.stringify({ records, stats }, null, 2);
  }

  /**
   * CSV としてエクスポート
   */
  async exportAsCSV(): Promise<string> {
    const records = await this.getAllRecords();

    if (records.length === 0) {
      return '';
    }

    // ヘッダー
    const headers = [
      'ID',
      'Timestamp',
      'Duration (sec)',
      'Positive (%)',
      'Negative (%)',
      'Neutral (%)',
    ];

    // データ行
    const rows = records.map((record) => {
      const positiveEmotions =
        (record.emotions?.filter((e) => e.type === 'positive').length || 0) /
        (record.emotions?.length || 1);
      const negativeEmotions =
        (record.emotions?.filter((e) => e.type === 'negative').length || 0) /
        (record.emotions?.length || 1);
      const neutralEmotions =
        (record.emotions?.filter((e) => e.type === 'neutral').length || 0) /
        (record.emotions?.length || 1);

      return [
        record.id,
        new Date(record.timestamp).toISOString(),
        (record.duration / 1000).toFixed(1),
        (positiveEmotions * 100).toFixed(1),
        (negativeEmotions * 100).toFixed(1),
        (neutralEmotions * 100).toFixed(1),
      ];
    });

    // CSV フォーマット
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}

// シングルトンインスタンス
let dataStorageInstance: DataStorage | null = null;

export function getDataStorage(): DataStorage {
  if (!dataStorageInstance) {
    dataStorageInstance = new DataStorage();
  }
  return dataStorageInstance;
}

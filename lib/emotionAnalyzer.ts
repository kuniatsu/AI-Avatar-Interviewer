/**
 * Emotion Analyzer - テキストから感情を分析
 * ポジティブ/ネガティブ/ニュートラルを判定
 */

export type EmotionType = 'positive' | 'negative' | 'neutral';

export interface EmotionScore {
  type: EmotionType;
  score: number; // 0-1 (確度)
  intensity: number; // 0-1 (感情の強度)
}

export class EmotionAnalyzer {
  // ポジティブワード
  private positiveWords = new Set([
    'ありがとう',
    'すばらしい',
    '素晴らしい',
    '良い',
    'いい',
    '楽しい',
    '嬉しい',
    '喜ぶ',
    '笑う',
    '面白い',
    'おもしろい',
    '最高',
    '最良',
    '優秀',
    '素敵',
    'かっこいい',
    '美しい',
    '綺麗',
    'きれい',
    'すっきり',
    'さっぱり',
    '爽やか',
    '幸せ',
    '幸福',
    '満足',
    '満足度',
    '嬉しい',
    'うれしい',
    '嬉嬉',
    'ワクワク',
    'わくわく',
    'ルンルン',
    'るんるん',
    'やった',
    'やったー',
    'よかった',
    '良かった',
    '感激',
    '感動',
    '愛する',
    '愛している',
    '愛してる',
    '大好き',
    'だいすき',
    '好きです',
    'すきです',
    '推しメン',
    'おいしい',
    '美味しい',
    'おいしい',
    '快適',
    'めでたい',
    'めでたし',
    'おめでとう',
    'おめでとうございます',
  ]);

  // ネガティブワード
  private negativeWords = new Set([
    'つらい',
    '辛い',
    '苦しい',
    '悲しい',
    '悲しむ',
    '泣く',
    '怒る',
    'むかつく',
    'むかっく',
    '腹が立つ',
    '怖い',
    '恐ろしい',
    '恐怖',
    '嫌い',
    'きらい',
    '嫌だ',
    '嫌です',
    'まずい',
    'まずい',
    '汚い',
    'きたない',
    'きたなーい',
    'うるさい',
    'うるさーい',
    '五月蝿い',
    '退屈',
    'つまらない',
    'つまらん',
    'つまんない',
    'つまんない',
    '失敗',
    '失敗した',
    'しくった',
    'しくじった',
    '最悪',
    'さいあく',
    '最低',
    'さいてい',
    '災い',
    'わざわい',
    '不幸',
    'ふこう',
    '不幸せ',
    'ふしあわせ',
    '不満',
    'ふまん',
    '不満足',
    'ふまんぞく',
    '不安',
    'ふあん',
    'うんざり',
    'うんざりだ',
    'げんなり',
    'げんなりする',
    '呆然',
    'ぼうぜん',
    '痛い',
    'いたい',
    '病気',
    'びょうき',
    '患う',
    'わずらう',
    '病む',
    'やむ',
    'くたびれる',
    '疲れる',
    'つかれる',
    'しんどい',
    'だるい',
    'ぐったり',
    'へとへと',
    'ぼろぼろ',
  ]);

  // 強化語（感情を強める）
  private intensifiers = new Set([
    'とても',
    '本当に',
    'ほんとに',
    'ほんとうに',
    'とっても',
    'めちゃめちゃ',
    'めっちゃ',
    'ちょっと',
    'ちょいと',
    'かなり',
    '非常に',
    'ひじょうに',
    'すごく',
    'すごーく',
    'すごい',
    'ものすごく',
    '物凄く',
    'ものすごい',
    '物凄い',
    'もの凄い',
    'たいして',
    '大して',
    'かったが',
    '甚だしく',
    'はなはだしく',
    'もう本当に',
    'もう本当',
    'もう',
    'なんだか',
    'なんか',
    'ちょっと',
  ]);

  // 弱化語（感情を弱める）
  private mitigators = new Set([
    'ちょっと',
    'ちょいと',
    '少し',
    'すこし',
    'やや',
    'まあ',
    'まあまあ',
    'まあまあまあ',
    'わりと',
    'わりには',
    '割りと',
    'そこそこ',
    'ほどほど',
    'まあまあ',
  ]);

  /**
   * テキストの感情を分析
   */
  analyze(text: string): EmotionScore {
    const lowerText = text.toLowerCase();

    // 単語をカウント
    let positiveCount = 0;
    let negativeCount = 0;
    let intensity = 1.0;

    // ポジティブワード検索
    for (const word of this.positiveWords) {
      if (lowerText.includes(word)) {
        positiveCount++;
      }
    }

    // ネガティブワード検索
    for (const word of this.negativeWords) {
      if (lowerText.includes(word)) {
        negativeCount++;
      }
    }

    // 強化語を検索して強度を上げる
    for (const word of this.intensifiers) {
      if (lowerText.includes(word)) {
        intensity = Math.min(1.0, intensity + 0.1);
      }
    }

    // 弱化語を検索して強度を下げる
    for (const word of this.mitigators) {
      if (lowerText.includes(word)) {
        intensity = Math.max(0.3, intensity - 0.1);
      }
    }

    // 感情を判定
    if (positiveCount > negativeCount && positiveCount > 0) {
      return {
        type: 'positive',
        score: Math.min(1.0, positiveCount / (positiveCount + negativeCount + 1)),
        intensity,
      };
    } else if (negativeCount > positiveCount && negativeCount > 0) {
      return {
        type: 'negative',
        score: Math.min(1.0, negativeCount / (positiveCount + negativeCount + 1)),
        intensity,
      };
    } else {
      return {
        type: 'neutral',
        score: 0.5,
        intensity: 0.5,
      };
    }
  }

  /**
   * 複数のテキストから平均感情を計算
   */
  analyzeMultiple(texts: string[]): EmotionScore {
    if (texts.length === 0) {
      return { type: 'neutral', score: 0.5, intensity: 0.5 };
    }

    const results = texts.map((text) => this.analyze(text));

    // 平均スコアを計算
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const avgIntensity =
      results.reduce((sum, r) => sum + r.intensity, 0) / results.length;

    // 最も多い感情タイプを選ぶ
    const typeCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    results.forEach((r) => {
      typeCounts[r.type]++;
    });

    const dominantType = Object.entries(typeCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0] as EmotionType;

    return {
      type: dominantType,
      score: avgScore,
      intensity: avgIntensity,
    };
  }

  /**
   * 感情タイプから表情タイプに変換
   */
  emotionToExpression(emotion: EmotionType): string {
    switch (emotion) {
      case 'positive':
        return 'smile';
      case 'negative':
        return 'sad';
      case 'neutral':
      default:
        return 'neutral';
    }
  }
}

// シングルトンインスタンス
let emotionAnalyzerInstance: EmotionAnalyzer | null = null;

export function getEmotionAnalyzer(): EmotionAnalyzer {
  if (!emotionAnalyzerInstance) {
    emotionAnalyzerInstance = new EmotionAnalyzer();
  }
  return emotionAnalyzerInstance;
}

# AI Avatar Interviewer (仮)

## 📖 概要
Webブラウザ上で動作する、3Dアバターによる対話型ヒアリングアプリケーションです。
従来のフォーム入力や一問一答形式のチャットボットとは異なり、自然な会話のキャッチボールを通じて、あらかじめ設定された必要な情報をユーザーから聞き出すことを目的としています。

## 🚀 特徴

### 1. 自然言語による高度な情報抽出
* **目的指向の対話**: ユーザーの曖昧な回答（例：「北の方に住んでいる」）に対しても、文脈を理解し「それは北海道ですか？東北ですか？」といった自然な深掘り質問を行い、最終的に確定的な情報を取得します。
* **シナリオレス**: 固定されたセリフを読み上げるのではなく、LLM（大規模言語モデル）を活用してその場の状況に応じた自然な対話を生成します。

### 2. ノンバーバル・コミュニケーションの同期
* **リップシンク**: 発話内容に合わせてアバターの口の動き（リップシンク）を正確に同期させます。
* **感情表現**: 会話の内容（ポジティブ/ネガティブ）をリアルタイムに解析し、表情や体の動きに反映させます（例：深刻な話では神妙な顔、面白い話では笑顔など）。

### 3. コストパフォーマンスを重視したアーキテクチャ
* **サーバーレス & 静的ホスティング**: GitHub Pages, Vercel, Cloudflare Pages 等の無料枠を活用し、ランニングコストを最小限に抑えます。

## 🛠 技術スタック（予定）

### インフラ・ホスティング
* **Hosting**: Vercel / Cloudflare Pages / GitHub Pages (いずれかを選択)

### フロントエンド・アバター制御
* **Framework**: React / Next.js (静的エクスポート)
* **3D Library**: Three.js / React Three Fiber
* **Avatar Format**: VRM
* **Animation/Lip-sync**: ライブラリ選定中 (音声解析によるリアルタイムリップシンク実装)

### 開発ツール
* **AI Coding Assistant**: Cursor / Claude Code
    * AIを活用したコード生成・実装を主軸に開発を進行

## 📋 要件定義

### 必須機能
1.  **URLアクセス**: ブラウザでURLを開くだけで即座にアバターが表示され、対話が開始できること。
2.  **ヒアリング完遂**: 設定された質問項目（住所、氏名、嗜好など）を全て聞き出すまで、対話を継続・誘導するロジック。
3.  **自然な挙動**: 音声と口の動きのズレ、感情と表情の不一致を排除する。

## 📦 開発ロードマップ
1.  **フェーズ 1** ✅ (実装中): 3Dアバターのブラウザ表示と基本的なリップシンクの実装
2.  **フェーズ 2**: LLM連携による自然対話ロジックの実装（ヒアリング項目の管理）
3.  **フェーズ 3**: 文脈理解による感情・モーション制御の実装
4.  **フェーズ 4**: ホスティング環境へのデプロイと最適化

## 🚀 クイックスタート

### 前提条件
* Node.js 18.x 以上
* npm 9.x 以上

### セットアップ

```bash
# 1. 依存パッケージのインストール
npm install

# 2. 開発サーバーの起動
npm run dev

# 3. ブラウザで開く
# http://localhost:3000 を開く
```

### ビルド・デプロイ

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## 📁 プロジェクト構造

```
ai-avatar-interviewer/
├── components/
│   ├── AvatarScene.tsx         # 3D シーン（Three.js + React Three Fiber）
│   └── VRMLoader.tsx           # VRM ローダー（Phase 2 で実装予定）
├── pages/
│   ├── _app.tsx                # Next.js アプリケーションルート
│   └── index.tsx               # メインページ
├── styles/
│   └── globals.css             # グローバルスタイル
├── public/                     # 静的ファイル（VRM モデルはここに配置）
├── next.config.js              # Next.js 設定
├── tsconfig.json               # TypeScript 設定
└── package.json                # 依存パッケージ管理
```

## 🛠 実装済みの技術スタック（Phase 1）

| 機能 | ライブラリ | バージョン |
|------|-----------|----------|
| フレームワーク | Next.js | ^16.1.4 |
| UI ライブラリ | React | ^19.2.3 |
| 3D レンダリング | Three.js | ^0.182.0 |
| React 向け 3D | @react-three/fiber | ^9.5.0 |
| 3D ユーティリティ | @react-three/drei | ^10.7.7 |
| VRM 対応予定 | @pixiv/three-vrm | ^3.4.5 |
| 言語 | TypeScript | ^5.9.3 |

## 📝 Phase 1 実装内容

### ✅ 完了項目

1. **Next.js プロジェクト初期化**
   - TypeScript サポート
   - 開発・ビルド環境構築

2. **3D シーン構築**
   - React Three Fiber による Canvas セットアップ
   - OrbitControls で 3D カメラ操作対応
   - 照明設定（環境光 + 指向性ライト）
   - グラウンドプレーン
   - プレースホルダーアバター（立方体）

3. **ローディング UI**
   - シーン読み込み中のローディング画面

### 🎮 操作方法

- **マウス中ボタンドラッグ**: カメラ回転
- **マウス右ボタンドラッグ**: カメラパン
- **マウスホイール**: ズームイン/アウト

## 🎯 Phase 2 実装予定

1. **VRM モデル統合**
   - VRM ファイルの読み込み
   - Three.js への統合
   - ボーン・スケルトン制御

2. **音声・リップシンク基盤**
   - Web Audio API の統合
   - 音量レベル解析

3. **Anthropic Claude API 連携**
   - 会話ロジックの実装
   - ヒアリング項目管理

## 📦 VRM ファイル の準備（Phase 2 以降）

1. **フリーの VRM モデルを入手**
   - [VroidHub](https://hub.vroid.com/) など

2. **public/ フォルダに配置**
   ```
   public/models/avatar.vrm
   ```

3. **AvatarScene.tsx で読み込み**
   ```typescript
   const modelUrl = '/models/avatar.vrm';
   ```

## 🔧 開発時のトラブルシューティング

### ビルドエラーが出た場合
```bash
# キャッシュをクリア
rm -rf .next node_modules
npm install
npm run build
```

### 3D が表示されない場合
1. ブラウザコンソール（F12）でエラーを確認
2. WebGL 対応状況を確認
3. http://localhost:3000 にアクセス（HTTPS 不要）

## 📚 参考リソース

- [Three.js ドキュメント](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [VRM 仕様](https://vrm.dev/)
- [Next.js ドキュメント](https://nextjs.org/docs)

---
*This project is developed primarily using AI tools (Cursor, Claude Code).*

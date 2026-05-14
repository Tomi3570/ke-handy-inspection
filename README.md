# Handy Inspection — Concept Prototype

紙図面の読み取り・寸法測定・記録までを一台で繋ぐ、ハンディ寸法測定器のコンセプトプロトタイプ。

> A concept prototype for a handheld inspection device that connects paper drawing reading, dimensional measurement, and recording into a single experience.

---

## 🇯🇵 日本語

### このプロトタイプについて

本プロトタイプは、**ハンディ寸法測定器のスキャン体験を検証するためのコンセプトデモ**です。実機の設計ではなく、想定するユーザー体験をブラウザ上で再現することを目的としています。

### 重要な前提

- **測定値・OK/NG 判定はダミーデータ**であり、寸法精度を検証するものではありません。
- カメラ機能はブラウザの `getUserMedia` を使用して、図面・ワークを撮影する体験を再現するためのものです。
- 実際の OCR、形状認識、寸法測定は行っていません。
- スキャン進捗は事前に定義されたタイムラインで進行します。

### 体験フロー（7画面）

1. **プロトタイプ案内** — 本プロトタイプの注意事項
2. **図面の読み取り** — Scannable 風のカメラ UI で紙図面を撮影
3. **検査リスト確認** — 図面から検出した検査項目（バルーン番号・寸法・公差）を表示
4. **ワークのスキャン準備** — Object Capture 風のバウンディングボックスでワークを捉える
5. **スキャン中** — 検査項目の取得状況・不足箇所をリアルタイムに表示
6. **測定結果** — OK/NG/未取得 のサマリーと詳細
7. **FAI レポート** — Form 3 形式の検査結果レポート

### 中心となる体験設計

**「検査項目を追いかける作業から、ワーク全体を読み取る作業へ変える」**

作業者が項目を1つずつ選んで測るのではなく、ワークの周囲をスキャンする中で、図面から読み取った検査項目が埋まっていく体験を目指しています。

### 動かし方

ローカルで動かす場合（カメラ機能を使うため、HTTPS もしくは localhost が必要です）:

```bash
# Python 3 が入っている環境
python3 -m http.server 8000

# その後ブラウザで開く
# http://localhost:8000/
```

ブラウザでカメラの使用許可を求められたら **「許可」** を選択してください。カメラが使えない環境では、各画面の「シミュレーションで続行」ボタンで進められます。

### 推奨環境

- モバイルブラウザ（iPhone / Android） — 実機の体験に近い
- デスクトップ Chrome / Safari — デバイスフレーム付きで表示

---

## 🇬🇧 English

### About this prototype

This is a **concept prototype** for a handheld dimensional inspection device. It demonstrates the intended user experience in a browser, not the actual device design.

### Important notes

- **Measurement values and OK/NG decisions are dummy data**. This prototype does not validate measurement accuracy.
- The camera feature uses the browser's `getUserMedia` API only to reproduce the experience of pointing the device at a drawing or workpiece.
- No actual OCR, shape recognition, or dimension measurement is performed.
- Scan progress follows a predefined timeline.

### Experience flow (7 screens)

1. **Prototype intro** — disclaimers
2. **Drawing scan** — Scannable-like camera UI for paper drawing capture
3. **Inspection list** — display of detected items (balloon numbers, dimensions, tolerances)
4. **Object scan prep** — Object Capture-like bounding box for capturing the workpiece
5. **Active scan** — real-time display of acquired / missing inspection items
6. **Results** — OK/NG/Missing summary and detail
7. **FAI Report** — Form 3-style inspection report

### Core experience design

**"Shift from chasing one inspection item at a time to scanning the whole workpiece."**

The user doesn't pick items individually; instead, as they scan around the workpiece, the inspection items extracted from the drawing get filled in progressively.

### How to run

To run locally (camera API requires HTTPS or localhost):

```bash
# Python 3
python3 -m http.server 8000

# Then open in browser
# http://localhost:8000/
```

Allow camera permission when prompted. If unavailable, use the "Continue with simulation" buttons.

### Recommended environment

- Mobile browser (iPhone / Android) — closest to the intended experience
- Desktop Chrome / Safari — renders with device frame

---

## Tech

- Pure HTML / CSS / JavaScript (no build step)
- Real camera via `getUserMedia` (with simulation fallback)
- Deployable on GitHub Pages

## License

This is a portfolio prototype.

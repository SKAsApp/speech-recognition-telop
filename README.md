speech-recognition-telop

# 音声認識テロップ

Speech Recognition Telop for Japanese broadcasting

If you speak English, please read [English version](./README.en.md)


## 注意

- 現在Web Speech APIを使用した実装となっているため，Chromium系のブラウザーでのみ動作します。
- 無料で使用できますが，使用中の音声データはGoogleに送信され，音声認識の精度改善のために使用されます（人間が音声を聞くようです）。機密情報等は話さないようにお願いします。
- 本アプリを使用したことによる情報漏えい，その他の損害については本アプリ開発者は一切責任を取らないものとします。
- ご利用のブラウザー（API）によっては利用時間の制限があります。
- 本アプリのソースコード（表示・記録機能）はGPL-3.0の範囲内で商用利用してもかまいませんが，音声認識に関してはご利用のブラウザーにご確認ください。
	- Chromium＋Speech API（非公開API）では商用利用できません。禁止されています。
	- Google Chromeでは特に情報は見つかりませんでしたが，商用利用は控えるようお願いします（情報漏えいの観点からも控えることをオススメします）。
- 試用ページは問題ありませんが，プロトコルがHTTPSのサイトに配置しないと動作しません（HTTPでは動きません）。


## 概要

生配信時にリアルタイムでテロップを生成するクライアントアプリです。あくまで音声認識の結果を表示・記録するだけであり，実際の音声認識処理は外部のクラウドサービスに任せます。

グリーンバックで表示するのでXSplit BroadcasterやOBS Studioで透過させることが可能です。

簡易的にタイムスタンプ付きで記録する機能もあるので，生配信の後の編集時や，動画撮影時にもお使いください。


## 試用

SKAのニコ生（SKA’s community　[co2335074](https://com.nicovideo.jp/community/co2335074)）で2019年8月より運用しています。（しかし，しばらく配信していないのでご覧になることはできません）

使ってみたい場合[こちら](https://skasapp.github.io/speech-recognition-telop/web-speech/index.html)からお試しください。URLは数か月以内に変更する予定なので，ブックマークはリンク先ではなく，このページにするようお願いします。


## 簡易保存機能の記録形式

次のようなJSON形式。ただし，この例では値はその値の説明の文字列にしています。

```JSON
[
	{
		"id": "数値：0始まりの通し番号",
		"time": {
			"hour": "数値：認識した時刻の「時」",
			"minute": "数値：認識した時刻の「分」",
			"second": "数値：認識した時刻の「秒」"
		},
		"interval": {
			"hour": "数値：開始ボタンを押した時刻を0としてカウントした「時間」",
			"minute": "数値：開始ボタンを押した時刻を0としてカウントした「分」",
			"second": "数値：開始ボタンを押した時刻を0としてカウントした「秒」",
			"millisecond": "数値：開始ボタンを押した時刻を0としてカウントした「ミリ秒」"
		},
		"transcript": "文字列：音声認識の結果",
		"confidence": "数値：信頼度"
	}
]

```


## 今後の予定

- Web Speech APIだけでなく，Azureへの対応（高精度化＆ライセンス問題回避＆句読点挿入のため）
- クライアントサイドだけでなくサーバーサイドの機能も追加
	- 音声認識結果の後処理
	- もっと便利な記録機能（キーワード抽出機能等）
	- SRTおよびWebVTT形式での字幕出力


## 更新履歴

YYYY/MM/DD（年/月/日）

- 2020/02/09　Ver 1.1.0：簡易保存機能の追加
- 2020/02/08　Ver 1.0.1：1.0.0で正しく音声認識が動かないバグの修正
- 2020/02/08　Ver 1.0.0：信頼度表示のあり／なし選択
- 2020/02/07　Ver 0.1.0：初版（実質2019/08/31時点のもの）
- 2020/02/07　Ver 0.0.0：リポジトリ作成

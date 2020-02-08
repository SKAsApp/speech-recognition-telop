speech-recognition-telop

# 音声認識テロップ クライアントアプリ　by SKA

Speech Recognition Telop for Japanese broadcasting

If you speak English, please read [English version](./README.en.md)


## 注意

- まだテスト段階なので，詳しい解説はしません。
- 現在Web Speech APIを使用した実装となっているため，Chromium系のブラウザーでのみ動作します。
- 無料で使用できますが，使用中の音声データはGoogleに送信され，音声認識の精度改善のために使用されるそうです。機密情報等は話さないようにお願いします。
- 本アプリを使用したことによる情報漏えい，その他の損害については本アプリ開発者は一切責任を取らないものとします。
- ご利用のブラウザー（APIキー）によっては月に60分までの利用制限があります。
- 試用ページは問題ありませんが，プロトコルがHTTPSでないと動作しません（HTTPでは動きません）。


## 概要

生配信時にリアルタイムでテロップを生成するクライアントアプリです。あくまで音声認識の結果を表示・記録するだけであり，実際の音声認識処理は外部のクラウドサービスに任せます。

グリーンバックで表示するのでXSplit BroadcasterやOBS Studioで透過させることが可能です。

今後 タイムスタンプ付きで記録する機能も追加する予定なので，生配信の後の編集時や，動画撮影時にもお使いください（まあ今後の話ですけどね）。


## 今後の予定

- Web Speech APIだけでなく，Azureへの対応（高精度化＆句読点挿入のため）
- サーバーサイドの機能も追加し，音声認識結果の後処理・記録機能の追加


## 試用

SKAのニコ生（SKA’s community　[co2335074](https://com.nicovideo.jp/community/co2335074)）で2019年8月より運用しています。しばらく配信していないのでご覧になることはできません。

使ってみたい場合[こちら](https://skasapp.github.io/speech-recognition-telop/web-speech/index.html)からお試しください。URLは数か月以内に変更する予定なので，ブックマークはリンク先ではなく，このページにするようお願いします。

speech-recognition-telop

# Speech Recognition Telop

Speech Recognition Telop for Japanese broadcasting

日本人の方は[こちらから日本語版](./README.md)をお読みください。


## Cautions

- Now using Web Speech API, only works on Chromium-based browsers.
- You can use for free, but audio data will be sent to Google to improve accuracy of speech recognition (humans hear the audio). DO NOT speak confidential information.
- This app developer takes no responsibility for damages caused by using this app.
- There are restrictions of time depending on a browser (API).
- You can use the source code of this app (display and record function) for commercial purpose within GPL-3.0, but please check your browser to use speech recognition commercially.
	- If you use Chromium + Speech API (private API), DO NOT use commercially. not allowed.
	- If you use Google Chrome, I DO NOT recommend using commercially.
- If you deploy on a HTTP site, this app doesn’t work. Please deploy on a HTTPS site.


## Overview

This is a client app generating a telop in real time for broadcasting. This app does only display and record results of speech recognition, and does not recognize speech. The speech recognition processing is left to outside cloud services.

The telop is displayed on a green background, you can be transparent by XSplit Broadcaster or OBS Studio.

You can record results of speech recognition with time stamp (experimental). You can use when editing videos after broadcasting, or when taking videos.


## Trial

This app used in SKA’s niconico Live（SKA’s community　[co2335074](https://com.nicovideo.jp/community/co2335074)）.

If you try, please click [here](https://skasapp.github.io/speech-recognition-telop/web-speech/index.html). But this link will be changed in a several months.


## Recording Format

Recording format is a JSON such as the next. But I changed the value to the explanation.

```JSON
[
	{
		"id": "Number: Serial number starting from 0",
		"time": {
			"hour": "Number: “Hour” of the recognized time",
			"minute": "Number: “Minute” of the recognized time",
			"second": "Number: “Second” of the recognized time"
		},
		"interval": {
			"hour": "Number: “Hour” counted from the time when the start button was clicked",
			"minute": "Number: “Minute” counted from the time when the start button was clicked",
			"second": "Number: “Second” counted from the time when the start button was clicked",
			"millisecond": "Number: “Millisecond” counted from the time when the start button was clicked"
		},
		"transcript": "String: The result of speech recognition",
		"confidence": "Number: confidence of the result of speech recognition"
	}
]

```


## Future Plans

- not only Web Speech API, supporting Azure (merit of accuracy, license, and punctuation).
- not only client side, adding server side
	- after processing of results of speech recognition
	- more convenient record function, for exaple, keyword extraction
	- generating SRT and WebVTT subtitles


## Change Log

YYYY/MM/DD（Year/Month/Date）

- 2020/02/09　Ver 1.1.0：adding the simply record function
- 2020/02/08　Ver 1.0.1：fix the bug of 1.0.0
- 2020/02/08　Ver 1.0.0：you can choose display confidence or not
- 2020/02/07　Ver 0.1.0：first version (but used from 2019/08/31)
- 2020/02/07　Ver 0.0.0：creating this repository

speech-recognition-telop

# Speech Recognition Telop

Speech Recognition Telop for Japanese broadcasting

日本人の方は[こちらから日本語版](./README.md)をお読みください。


## Overview

This is a client app generating a telop in real time for broadcasting. This app does only display and record results of speech recognition, and does not recognize speech. The speech recognition processing is left to outside cloud services.

The telop is displayed on a green background, you can be transparent by XSplit Broadcaster or OBS Studio.

You can record results of speech recognition with time stamp (experimental). You can use when editing videos after broadcasting, or when taking videos.


## Cautions

- Now using Web Speech API, only works on Chromium-based browsers.
- You can use for free, but audio data will be sent to Google to improve accuracy of speech recognition (humans hear the audio). DO NOT speak confidential information.
- This app developer takes no responsibility for damages caused by using this app.
- There are restrictions of time depending on a browser (API).
- You can use the source code of this app (display and record function) for commercial purpose within GPL-3.0, but please check your browser to use speech recognition commercially.
	- If you use Chromium + Speech API (limited access API), DO NOT use commercially. not allowed.
	- If you use Google Chrome, I DO NOT recommend using commercially.
- If you deploy on a HTTP site, this app doesn’t work. Please deploy on a HTTPS site.


## Trial

Trial here → [speech-recognition-telop/index.html](https://skasapp.github.io/speech-recognition-telop/index.html)  
※ This link will be changed in a several months.

This app used in SKA’s niconico Live（SKA’s community　[co2335074](https://com.nicovideo.jp/community/co2335074)）.


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
		"confidence": "Number: Confidence of the result of speech recognition"
	}
]

```


## Future Plans

1.x are going to be developed only minor fixes after 1.4, and I will develop 2.x.

- 1.x：Web client to display telop
	- Ver 1.4
		- make telop invisible after a certain period of time
		- you can select background color (β：this function support after 2.x)
		- Virtual YouTuber mode (β)
- 2.x：Adds advanced and useful server side features
	- after processing of results of speech recognition
		- inserting kuten (ending symbol like period)
		- correcting interjection, for example, “etto” (means “well …”) is recognized “8” or “a to”
	- more convenient record function, for exaple, keyword extraction
	- generating SRT and WebVTT subtitles
- 3.x：Desktop app easier to use
	- macOS ＆ Windows app
- Others
	- not only Web Speech API, supporting Azure (merit of accuracy, license, and punctuation).
	- real time translation

It is not upgrading from 1.x to 2.x to 3.x, they are developed independently as different functions. Please be careful with the version number.


## Links

SKA’s Links

- niconico community：[co2335074](https://com.nicovideo.jp/community/co2335074)
- YouTube channel：[https://youtube.com/c/0150159SK](https://youtube.com/c/0150159SK)
- blomaga：[ar1739328](https://ch.nicovideo.jp/skas-web/blomaga/ar1739328)
- Twitter：[@SK_Animation](https://twitter.com/SK_Animation)


## Change Log

YYYY/MM/DD（Year/Month/Date）

- 2020/06/03　Ver 1.4.0：make telop invisible after 15 seconds ＆ add translation（α）
- 2020/06/01　Ver 1.3.1：fixed a problem the height of viewport was not enough on Windows
- 2020/06/01　Ver 1.3.0：changed to display two lines ＆ changed display method when overflowing number of charactors ＆ fixed a problem of only displaying a few words
- 2020/05/31　Ver.1.2.0：JavaScript to TypeScript
- 2020/02/18　Ver 1.1.5：made the UI of start and end easier to understand
- 2020/02/16　Ver 1.1.4：changed UI ＆ changed restart process ＆ dealed with problem of Chrome ＆ changed restriction of number of characters
- 2020/02/10　Ver 1.1.3：keep results until reload
- 2020/02/09　Ver 1.1.2：changed restart condition and restored simply record function
- 2020/02/09　Ver 1.0.3：reviewed error handling
- 2020/02/09　Ver 1.0.2：because the behavior might be unstable, put the master branch back to Ver 1.0.1, and created dev1.1record branch
- 2020/02/09　Ver 1.1.1：very small fix
- 2020/02/09　Ver 1.1.0：adding the simply record function
- 2020/02/08　Ver 1.0.1：fix the bug of 1.0.0
- 2020/02/08　Ver 1.0.0：you can choose display confidence or not
- 2020/02/07　Ver 0.1.0：first version (but used from 2019/08/31)
- 2020/02/07　Ver 0.0.0：creating this repository

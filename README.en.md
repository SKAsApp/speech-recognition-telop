speech-recognition-telop

# Speech Recognition Telop Client App　by SKA

Speech Recognition Telop for Japanese broadcasting

日本人の方は[こちらから日本語版](./README.md)をお読みください。


## Cautions

- Now in test phase, I don’t explain in detail.
- Now using Web Speech API, only works on Chromium-based browsers.
- You can use for free, but audio data will be sent to Google to improve accuracy of speech recognition. DO NOT speak confidential information.
- This app developer takes no responsibility for damages caused by using this app.
- There is a restrictions of 60 minutes per month depending on a browser (API key).
- If you deploy on a HTTP site, this app doesn’t work. Please deploy on a HTTPS site.


## Overview

This is a client app generating a telop in real time for broadcasting. This app does only display and record results of speech recognition, and does not recognize speech. The speech recognition processing is left to outside cloud services.

The telop is displayed on a green background, you can be transparent by XSplit Broadcaster or OBS Studio.

I will add a function of recording results of speech recognition with time stamp. Then you can use when editing videos after broadcasting, or when taking videos.


## Future Plans

- not only Web Speech API, supporting Azure.
- adding functions of server side, for exaple, after processing of results of speech recognition or recording.


## Trial

This app used in SKA’s niconico Live（SKA’s community　[co2335074](https://com.nicovideo.jp/community/co2335074)）.

If you try, please click [here](https://skasapp.github.io/speech-recognition-telop/web-speech/index.html). But this link will be changed in a several months.

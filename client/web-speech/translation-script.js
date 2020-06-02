/*!
 * Copyright 2020 SKA
 */
// ※ 音声認識翻訳（α）用。αのため，recognition-script.tsとほぼ同じコードですが，ファイルを分けています。（β）の頃にはいい感じにソース管理されてると思います。
// 初期処理
let agent = window.navigator.userAgent;
let subtitle;
let languageSelector;
let buttonStart;
let buttonStop;
let buttonSave;
let language = "ja-JP";
let translateLanguage = "en-US";
let speaking = false;
let buttonStopPushed = false;
let recognition;
let confidenceMode = false;
let startTime;
let rid = -1;
let previousLog = [];
let transcript = "";
let confidence = 0.0;
let resultCounter = 0;
let translateApiUrl = "";
let previousTranslatingString = "";
let previousTranslatedString = "";
const { webkitSpeechRecognition, webkitSpeechRecognitionEvent, webkitSpeechRecognitionResultList } = window;
window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
window.SpeechRecognitionResultList = window.SpeechRecognitionResultList || webkitSpeechRecognitionResultList;
if (!("SpeechRecognition" in window)) {
    window.alert("ご利用のブラウザーは音声認識に対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
else if (!((agent.indexOf("Chrome") != -1) && (agent.indexOf("Edge") == -1) && (agent.indexOf("OPR") == -1) && (agent.indexOf("Edg") == -1))) {
    window.alert("ご利用のブラウザーは音声認識に部分的にしか対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
window.onunload = () => { };
// HTMLが読み込まれたら，音声認識インスタンスを生成し，出力先の要素を取得する
document.addEventListener("DOMContentLoaded", () => {
    initialize();
    setEventHandler();
    subtitle = document.getElementById("subtitle");
    buttonStart = document.getElementById("button-start");
    buttonStop = document.getElementById("button-stop");
    buttonSave = document.getElementById("button-save");
    buttonStop.disabled = true;
    buttonStart.addEventListener("click", (event) => {
        recognitionStartClick();
    }, false);
    buttonStop.addEventListener("click", (event) => {
        recognitionStopClick();
    }, false);
    buttonSave.addEventListener("click", (event) => {
        getJson();
    }, false);
    languageSelector = document.getElementById("language");
    languageSelector.addEventListener("change", (event) => {
        changeLanguage();
    }, false);
    setTranslateApiUrl();
}, false);
const setTranslateApiUrl = () => {
    const tempUrl = prompt("翻訳URLを入力してください。");
    if (tempUrl == null || !tempUrl.startsWith("https://script.google.com/macros/") || !tempUrl.endsWith("/exec")) {
        alert("入力が間違っています。\r\nもう1度入力するにはページを再読み込みしてください。");
        buttonStart.disabled = true;
        return;
    }
    translateApiUrl = tempUrl;
};
const speechRecognition = () => {
    initialize();
    setEventHandler();
    speaking = false;
    recognition.start();
};
// 初期化処理
const initialize = () => {
    console.log("インスタンス生成しました。");
    recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
};
const setEventHandler = () => {
    // エラーだったら
    recognition.onerror = (event) => {
        console.log("エラーが発生しました。" + String(event.error) + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(buttonStopPushed));
    };
    // 接続が切れたら
    recognition.onend = (event) => {
        console.log("接続が切れました。" + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(buttonStopPushed));
        if (!speaking && !buttonStopPushed) {
            restart();
            return;
        }
        if (speaking && !buttonStopPushed) {
            simplyRecord(transcript, confidence);
            restart();
            return;
        }
        recognitionStop();
    };
    // 音が途切れたら
    // recognition.onsoundend = (event: SpeechRecognitionErrorEvent) => 
    // {
    // 	
    // };
    // 認識できなかったら
    recognition.onnomatch = (event) => {
        console.log("認識できませんでした。");
    };
    // 認識したら
    recognition.onresult = async (event) => {
        // 結果取得
        transcript = event.results[event.results.length - 1][0].transcript;
        if (0 < event.results.length - 1 && !event.results[event.results.length - 2].isFinal) {
            transcript = event.results[event.results.length - 2][0].transcript + event.results[event.results.length - 1][0].transcript;
        }
        let response = transcript;
        confidence = event.results[event.results.length - 1][0].confidence;
        // 翻訳→描画
        const translateFlag = manageResultCounter(event.results[event.results.length - 1].isFinal);
        if (translateFlag) {
            response = await translate(response);
            render(response, false);
        }
        // 認識確定してたら
        if (event.results[event.results.length - 1].isFinal) {
            console.log((event.results.length - 1).toString() + "：確定。");
            speaking = false;
            simplyRecord(transcript, confidence);
            setTimeout(hideSubtitle, 15000, transcript);
            return;
        }
        speaking = true;
    };
};
const manageResultCounter = (isFinal) => {
    resultCounter += 1;
    if (isFinal || resultCounter == 8) {
        resultCounter = 0;
    }
    return resultCounter == 0;
};
const translate = async (beforeString) => {
    if (beforeString == previousTranslatingString) {
        return previousTranslatedString;
    }
    previousTranslatingString = beforeString;
    let translatedString = "";
    try {
        await fetch(translateApiUrl + "?text=" + encodeURIStrictly(beforeString) + "&source=" + encodeURIStrictly(language) + "&target=" + encodeURIStrictly(translateLanguage))
            .then((response) => {
            return response.text();
        })
            .then((text) => {
            translatedString = text;
        });
    }
    catch (error) {
        console.log("翻訳リクエストに失敗しました。詳細：" + error.toString());
    }
    previousTranslatedString = translatedString;
    return translatedString;
};
// 描画
const render = (string, isSystemMessage) => {
    if (isSystemMessage) {
        renderSubtitle('<span class="system">' + string + '</span>');
        return;
    }
    renderSubtitle(string);
};
const renderSubtitle = (string) => {
    subtitle.textContent = "";
    subtitle.insertAdjacentHTML("afterbegin", string);
};
const hideSubtitle = (previousTranscript) => {
    if (previousTranscript == transcript) {
        render("", false);
        console.log("非表示。");
    }
};
// 簡易保存機能（のちほどサーバーサイドに移行し，高度な機能もつける予定）
const simplyRecord = (rtranscript, rconfidence) => {
    if (startTime == null) {
        return;
    }
    rid += 1;
    console.log(rid.toString() + "：記録。");
    const now = new Date();
    const timeDiff = new Date(now.getTime() - startTime.getTime());
    const log = {
        id: rid,
        time: {
            hour: now.getHours(),
            minute: now.getMinutes(),
            second: now.getSeconds()
        },
        interval: {
            hour: timeDiff.getUTCHours(),
            minute: timeDiff.getUTCMinutes(),
            second: timeDiff.getUTCSeconds(),
            millisecond: timeDiff.getUTCMilliseconds()
        },
        transcript: rtranscript,
        confidence: rconfidence
    };
    previousLog.push(log);
};
// 言語選択変わったら
const changeLanguage = () => {
    language = languageSelector.value;
    if (language == "ja-JP") {
        translateLanguage = "en-US";
    }
    if (language == "en-US") {
        translateLanguage = "ja-JP";
    }
    if (recognition != null) {
        recognition.lang = language;
    }
};
// 開始ボタン押したら
const recognitionStartClick = () => {
    if (startTime == null) {
        previousLog = [];
        startTime = new Date();
    }
    buttonStopPushed = false;
    buttonStart.disabled = true;
    buttonStop.disabled = false;
    recognitionStart();
};
// 終了ボタン押したら
const recognitionStopClick = () => {
    buttonStopPushed = true;
    buttonStop.disabled = true;
    buttonStart.disabled = false;
    recognitionStop();
};
// 保存ボタン押したら
const getJson = () => {
    if (startTime == null) {
        return;
    }
    const tempJson = JSON.stringify(previousLog, null, "\t");
    const logJson = tempJson.replace(/\n/g, "\r\n") + "\r\n";
    const blob = new Blob([logJson], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "音声認識テロップ " + String(startTime.getFullYear()) + "-" + ("00" + String(Number(startTime.getMonth() + 1))).slice(-2) + "-" + ("00" + String(startTime.getDate())).slice(-2) + ".json";
    link.click();
};
// 信頼度表示変更
const setConfidenceMode = (mode) => {
    confidenceMode = mode;
};
// 開始・終了関係
const recognitionStart = () => {
    speaking = false;
    recognition.start();
};
const recognitionStop = () => {
    recognition.stop();
};
const restart = () => {
    console.log("再起動。");
    recognitionStop();
    recognitionStart();
};
const encodeURIStrictly = (beforeUri) => {
    return encodeURIComponent(beforeUri).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

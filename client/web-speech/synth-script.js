/*!
 * Copyright 2020 SKA
 */
// ※ 音声認識合成（α）用。αのため，recognition-script.tsとほぼ同じコードですが，ファイルを分けています。（β）の頃にはいい感じにソース管理されてると思います。
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
const synthApiUrl = "http://127.0.0.1:50080/talk";
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
}, false);
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
        console.log("end：ブラウザーが音声捕捉終了\r\n接続が切れました。" + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(buttonStopPushed));
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
    // 認識できなかったら
    recognition.onnomatch = (event) => {
        console.log("認識できませんでした。");
    };
    // その他のイベントハンドラー
    recognition.onaudiostart = (event) => {
        console.log("audio start：ブラウザーが音声捕捉");
    };
    recognition.onsoundstart = (event) => {
        console.log("sound start：なにか音が鳴った");
    };
    recognition.onsoundend = (event) => {
        console.log("sound end：音が止まった");
    };
    recognition.onspeechstart = (event) => {
        console.log("speech start：サービスが認識開始");
    };
    recognition.onspeechend = (event) => {
        console.log("speech end：サービスが認識終了");
    };
    recognition.onstart = (event) => {
        console.log("start：サービスが言語認識開始");
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
        // 描画→合成
        render(response, false, 1);
        const synthFlag = manageResultCounter(event.results[event.results.length - 1].isFinal);
        if (synthFlag) {
            await synth(response);
        }
        // 認識確定してたら
        if (event.results[event.results.length - 1].isFinal) {
            console.log((event.results.length - 1).toString() + "：確定。");
            speaking = false;
            simplyRecord(transcript, confidence);
            setTimeout(hideSubtitle, 10000, transcript);
            return;
        }
        speaking = true;
    };
};
const manageResultCounter = (isFinal) => {
    resultCounter += 1;
    // 1/nのn
    if (!isFinal && resultCounter == 2) {
        resultCounter = 0;
    }
    return resultCounter == 0;
};
const synth = async (tempString) => {
    if (tempString == previousTranslatingString) {
        return;
    }
    const previousLength = previousTranslatingString.length;
    const tempLength = tempString.length;
    if (previousLength == tempLength) {
        return;
    }
    const beforeString = tempString.slice(previousLength, tempLength).replace(" ", "%20");
    previousTranslatingString = tempString;
    let translatedString = "";
    try {
        await fetch(synthApiUrl + "?text=" + beforeString);
    }
    catch (error) {
        console.log("音声合成に失敗しました。詳細：" + error.toString());
    }
    previousTranslatedString = translatedString;
    return;
};
// 描画
// renderer＝0：両方描画，renderer＝1：元言語描画
const render = (string, isSystemMessage, renderer) => {
    if (isSystemMessage) {
        renderSubtitle('<span class="system">' + string + '</span>');
        return;
    }
    if (renderer == 1) {
        renderSubtitle(string);
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
        render("", false, 0);
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
    link.download = String(startTime.getFullYear()) + "-" + ("00" + String(Number(startTime.getMonth() + 1))).slice(-2) + "-" + ("00" + String(startTime.getDate())).slice(-2) + " 音声認識テロップ" + ".json";
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

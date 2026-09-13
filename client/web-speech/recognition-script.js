/*!
 * Copyright 2020 SKA
 */
// 初期処理
let agent = window.navigator.userAgent;
let subtitle;
let languageSelector;
let buttonStart;
let buttonStop;
let buttonSave;
let language = "ja-JP";
let speaking = false;
let buttonStopPushed = false;
let recognition;
let confidenceMode = false;
let startTime;
let rid = -1;
let previousLog = [];
let transcript = "";
let confidence = 0.0;
const hidariCameraApiUrl = "http://localhost:15082/api/v1/speech-recognition";
let sessionId = "";
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
    recognition.onresult = (event) => {
        // 結果取得
        transcript = event.results[event.results.length - 1][0].transcript;
        if (0 < event.results.length - 1 && !isFinal(event.results[event.results.length - 2])) {
            transcript = event.results[event.results.length - 2][0].transcript + event.results[event.results.length - 1][0].transcript;
        }
        let response = transcript;
        confidence = event.results[event.results.length - 1][0].confidence;
        if (confidenceMode) {
            const confidenceString = confidence.toString().slice(0, 5);
            response = transcript + '<span class="confidence"> （' + confidenceString + '）</span>';
        }
        // 描画
        render(response, false);
        // 認識確定してたら
        if (isFinal(event.results[event.results.length - 1])) {
            console.log((event.results.length - 1).toString() + "：確定。");
            speaking = false;
            transferHidariCameraOn(transcript, sessionId);
            simplyRecord(transcript, confidence);
            setTimeout(hideSubtitle, 10000, transcript, true);
            return;
        }
        setTimeout(hideSubtitle, 10000, transcript, false);
        speaking = true;
    };
};
const isFinal = (recognitionResult) => {
    return recognitionResult.isFinal && 0.40 <= recognitionResult[0].confidence;
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
const hideSubtitle = (previousTranscript, isFinal) => {
    if (isFinal && previousTranscript == transcript) {
        render("", false);
        console.log("非表示。");
        return;
    }
    if (!isFinal && previousTranscript == transcript) {
        restart();
        return;
    }
};
// 左カメラONへの転送
const transferHidariCameraOn = async (transcript, sessionId) => {
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const jstTime = jstNow.toISOString().slice(0, 19) + "+09:00";
    try {
        await fetch(hidariCameraApiUrl, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                "requestId": generateUuid(),
                "source": "speech-recognition-telop",
                "eventType": "speech-recognition",
                "text": transcript,
                "receivedAt": jstTime,
                "sessionId": sessionId
            })
        });
    }
    catch (error) {
    }
};
const generateUuid = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
        throw new Error("このブラウザーでは安全なUUIDを生成できません。");
    }
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    // UUIDv4を表すビットに設定する
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
    // UUIDのバリアントを表すビットに設定する
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
    const hexadecimalBytes = Array.from(randomBytes, (byteValue) => byteValue.toString(16).padStart(2, "0"));
    return;
    [
        hexadecimalBytes.slice(0, 4).join(""),
        hexadecimalBytes.slice(4, 6).join(""),
        hexadecimalBytes.slice(6, 8).join(""),
        hexadecimalBytes.slice(8, 10).join(""),
        hexadecimalBytes.slice(10, 16).join("")
    ].join("-");
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
    sessionId = crypto.randomUUID();
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

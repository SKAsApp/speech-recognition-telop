/*! Copilot作成
 * Copyright 2020 SKA
 * Safariで音声認識中にほかの音声が小さくなる現象を抑えるため、
 * Audio Session APIのambientを利用するように改修。
 */
var _a;
const windowWithWebKitSpeechRecognition = window;
const SpeechRecognitionConstructor = (_a = window.SpeechRecognition) !== null && _a !== void 0 ? _a : windowWithWebKitSpeechRecognition.webkitSpeechRecognition;
const navigatorWithAudioSession = navigator;
let subtitle;
let languageSelector;
let buttonStart;
let buttonStop;
let buttonSave;
let language = "ja-JP";
let speaking = false;
let buttonStopPushed = false;
let recognition = null;
let confidenceMode = false;
let startTime = null;
let recordId = -1;
let previousLog = [];
let transcript = "";
let confidence = 0.0;
let restartRequested = false;
if (SpeechRecognitionConstructor == null) {
    window.alert("ご利用のブラウザーは音声認識に対応していません。\\r\\n" +
        "対応ブラウザーをご利用ください。");
}
window.addEventListener("unload", () => {
    restoreAudioSession();
});
document.addEventListener("DOMContentLoaded", () => {
    subtitle = getRequiredElement("subtitle");
    buttonStart = getRequiredElement("button-start");
    buttonStop = getRequiredElement("button-stop");
    buttonSave = getRequiredElement("button-save");
    languageSelector = getRequiredElement("language");
    buttonStop.disabled = true;
    if (SpeechRecognitionConstructor == null) {
        buttonStart.disabled = true;
        return;
    }
    initializeRecognition();
    buttonStart.addEventListener("click", () => {
        recognitionStartClick();
    });
    buttonStop.addEventListener("click", () => {
        recognitionStopClick();
    });
    buttonSave.addEventListener("click", () => {
        downloadRecognitionLog();
    });
    languageSelector.addEventListener("change", () => {
        changeLanguage();
    });
});
function getRequiredElement(elementId) {
    const element = document.getElementById(elementId);
    if (element == null) {
        throw new Error(`HTML要素が見つかりません。ID: ${elementId}`);
    }
    return element;
}
function initializeRecognition() {
    if (SpeechRecognitionConstructor == null) {
        return;
    }
    console.log("音声認識インスタンスを生成しました。");
    recognition = new SpeechRecognitionConstructor();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    setRecognitionEventHandlers(recognition);
}
function setRecognitionEventHandlers(targetRecognition) {
    targetRecognition.onerror = (event) => {
        const errorEvent = event;
        console.error("音声認識でエラーが発生しました。" +
            ` error=${errorEvent.error}` +
            ` message=${errorEvent.message}` +
            ` speaking=${speaking}` +
            ` stopButtonPushed=${buttonStopPushed}`);
    };
    targetRecognition.onend = () => {
        console.log("ブラウザーが音声捕捉を終了しました。" +
            ` speaking=${speaking}` +
            ` stopButtonPushed=${buttonStopPushed}`);
        if (buttonStopPushed) {
            completeRecognitionStop();
            return;
        }
        if (speaking) {
            simplyRecord(transcript, confidence);
        }
        restartRequested = false;
        startRecognition();
    };
    targetRecognition.onnomatch = () => {
        console.log("音声を認識できませんでした。");
    };
    targetRecognition.onaudiostart = () => {
        console.log("ブラウザーが音声捕捉を開始しました。");
    };
    targetRecognition.onsoundstart = () => {
        console.log("音声入力を検出しました。");
    };
    targetRecognition.onsoundend = () => {
        console.log("音声入力が終了しました。");
    };
    targetRecognition.onspeechstart = () => {
        console.log("発話の認識を開始しました。");
    };
    targetRecognition.onspeechend = () => {
        console.log("発話の認識を終了しました。");
    };
    targetRecognition.onstart = () => {
        console.log("音声認識サービスを開始しました。");
    };
    targetRecognition.onresult = (event) => {
        handleRecognitionResult(event);
    };
}
function handleRecognitionResult(event) {
    const latestResultIndex = event.results.length - 1;
    const latestResult = event.results[latestResultIndex];
    const latestAlternative = latestResult[0];
    transcript = latestAlternative.transcript;
    confidence = latestAlternative.confidence;
    if (latestResultIndex > 0 &&
        !isFinal(event.results[latestResultIndex - 1])) {
        transcript =
            event.results[latestResultIndex - 1][0].transcript + transcript;
    }
    let response = transcript;
    if (confidenceMode) {
        const confidenceString = confidence.toString().slice(0, 5);
        response = `${transcript} （${confidenceString}）`;
    }
    render(response, false);
    if (isFinal(latestResult)) {
        console.log(`${latestResultIndex}：認識結果が確定しました。`);
        speaking = false;
        simplyRecord(transcript, confidence);
        window.setTimeout(hideSubtitle, 10000, transcript, true);
        return;
    }
    window.setTimeout(hideSubtitle, 10000, transcript, false);
    speaking = true;
}
function isFinal(recognitionResult) {
    return recognitionResult.isFinal && recognitionResult[0].confidence >= 0.40;
}
function render(message, isSystemMessage) {
    if (isSystemMessage) {
        renderSubtitle(message);
        return;
    }
    renderSubtitle(message);
}
function renderSubtitle(message) {
    // 認識結果をHTMLとして解釈せず、安全なテキストとして表示する
    subtitle.textContent = message;
}
function hideSubtitle(previousTranscript, isFinalResult) {
    if (previousTranscript !== transcript) {
        return;
    }
    if (isFinalResult) {
        render("", false);
        console.log("テロップを非表示にしました。");
        return;
    }
    requestRecognitionRestart();
}
function simplyRecord(recognizedTranscript, recognizedConfidence) {
    if (startTime == null || recognizedTranscript.length === 0) {
        return;
    }
    recordId += 1;
    console.log(`${recordId}：認識結果を記録しました。`);
    const currentTime = new Date();
    const elapsedTime = new Date(currentTime.getTime() - startTime.getTime());
    const recognitionLog = {
        id: recordId,
        time: {
            hour: currentTime.getHours(),
            minute: currentTime.getMinutes(),
            second: currentTime.getSeconds()
        },
        interval: {
            hour: elapsedTime.getUTCHours(),
            minute: elapsedTime.getUTCMinutes(),
            second: elapsedTime.getUTCSeconds(),
            millisecond: elapsedTime.getUTCMilliseconds()
        },
        transcript: recognizedTranscript,
        confidence: recognizedConfidence
    };
    previousLog.push(recognitionLog);
}
function changeLanguage() {
    language = languageSelector.value;
    if (recognition != null) {
        recognition.lang = language;
    }
}
function recognitionStartClick() {
    if (startTime == null) {
        previousLog = [];
        startTime = new Date();
        recordId = -1;
    }
    buttonStopPushed = false;
    restartRequested = false;
    buttonStart.disabled = true;
    buttonStop.disabled = false;
    configureAmbientAudioSession();
    startRecognition();
}
function recognitionStopClick() {
    buttonStopPushed = true;
    restartRequested = false;
    buttonStop.disabled = true;
    buttonStart.disabled = false;
    stopRecognition();
}
function configureAmbientAudioSession() {
    const audioSession = navigatorWithAudioSession.audioSession;
    if (audioSession == null) {
        console.warn("Audio Session APIに対応していないため、" +
            "音声出力の自動減衰を抑制できない可能性があります。");
        return;
    }
    try {
        audioSession.type = "ambient";
        console.log("音声セッションをambientに設定しました。");
    }
    catch (error) {
        console.warn("音声セッションをambientに設定できませんでした。", error);
    }
}
function restoreAudioSession() {
    const audioSession = navigatorWithAudioSession.audioSession;
    if (audioSession == null) {
        return;
    }
    try {
        audioSession.type = "auto";
        console.log("音声セッションをautoに戻しました。");
    }
    catch (error) {
        console.warn("音声セッションをautoに戻せませんでした。", error);
    }
}
function startRecognition() {
    if (recognition == null || buttonStopPushed) {
        return;
    }
    // 再起動時にもSafariが音声セッションを変更する可能性があるため再設定する
    configureAmbientAudioSession();
    try {
        recognition.start();
    }
    catch (error) {
        console.error("音声認識を開始できませんでした。", error);
    }
}
function stopRecognition() {
    if (recognition == null) {
        completeRecognitionStop();
        return;
    }
    try {
        recognition.stop();
    }
    catch (error) {
        console.warn("音声認識の停止処理でエラーが発生しました。", error);
        completeRecognitionStop();
    }
}
function completeRecognitionStop() {
    speaking = false;
    restartRequested = false;
    restoreAudioSession();
}
function requestRecognitionRestart() {
    if (recognition == null || buttonStopPushed || restartRequested) {
        return;
    }
    restartRequested = true;
    console.log("音声認識の再起動を要求しました。");
    try {
        // 再開はonendで行い、stop直後のstartによる競合を避ける
        recognition.stop();
    }
    catch (error) {
        restartRequested = false;
        console.error("音声認識を再起動できませんでした。", error);
    }
}
function downloadRecognitionLog() {
    if (startTime == null) {
        return;
    }
    const temporaryJson = JSON.stringify(previousLog, null, "\\t");
    const logJson = temporaryJson.replace(/\\n/g, "\\r\\n") + "\\r\\n";
    const blob = new Blob([logJson], { type: "application/json" });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download =
        `${startTime.getFullYear()}-` +
            `${String(startTime.getMonth() + 1).padStart(2, "0")}-` +
            `${String(startTime.getDate()).padStart(2, "0")} 音声認識テロップ.json`;
    link.click();
    window.URL.revokeObjectURL(objectUrl);
}
// 外部の設定画面などから信頼度表示を切り替えるために公開する
function setConfidenceMode(mode) {
    confidenceMode = mode;
}

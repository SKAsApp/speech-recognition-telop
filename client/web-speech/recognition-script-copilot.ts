/*! Copilot作成
 * Copyright 2020 SKA
 * Safariで音声認識中にほかの音声が小さくなる現象を抑えるため、
 * Audio Session APIのambientを利用するように改修。
 */

// WebKit系ブラウザーのベンダープレフィックス付きAPIを補完する型
interface WindowWithWebKitSpeechRecognition extends Window
{
	webkitSpeechRecognition?: typeof SpeechRecognition;
	webkitSpeechRecognitionEvent?: typeof SpeechRecognitionEvent;
}

// Audio Session APIは実験的APIであるため、必要な型をローカル定義する
type AudioSessionType =
	| "auto"
	| "playback"
	| "transient"
	| "transient-solo"
	| "ambient"
	| "play-and-record";

interface AudioSession
{
	type: AudioSessionType;
}

interface NavigatorWithAudioSession extends Navigator
{
	readonly audioSession?: AudioSession;
}

interface SpeechRecognitionErrorEventWithMessage extends Event
{
	readonly error: string;
	readonly message: string;
}

interface RecognitionLog
{
	id: number;
	time:
	{
		hour: number;
		minute: number;
		second: number;
	};
	interval:
	{
		hour: number;
		minute: number;
		second: number;
		millisecond: number;
	};
	transcript: string;
	confidence: number;
}

const windowWithWebKitSpeechRecognition: WindowWithWebKitSpeechRecognition =
	window as WindowWithWebKitSpeechRecognition;

const SpeechRecognitionConstructor: typeof SpeechRecognition | undefined =
	window.SpeechRecognition ??
	windowWithWebKitSpeechRecognition.webkitSpeechRecognition;

const navigatorWithAudioSession: NavigatorWithAudioSession =
	navigator as NavigatorWithAudioSession;

let subtitle: HTMLParagraphElement;
let languageSelector: HTMLInputElement;
let buttonStart: HTMLButtonElement;
let buttonStop: HTMLButtonElement;
let buttonSave: HTMLButtonElement;
let language: string = "ja-JP";
let speaking: boolean = false;
let buttonStopPushed: boolean = false;
let recognition: SpeechRecognition | null = null;
let confidenceMode: boolean = false;
let startTime: Date | null = null;
let recordId: number = -1;
let previousLog: RecognitionLog[] = [];
let transcript: string = "";
let confidence: number = 0.0;
let restartRequested: boolean = false;

if (SpeechRecognitionConstructor == null)
{
	window.alert(
		"ご利用のブラウザーは音声認識に対応していません。\\r\\n" +
		"対応ブラウザーをご利用ください。");
}

window.addEventListener(
	"unload",
	(): void =>
	{
		restoreAudioSession();
	});

document.addEventListener(
	"DOMContentLoaded",
	(): void =>
	{
		subtitle = getRequiredElement<HTMLParagraphElement>("subtitle");
		buttonStart = getRequiredElement<HTMLButtonElement>("button-start");
		buttonStop = getRequiredElement<HTMLButtonElement>("button-stop");
		buttonSave = getRequiredElement<HTMLButtonElement>("button-save");
		languageSelector = getRequiredElement<HTMLInputElement>("language");

		buttonStop.disabled = true;

		if (SpeechRecognitionConstructor == null)
		{
			buttonStart.disabled = true;
			return;
		}

		initializeRecognition();

		buttonStart.addEventListener(
			"click",
			(): void =>
			{
				recognitionStartClick();
			});

		buttonStop.addEventListener(
			"click",
			(): void =>
			{
				recognitionStopClick();
			});

		buttonSave.addEventListener(
			"click",
			(): void =>
			{
				downloadRecognitionLog();
			});

		languageSelector.addEventListener(
			"change",
			(): void =>
			{
				changeLanguage();
			});
	});

function getRequiredElement<TElement extends HTMLElement>(elementId: string): TElement
{
	const element: HTMLElement | null = document.getElementById(elementId);

	if (element == null)
	{
		throw new Error(`HTML要素が見つかりません。ID: ${elementId}`);
	}

	return element as TElement;
}

function initializeRecognition(): void
{
	if (SpeechRecognitionConstructor == null)
	{
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

function setRecognitionEventHandlers(targetRecognition: SpeechRecognition): void
{
	targetRecognition.onerror = (event: SpeechRecognitionErrorEvent): void =>
	{
		const errorEvent: SpeechRecognitionErrorEventWithMessage =
			event as unknown as SpeechRecognitionErrorEventWithMessage;

		console.error(
			"音声認識でエラーが発生しました。" +
			` error=${errorEvent.error}` +
			` message=${errorEvent.message}` +
			` speaking=${speaking}` +
			` stopButtonPushed=${buttonStopPushed}`);
	};

	targetRecognition.onend = (): void =>
	{
		console.log(
			"ブラウザーが音声捕捉を終了しました。" +
			` speaking=${speaking}` +
			` stopButtonPushed=${buttonStopPushed}`);

		if (buttonStopPushed)
		{
			completeRecognitionStop();
			return;
		}

		if (speaking)
		{
			simplyRecord(transcript, confidence);
		}

		restartRequested = false;
		startRecognition();
	};

	targetRecognition.onnomatch = (): void =>
	{
		console.log("音声を認識できませんでした。");
	};

	targetRecognition.onaudiostart = (): void =>
	{
		console.log("ブラウザーが音声捕捉を開始しました。");
	};

	targetRecognition.onsoundstart = (): void =>
	{
		console.log("音声入力を検出しました。");
	};

	targetRecognition.onsoundend = (): void =>
	{
		console.log("音声入力が終了しました。");
	};

	targetRecognition.onspeechstart = (): void =>
	{
		console.log("発話の認識を開始しました。");
	};

	targetRecognition.onspeechend = (): void =>
	{
		console.log("発話の認識を終了しました。");
	};

	targetRecognition.onstart = (): void =>
	{
		console.log("音声認識サービスを開始しました。");
	};

	targetRecognition.onresult = (event: SpeechRecognitionEvent): void =>
	{
		handleRecognitionResult(event);
	};
}

function handleRecognitionResult(event: SpeechRecognitionEvent): void
{
	const latestResultIndex: number = event.results.length - 1;
	const latestResult: SpeechRecognitionResult = event.results[latestResultIndex];
	const latestAlternative: SpeechRecognitionAlternative = latestResult[0];

	transcript = latestAlternative.transcript;
	confidence = latestAlternative.confidence;

	if (
		latestResultIndex > 0 &&
		!isFinal(event.results[latestResultIndex - 1]))
	{
		transcript =
			event.results[latestResultIndex - 1][0].transcript + transcript;
	}

	let response: string = transcript;

	if (confidenceMode)
	{
		const confidenceString: string = confidence.toString().slice(0, 5);
		response = `${transcript} （${confidenceString}）`;
	}

	render(response, false);

	if (isFinal(latestResult))
	{
		console.log(`${latestResultIndex}：認識結果が確定しました。`);
		speaking = false;
		simplyRecord(transcript, confidence);
		window.setTimeout(hideSubtitle, 10000, transcript, true);
		return;
	}

	window.setTimeout(hideSubtitle, 10000, transcript, false);
	speaking = true;
}

function isFinal(recognitionResult: SpeechRecognitionResult): boolean
{
	return recognitionResult.isFinal && recognitionResult[0].confidence >= 0.40;
}

function render(message: string, isSystemMessage: boolean): void
{
	if (isSystemMessage)
	{
		renderSubtitle(message);
		return;
	}

	renderSubtitle(message);
}

function renderSubtitle(message: string): void
{
	// 認識結果をHTMLとして解釈せず、安全なテキストとして表示する
	subtitle.textContent = message;
}

function hideSubtitle(previousTranscript: string, isFinalResult: boolean): void
{
	if (previousTranscript !== transcript)
	{
		return;
	}

	if (isFinalResult)
	{
		render("", false);
		console.log("テロップを非表示にしました。");
		return;
	}

	requestRecognitionRestart();
}

function simplyRecord(recognizedTranscript: string, recognizedConfidence: number): void
{
	if (startTime == null || recognizedTranscript.length === 0)
	{
		return;
	}

	recordId += 1;
	console.log(`${recordId}：認識結果を記録しました。`);

	const currentTime: Date = new Date();
	const elapsedTime: Date =
		new Date(currentTime.getTime() - startTime.getTime());

	const recognitionLog: RecognitionLog =
	{
		id: recordId,
		time:
		{
			hour: currentTime.getHours(),
			minute: currentTime.getMinutes(),
			second: currentTime.getSeconds()
		},
		interval:
		{
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

function changeLanguage(): void
{
	language = languageSelector.value;

	if (recognition != null)
	{
		recognition.lang = language;
	}
}

function recognitionStartClick(): void
{
	if (startTime == null)
	{
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

function recognitionStopClick(): void
{
	buttonStopPushed = true;
	restartRequested = false;
	buttonStop.disabled = true;
	buttonStart.disabled = false;

	stopRecognition();
}

function configureAmbientAudioSession(): void
{
	const audioSession: AudioSession | undefined =
		navigatorWithAudioSession.audioSession;

	if (audioSession == null)
	{
		console.warn(
			"Audio Session APIに対応していないため、" +
			"音声出力の自動減衰を抑制できない可能性があります。");
		return;
	}

	try
	{
		audioSession.type = "ambient";
		console.log("音声セッションをambientに設定しました。");
	}
	catch (error: unknown)
	{
		console.warn("音声セッションをambientに設定できませんでした。", error);
	}
}

function restoreAudioSession(): void
{
	const audioSession: AudioSession | undefined =
		navigatorWithAudioSession.audioSession;

	if (audioSession == null)
	{
		return;
	}

	try
	{
		audioSession.type = "auto";
		console.log("音声セッションをautoに戻しました。");
	}
	catch (error: unknown)
	{
		console.warn("音声セッションをautoに戻せませんでした。", error);
	}
}

function startRecognition(): void
{
	if (recognition == null || buttonStopPushed)
	{
		return;
	}

	// 再起動時にもSafariが音声セッションを変更する可能性があるため再設定する
	configureAmbientAudioSession();

	try
	{
		recognition.start();
	}
	catch (error: unknown)
	{
		console.error("音声認識を開始できませんでした。", error);
	}
}

function stopRecognition(): void
{
	if (recognition == null)
	{
		completeRecognitionStop();
		return;
	}

	try
	{
		recognition.stop();
	}
	catch (error: unknown)
	{
		console.warn("音声認識の停止処理でエラーが発生しました。", error);
		completeRecognitionStop();
	}
}

function completeRecognitionStop(): void
{
	speaking = false;
	restartRequested = false;
	restoreAudioSession();
}

function requestRecognitionRestart(): void
{
	if (recognition == null || buttonStopPushed || restartRequested)
	{
		return;
	}

	restartRequested = true;
	console.log("音声認識の再起動を要求しました。");

	try
	{
		// 再開はonendで行い、stop直後のstartによる競合を避ける
		recognition.stop();
	}
	catch (error: unknown)
	{
		restartRequested = false;
		console.error("音声認識を再起動できませんでした。", error);
	}
}

function downloadRecognitionLog(): void
{
	if (startTime == null)
	{
		return;
	}

	const temporaryJson: string = JSON.stringify(previousLog, null, "\\t");
	const logJson: string = temporaryJson.replace(/\\n/g, "\\r\\n") + "\\r\\n";
	const blob: Blob = new Blob([logJson], { type: "application/json" });
	const objectUrl: string = window.URL.createObjectURL(blob);
	const link: HTMLAnchorElement = document.createElement("a");

	link.href = objectUrl;
	link.download =
		`${startTime.getFullYear()}-` +
		`${String(startTime.getMonth() + 1).padStart(2, "0")}-` +
		`${String(startTime.getDate()).padStart(2, "0")} 音声認識テロップ.json`;
	link.click();

	window.URL.revokeObjectURL(objectUrl);
}

// 外部の設定画面などから信頼度表示を切り替えるために公開する
export function setConfidenceMode(mode: boolean): void
{
	confidenceMode = mode;
}

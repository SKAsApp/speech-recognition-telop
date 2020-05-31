/*!
 * Copyright 2020 SKA
 */

// 初期処理
let agent: string = window.navigator.userAgent;
let subtitle: HTMLElement;
let languageSelector: HTMLInputElement;
let buttonStart: HTMLButtonElement;
let buttonStop: HTMLButtonElement;
let buttonSave: HTMLButtonElement;
let language: string = "ja-JP";
let speaking: boolean = false;
let buttonStopPushed: boolean = false;
let recognition: SpeechRecognition = null;
let confidenceMode: boolean = false;
let startTime: Date = null;
let rid: number = -1;
let previousLog: Array<object> = [ ];
let transcript: string = "";
let confidence: number = 0.0;

export interface IWindow extends Window
{
	webkitSpeechRecognition: any;
}
const {webkitSpeechRecognition}: IWindow = <IWindow> <unknown> window;
window.SpeechRecognition = webkitSpeechRecognition || window.SpeechRecognition;
if (!("SpeechRecognition" in window))
{
	window.alert("ご利用のブラウザーは音声認識に対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
else if (!((agent.indexOf("Chrome") != -1) && (agent.indexOf("Edge") == -1) && (agent.indexOf("OPR") == -1) && (agent.indexOf("Edg") == -1)))
{
	window.alert("ご利用のブラウザーは音声認識に部分的にしか対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
window.onunload = ( ) => { };
// HTMLが読み込まれたら，音声認識インスタンスを生成し，出力先の要素を取得する
document.addEventListener("DOMContentLoaded", ( ) => 
{
	initialize( );
	setEventHandler( );
	subtitle = document.getElementById("subtitle");
	buttonStart = <HTMLButtonElement> document.getElementById("button-start");
	buttonStop = <HTMLButtonElement> document.getElementById("button-stop");
	buttonSave = <HTMLButtonElement> document.getElementById("button-save");
	buttonStop.disabled = true;
	buttonStart.addEventListener("click", (event) => 
	{
		recognitionStartClick( );
	}, false);
	buttonStop.addEventListener("click", (event) => 
	{
		recognitionStopClick( );
	}, false);
	buttonSave.addEventListener("click", (event) => 
	{
		getJson( );
	}, false);
	languageSelector = <HTMLInputElement> document.getElementById("language");
	languageSelector.addEventListener("change", (event) => 
	{
		changeLanguage( );
	}, false);
}, false);


function speechRecognition( )
{
	initialize( );
	setEventHandler( );
	speaking = false;
	recognition.start( );
}

// 初期化処理
function initialize( )
{
	console.log("インスタンス生成しました。");
	recognition = new SpeechRecognition( );
	recognition.lang = language;
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.maxAlternatives = 1;
}

function setEventHandler( )
{
	// エラーだったら
	recognition.onerror = (error: Event) => 
	{
		console.log("エラーが発生しました。" + String(error) + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(buttonStopPushed));
	};

	// 接続が切れたら
	recognition.onend = (event) => 
	{
		console.log("接続が切れました。" + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(buttonStopPushed));
		if (!speaking && !buttonStopPushed)
		{
			restart( );
			return;
		}
		if (speaking && !buttonStopPushed)
		{
			simplyRecord(transcript, confidence);
			restart( );
			return;
		}
		recognitionStop( );
	};

	// 音が途切れたら
	recognition.onsoundend = (event) => 
	{
		
	};

	// 認識できなかったら
	recognition.onnomatch = (event) => 
	{
		console.log("認識できませんでした。");
	};

	// 認識したら
	recognition.onresult = (event) => 
	{
		// 結果取得
		transcript = event.results[event.results.length - 1][0].transcript;
		let response: string = transcript.slice(-111);
		confidence = event.results[event.results.length - 1][0].confidence;
		if (confidenceMode)
		{
			const confidenceString: string = confidence.toString( ).slice(0, 5);
			response = (transcript + '<span class="confidence"> （' + confidenceString + '）</span>').slice(-147);
		}
		// 描画
		render(response, false);
		// 認識確定してたら
		if (event.results[event.results.length - 1].isFinal)
		{
			console.log("確定。");
			speaking = false;
			simplyRecord(transcript, confidence);
			return;
		}
		speaking = true;
	};
}

// 描画
function render(string, isSystemMessage)
{
	if (isSystemMessage)
	{
		renderSubtitle('<span class="system">' + string + '</span>');
		return;
	}
	renderSubtitle(string);
}

function renderSubtitle(string)
{
	subtitle.textContent = "";
	subtitle.insertAdjacentHTML("afterbegin", string);
}

// 簡易保存機能（のちほどサーバーサイドに移行し，高度な機能もつける予定）
function simplyRecord(rtranscript, rconfidence)
{
	if (startTime == null)
	{
		return;
	}
	console.log("記録。")
	rid += 1;
	const now: Date = new Date( );
	const timeDiff: Date = new Date(now.getTime( ) - startTime.getTime( ));
	const log = {
		id: rid,
		time: 
		{
			hour: now.getHours( ),
			minute: now.getMinutes( ),
			second: now.getSeconds( )
		},
		interval: 
		{
			hour: timeDiff.getUTCHours( ),
			minute: timeDiff.getUTCMinutes( ),
			second: timeDiff.getUTCSeconds( ),
			millisecond: timeDiff.getUTCMilliseconds( )
		},
		transcript: rtranscript,
		confidence: rconfidence
	};
	previousLog.push(log);
}

// 言語選択変わったら
function changeLanguage( )
{
	language = languageSelector.value;
	if (recognition != null)
	{
		recognition.lang = language;
	}
}

// 開始ボタン押したら
function recognitionStartClick( )
{
	if (startTime == null)
	{
		previousLog = [ ];
		startTime = new Date( );
	}
	buttonStopPushed = false;
	buttonStart.disabled = true;
	buttonStop.disabled = false;
	recognitionStart( );
}

// 終了ボタン押したら
function recognitionStopClick( )
{
	buttonStopPushed = true;
	buttonStop.disabled = true;
	buttonStart.disabled = false;
	recognitionStop( );
}

// 保存ボタン押したら
function getJson( )
{
	if (startTime == null)
	{
		return;
	}
	const tempJson: string = JSON.stringify(previousLog, null, "\t");
	const logJson: string = tempJson.replace(/\n/g, "\r\n") + "\r\n";
	const blob: Blob = new Blob([logJson], {type: "application/json"});
	const url: string = window.URL.createObjectURL(blob);
	const link: HTMLAnchorElement = document.createElement("a");
	link.href = url;
	link.download = "音声認識テロップ " + String(startTime.getFullYear( )) + "-" + ("00" + String(Number(startTime.getMonth( ) + 1))).slice(-2) + "-" + ("00" + String(startTime.getDate( ))).slice(-2) + ".json";
	link.click( );
}

// 信頼度表示変更
function setConfidenceMode(mode)
{
	confidenceMode = mode;
}

// 開始・終了関係
function recognitionStart( )
{
	speaking = false;
	recognition.start( );
}

function recognitionStop( )
{
	recognition.stop( );
}

function restart( )
{
	console.log("再起動。");
	recognitionStop( );
	recognitionStart( );
}
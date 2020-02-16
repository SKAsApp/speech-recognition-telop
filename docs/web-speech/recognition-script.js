// 初期処理
let agent = window.navigator.userAgent;
let subtitle;
let languageSelector;
let language = "ja-JP";
let speaking = false;
let stopButtonPushed = false;
let recognition = null;
let confidenceMode = false;
let startTime = null;
let rid = -1;
let previousLog = [ ];
let transcript = "";
let confidence = 0.0;
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
if (!"SpeechRecognition" in window)
{
	window.alert("ご利用のブラウザーは音声認識に対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
else if (!((agent.indexOf("Chrome") != -1) && (agent.indexOf("Edge") == -1) && (agent.indexOf("OPR") == -1) && (agent.indexOf("Edg") == -1)))
{
	window.alert("ご利用のブラウザーは音声認識に部分的にしか対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
window.onunload = function( ){ };
// HTMLが読み込まれたら，音声認識インスタンスを生成し，出力先の要素を取得する
document.addEventListener("DOMContentLoaded", ( ) => 
{
	initialize( );
	setEventHandler( );
	subtitle = document.getElementById("subtitle");
	languageSelector = document.getElementById("language");
	languageSelector.addEventListener("change", (event) => 
	{
		changeLanguage( );
	});
});


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
	recognition.onerror = (event) => 
	{
		console.log("エラーが発生しました。" + String(event.error) + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(stopButtonPushed));
	};

	// 接続が切れたら
	recognition.onend = (event) => 
	{
		console.log("接続が切れました。" + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(stopButtonPushed));
		if (!speaking && !stopButtonPushed)
		{
			restart( );
			return;
		}
		if (speaking && !stopButtonPushed)
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
		let response = transcript.slice(-111);
		confidence = event.results[event.results.length - 1][0].confidence;
		if (confidenceMode)
		{
			const confidenceString = confidence.toString( ).slice(0, 5);
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
	const now = new Date( );
	const timeDiff = new Date(now.getTime( ) - startTime.getTime( ));
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
	stopButtonPushed = false;
	recognitionStart( );
}

// 終了ボタン押したら
function recognitionStopClick( )
{
	stopButtonPushed = true;
	recognitionStop( );
}

// 保存ボタン押したら
function getJson( )
{
	if (startTime == null)
	{
		return;
	}
	const tempJson = JSON.stringify(previousLog, null, "\t");
	const logJson = tempJson.replace(/\n/g, "\r\n") + "\r\n";
	const blob = new Blob([logJson], {type: "application/json"});
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
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
	// speechRecognition( );
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

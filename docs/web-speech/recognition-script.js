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
// HTMLが読み込まれたら出力先の要素を取得する
document.addEventListener("DOMContentLoaded", ( ) => 
{
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
		simplyRecord(transcript, confidence);
	};

	// 接続が切れたら
	recognition.onend = (event) => 
	{
		console.log("接続が切れました。" + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(stopButtonPushed));
	};

	// 音が途切れたら
	recognition.onsoundend = (event) => 
	{
		console.log("音が途切れました。" + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(stopButtonPushed));
		if (!speaking && !stopButtonPushed)
		{
			restart( );
			return;
		}
		recognitionStop( );
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
		transcript = event.results[0][0].transcript;
		let response = transcript;
		confidence = event.results[0][0].confidence;
		if (confidenceMode)
		{
			const confidenceString = confidence.toString( ).substr(0, 5);
			response = transcript + '<span class="confidence"> （' + confidenceString + '）</span>';
		}
		// 表示欄に入りきらなくなったら再起動
		if (response.length > 111)
		{
			restart( );
		}
		// 描画
		render(response, false);
		// 認識確定してたら
		if (event.results[0].isFinal)
		{
			speaking = false;
			simplyRecord(transcript, confidence);
			if (!stopButtonPushed)
			{
				restart( );
			}
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
	// stopButtonPushed = false;
	speechRecognition( );
}

function recognitionStop( )
{
	if (recognition == null)
	{
		return;
	}
	recognition.stop( );
	recognition = null;
	// stopButtonPushed = true;
}

function restart( )
{
	recognitionStop( );
	recognitionStart( );
}

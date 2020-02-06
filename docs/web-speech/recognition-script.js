// 初期処理
let agent = window.navigator.userAgent;
let subtitle;
let language = "";
let speaking = false;
let stopButtonPushed = false;
let recognition = null;
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
if(!"SpeechRecognition" in window)
{
	window.alert("ご利用のブラウザーは音声認識に対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
else if(!((agent.indexOf("Chrome") != -1) && (agent.indexOf("Edge") == -1) && (agent.indexOf("OPR") == -1) && (agent.indexOf("Edg") == -1)))
{
	window.alert("ご利用のブラウザーは音声認識に部分的にしか対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
// HTMLが読み込まれたら出力先の要素を取得する
document.addEventListener("DOMContentLoaded", ( ) => 
{
	subtitle = document.getElementById("subtitle");
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
	// render("インスタンス生成しました", true);
}

function setEventHandler( )
{
	// エラーだったら
	recognition.onerror = (event) => 
	{
		//render("エラーが発生しました", true);
		if(!speaking)
		{
			speechRecognition( );
			return;
		}
		recognition = null;
	}

	// 終わったら
	recognition.onsoundend = (event) => 
	{
		//render("停止しました", true);
		if(!stopButtonPushed)
		{
			speechRecognition( );
			return;
		}
		stopButtonPushed = false;
	}

	// 認識できなかったら
	recognition.onnomatch = (event) => 
	{
		//render("認識できませんでした　もう1度お話ください", true);
	}

	// 認識開始
	recognition.onsoundstart = (event) =>
	{
		//render("開始しました", true);
	}

	// 認識したら
	recognition.onresult = (event) => 
	{
		// 結果取得
		for(let i = event.resultIndex; i < event.results.length; i += 1)
		{
			let transcript = event.results[i][0].transcript;
			let confidence = event.results[i][0].confidence.toString( );
			let response = transcript + '<span class="confidence"> （' + confidence.substr(0, 5) + '）</span>';
			if(response.length > 111)
			{
				restart( );
			}
			render(response, false);
			if(event.results[i].isFinal)
			{
				speechRecognition( );
				return;
			}
			speaking = true;
		}
	}
}

// 描画
function render(string, isSystemMessage)
{
	if(isSystemMessage)
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

// 言語ボタン押したら
function changeLanguage(lang)
{
	language = lang;
}

// マイクオンボタン押したら
function recognitionStart( )
{
	speechRecognition( );
}

// マイクオフボタン押したら
function recognitionStop( )
{
	stopButtonPushed = true;
	recognition.stop( );
}

function restart( )
{
	recognitionStop( );
	recognitionStart( );
}

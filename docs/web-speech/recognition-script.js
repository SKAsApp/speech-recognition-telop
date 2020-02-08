// 初期処理
let agent = window.navigator.userAgent;
let subtitle;
let languageSelector;
let language = "ja-JP";
let speaking = false;
let stopButtonPushed = false;
let recognition = null;
let confidenceMode = false;
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
if(!"SpeechRecognition" in window)
{
	window.alert("ご利用のブラウザーは音声認識に対応していません。\r\n制限なく利用するためには Google Chrome をお使いください。");
}
else if(!((agent.indexOf("Chrome") != -1) && (agent.indexOf("Edge") == -1) && (agent.indexOf("OPR") == -1) && (agent.indexOf("Edg") == -1)))
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
			recognitionStart( );
			return;
		}
		recognitionStop( );
		recognition = null;
	};

	// 終わったら
	recognition.onend = (event) => 
	{
		//render("停止しました", true);
		if(!stopButtonPushed)
		{
			recognitionStart( );
			return;
		}
		recognitionStop( );
	};

	// 認識できなかったら
	recognition.onnomatch = (event) => 
	{
		//render("認識できませんでした　もう1度お話ください", true);
	};

	// 認識したら
	recognition.onresult = (event) => 
	{
		// 結果取得
		for(let i = event.resultIndex; i < event.results.length; i += 1)
		{
			let transcript = event.results[i][0].transcript;
			let response = transcript;
			if(confidenceMode)
			{
				let confidence = event.results[i][0].confidence.toString( );
				response = transcript + '<span class="confidence"> （' + confidence.substr(0, 5) + '）</span>';
			}
			// 表示欄に入りきらなくなったら再起動
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
	};
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

// 言語選択変わったら
function changeLanguage( )
{
	language = languageSelector.value;
}

// 開始ボタン押したら
function recognitionStart( )
{
	stopButtonPushed = false;
	speechRecognition( );
}

// 終了ボタン押したら
function recognitionStop( )
{
	stopButtonPushed = true;
	recognition.stop( );
}

// 信頼度表示変更
function setConfidenceMode(mode)
{
	confidenceMode = mode;
}

function restart( )
{
	recognitionStop( );
	recognitionStart( );
}

/*!
 * Copyright 2020 SKA
 */

 // ※ 音声認識翻訳（α）用。αのため，recognition-script.tsとほぼ同じコードですが，ファイルを分けています。（β）の頃にはいい感じにソース管理されてると思います。

// 初期処理
let agent: string = window.navigator.userAgent;
let subtitle: HTMLParagraphElement;
let translation: HTMLParagraphElement;
let languageSelector: HTMLInputElement;
let buttonStart: HTMLButtonElement;
let buttonStop: HTMLButtonElement;
let buttonSave: HTMLButtonElement;
let language: string = "ja-JP";
let translateLanguage: string = "en-US";
let speaking: boolean = false;
let buttonStopPushed: boolean = false;
let recognition: SpeechRecognition;
let confidenceMode: boolean = false;
let startTime: Date;
let rid: number = -1;
let previousLog: Array<object> = [ ];
let transcript: string = "";
let confidence: number = 0.0;
let resultCounter: number = 0;
let translateApiUrl: string = "";
let previousTranslatingString: string = "";
let previousTranslatedString: string = "";

export interface SpeechRecognitionErrorEvent extends Event
{
	error: any;
	message: string;
}

export interface IWindow extends Window
{
	webkitSpeechRecognition: any;
	webkitSpeechRecognitionEvent: any;
	webkitSpeechRecognitionResultList: any;
}

const {webkitSpeechRecognition, webkitSpeechRecognitionEvent, webkitSpeechRecognitionResultList}: IWindow = <IWindow> <unknown> window;
window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
window.SpeechRecognitionResultList = window.SpeechRecognitionResultList || webkitSpeechRecognitionResultList;

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
	subtitle = <HTMLParagraphElement> document.getElementById("subtitle");
	translation = <HTMLParagraphElement> document.getElementById("translation");
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
	setTranslateApiUrl( );
}, false);

const setTranslateApiUrl = ( ) =>
{
	const tempUrl: string | null = prompt("翻訳URLを入力してください。");
	if (tempUrl == null || !tempUrl.startsWith("https://script.google.com/macros/") || !tempUrl.endsWith("/exec"))
	{
		alert("入力が間違っています。\r\nもう1度入力するにはページを再読み込みしてください。");
		buttonStart.disabled = true;
		return;
	}
	translateApiUrl = tempUrl;
};


const speechRecognition = ( ) =>
{
	initialize( );
	setEventHandler( );
	speaking = false;
	recognition.start( );
};

// 初期化処理
const initialize= ( ) =>
{
	console.log("インスタンス生成しました。");
	recognition = new SpeechRecognition( );
	recognition.lang = language;
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.maxAlternatives = 1;
};

const setEventHandler = ( ) =>
{
	// エラーだったら
	recognition.onerror = (event: SpeechRecognitionErrorEvent) => 
	{
		console.log("エラーが発生しました。" + String(event.error) + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(buttonStopPushed));
	};

	// 接続が切れたら
	recognition.onend = (event: Event) => 
	{
		console.log("end：ブラウザーが音声捕捉終了\r\n接続が切れました。" + "　speaking：" + String(speaking) + "　stopButtonPushed：" + String(buttonStopPushed));
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

	// 認識できなかったら
	recognition.onnomatch = (event: SpeechRecognitionEvent) => 
	{
		console.log("認識できませんでした。");
	};

	// その他のイベントハンドラー
	recognition.onaudiostart = (event: Event) => 
	{
		console.log("audio start：ブラウザーが音声捕捉");
	};

	recognition.onsoundstart = (event: Event) => 
	{
		console.log("sound start：なにか音が鳴った");
	};

	recognition.onsoundend = (event: Event) => 
	{
		console.log("sound end：音が止まった");
	};

	recognition.onspeechstart = (event: Event) => 
	{
		console.log("speech start：サービスが認識開始");
	};

	recognition.onspeechend = (event: Event) => 
	{
		console.log("speech end：サービスが認識終了");
	};

	recognition.onstart = (event: Event) => 
	{
		console.log("start：サービスが言語認識開始");
	};

	// 認識したら
	recognition.onresult = async (event: SpeechRecognitionEvent) => 
	{
		// 結果取得
		transcript = event.results[event.results.length - 1][0].transcript;
		if (0 < event.results.length - 1 && !isFinal(event.results[event.results.length - 2]))
		{
			transcript = event.results[event.results.length - 2][0].transcript + event.results[event.results.length - 1][0].transcript;
		}
		let response: string = transcript;
		confidence = event.results[event.results.length - 1][0].confidence;
		// 翻訳→描画
		render(response, false, 1);
		const translateFlag: boolean = manageResultCounter(isFinal(event.results[event.results.length - 1]));
		if (translateFlag)
		{
			response = await translate(response);
			render(response, false, 2);
		}
		// 認識確定してたら
		if (isFinal(event.results[event.results.length - 1]))
		{
			console.log((event.results.length - 1).toString( ) + "：確定。");
			speaking = false;
			simplyRecord(transcript, confidence);
			setTimeout(hideSubtitle, 10000, transcript, true);
			return;
		}
		setTimeout(hideSubtitle, 10000, transcript, false);
		speaking = true;
	};
};

const isFinal = (recognitionResult: SpeechRecognitionResult) =>
{
	return recognitionResult.isFinal && 0.40 <= recognitionResult[0].confidence;
};

const manageResultCounter = (isFinal: boolean) =>
{
	resultCounter += 1;
	if (isFinal || resultCounter == 8)
	{
		resultCounter = 0;
	}
	return resultCounter == 0;
};

const translate = async (beforeString: string) =>
{
	if (beforeString == previousTranslatingString)
	{
		return previousTranslatedString;
	}
	previousTranslatingString = beforeString;
	let translatedString: string = "";
	try
	{
		await fetch(translateApiUrl + "?text=" + encodeURIStrictly(beforeString) + "&source=" + encodeURIStrictly(language) + "&target=" + encodeURIStrictly(translateLanguage))
		.then((response: Response) => 
		{
			return response.text( );
		})
		.then((text: string) =>
		{
			translatedString = text;
		});
	}
	catch (error)
	{
		console.log("翻訳リクエストに失敗しました。詳細：" + error.toString( ));
	}
	previousTranslatedString = translatedString;
	return translatedString;
};

// 描画
// renderer＝0：両方描画，renderer＝1：元言語描画，renderer＝2：翻訳描画
const render = (string: string, isSystemMessage: boolean, renderer: number) =>
{
	if (isSystemMessage)
	{
		renderSubtitle('<span class="system">' + string + '</span>');
		return;
	}
	if (renderer == 1)
	{
		renderSubtitle(string);
		return;
	}
	if (renderer == 2)
	{
		renderTranslation(string);
		return;
	}
	renderSubtitle(string);
	renderTranslation(string);
};

const renderSubtitle = (string: string) =>
{
	subtitle.textContent = "";
	subtitle.insertAdjacentHTML("afterbegin", string);
};

const renderTranslation = (string: string) =>
{
	translation.textContent = "";
	translation.insertAdjacentHTML("afterbegin", string);
};

const hideSubtitle = (previousTranscript: string, isFinal: boolean) =>
{
	if (isFinal && previousTranscript == transcript)
	{
		render("", false, 0);
		console.log("非表示。");
		return;
	}
	if (!isFinal && previousTranscript == transcript)
	{
		restart( );
		return;
	}
};

// 簡易保存機能（のちほどサーバーサイドに移行し，高度な機能もつける予定）
const simplyRecord = (rtranscript: string, rconfidence: number) =>
{
	if (startTime == null)
	{
		return;
	}
	rid += 1;
	console.log(rid.toString( ) + "：記録。");
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
};

// 言語選択変わったら
const changeLanguage = ( ) =>
{
	language = languageSelector.value;
	if (language == "ja-JP")
	{
		translateLanguage = "en-US";
	}
	if (language == "en-US")
	{
		translateLanguage = "ja-JP";
	}
	if (recognition != null)
	{
		recognition.lang = language;
	}
};

// 開始ボタン押したら
const recognitionStartClick = ( ) =>
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
};

// 終了ボタン押したら
const recognitionStopClick = ( ) =>
{
	buttonStopPushed = true;
	buttonStop.disabled = true;
	buttonStart.disabled = false;
	recognitionStop( );
};

// 保存ボタン押したら
const getJson = ( ) =>
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
	link.download = String(startTime.getFullYear( )) + "-" + ("00" + String(Number(startTime.getMonth( ) + 1))).slice(-2) + "-" + ("00" + String(startTime.getDate( ))).slice(-2) + " 音声認識テロップ" + ".json";
	link.click( );
};

// 信頼度表示変更
const setConfidenceMode = (mode: boolean) =>
{
	confidenceMode = mode;
};

// 開始・終了関係
const recognitionStart = ( ) =>
{
	speaking = false;
	recognition.start( );
};

const recognitionStop = ( ) =>
{
	recognition.stop( );
};

const restart = ( ) =>
{
	console.log("再起動。");
	recognitionStop( );
	recognitionStart( );
};

const encodeURIStrictly = (beforeUri: string) => 
{
	return encodeURIComponent(beforeUri).replace(/[!'()*]/g, (c) => 
	{
		return '%' + c.charCodeAt(0).toString(16);
	});
};

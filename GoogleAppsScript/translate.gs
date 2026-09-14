function doGet(e)
{
	const params = e.parameter;
	const translatedText = LanguageApp.translate(params.text, params.source, params.target);
	if (!translatedText)
	{
		return ContentService.createTextOutput("Translation Error");
	}
	return ContentService.createTextOutput(translatedText);
}

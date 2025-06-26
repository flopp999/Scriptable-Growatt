// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.42
let widget;
let day;
let date;
let settings = {}
let hour;
let minute;
let translationData;
let currentLang;
let solarkwh;
let allValues = [];
let prices;
let pricesJSON;
let priceAvg;
let priceLowest;
let priceHighest;
let resolution;
let currency;
let vat;
let includevat;
let extras;
let ppv;

const fileNameSettings = Script.name() + "_Settings.json";
const fileNameTranslations = Script.name() + "_Translations.json";
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const filePathSettings = fm.joinPath(dir, fileNameSettings);
const filePathTranslations = fm.joinPath(dir, fileNameTranslations);

if (!config.runsInWidget){
	//await downLoadFiles();
	await updatecode();
	await readTranslations();
	await readsettings();
	//await createVariables();
	//await start();
}

if (config.runsInWidget){
	await readsettings();
	await updatecode();
	//await createVariables();
}

async function downLoadFiles() {
	const baseUrl = "https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/assets/"
	const filesToDownload = [
		"charge.png",
		"discharge.png",
		"export.png",
		"home.png",
		"import.png",
		"batterysocgreen.png",
		"batterysocorange.png",
		"batterysocred.png",
		"batterysocyellow.png",
		"homepercentgreen.png",
		"homepercentorange.png",
		"homepercentred.png",
		"homepercentyellow.png",
		"sun.png"
	]
	for (let filename of filesToDownload) {
		const filePath = fm.joinPath(dir, filename)
		if (!fm.fileExists(filePath)) {
			const url = baseUrl + filename
			try {
				const req = new Request(url)
				req.timeoutInterval = 10
				const image = await req.loadImage()
				fm.writeImage(filePath, image)
			} catch (error) {
				console.error(`Fel vid nedladdning av ${filename}:`, error)
			}
		}
	}
}

async function updatecode() {
	try {
		const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Version.txt");
		req.timeoutInterval = 10;
		const serverVersion = await req.loadString()
		if (version < serverVersion) {
			try {
				const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Growatt2.js");
				req.timeoutInterval = 10;
				const response = await req.load();
				const status = req.response.statusCode;
				if (status !== 200) {
					throw new Error(`Error: HTTP ${status}`);
				}
				const codeString = response.toRawString();
				fm.writeString(module.filename, codeString);
				
				const reqTranslations = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Translations.json");
				reqTranslations.timeoutInterval = 10;
				const responseTranslations = await reqTranslations.load();
				const statusTranslations = reqTranslations.response.statusCode;
				if (statusTranslations !== 200) {
					throw new Error(`Error: HTTP ${statusTranslations}`);
				}
				const codeStringTranslations = responseTranslations.toRawString();
				fm.writeString(filePathTranslations, codeStringTranslations);
				//fm.remove(filePathSettings);
				let updateNotify = new Notification();
				updateNotify.title = Script.name();
				updateNotify.body = "New version installed, " + serverVersion;
				updateNotify.sound = "default";
				await updateNotify.schedule();
			} catch (error) {
				console.error(error);
			}
		}
	} catch (error) {
		console.error("The update failed. Please try again later." + error);
	}
}

async function readsettings() {
	try {
		if (fm.fileExists(filePathSettings)) {
			let raw = fm.readString(filePathSettings);
			settings = JSON.parse(raw);
			if (!settings.area) {
				await askForArea();
			}
			if (!settings.deviceType || settings.deviceType.length === 0) {
				settings.deviceType = ""
			}
			if (!settings.token || settings.token.length === 0) {
				settings.token = "token"
			}
			if (!settings.deviceSn || settings.deviceSn.length === 0) {
				settings.deviceSn = "deviceSn"
			}
			if (!settings.updatehour || settings.updatehour.length === 0) {
				settings.updatehour = "0"
			}
			if (!settings.updateminute || settings.updateminute.length === 0) {
				settings.updateminute = "01"
			}
			if (!settings.language || settings.language.length === 0) {
				settings.language = 1
			}
			fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
			await readTranslations();
		} else {
			if (config.runsInWidget) {
				return;
			}
			await askForLanguage();
			await readTranslations();
			let alert = new Alert();
			alert.title = "Support";
			alert.message = t("buymeacoffee") + "?";
			alert.addAction(t("noway"));
			alert.addAction("Ko-fi");
			alert.addCancelAction("Buymeacoffee");
			let response = await alert.present();
			if (response === -1) {
				Safari.open("https://buymeacoffee.com/flopp999");
			}
			if (response === 1) {
				Safari.open("https://ko-fi.com/flopp999");
			}
			throw new Error("Settings file not found");
		}
	} catch (error) {
		if (config.runsInWidget) {
			return;
		}
		console.warn("Settings file not found or error reading file: " + error.message);
		settings = await ask();
		fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
	}
}

async function getDeviceType() {
	Path = filePathData
	DateObj = new Date();
	const url = "https://openapi.growatt.com/v4/new-api/queryDeviceList";
	let req = new Request(url);
	req.method = "POST";
	req.headers = {
		"Content-Type": "application/x-www-form-urlencoded",
		"token": settings.token
	};
	try {
		req.timeoutInterval = 10;
		response = await req.loadJSON();
		if (req.response.statusCode === 200) {
			//const dataJSON = JSON.stringify(response, null ,2);
			settings.deviceType = response["data"]["data"][0]["deviceType"]
			//fm.writeString(filePathData, dataJSON);
		fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
		} else {
			console.error("Fel statuskod:", req.response.statusCode);
		}
	} catch (err) {
		console.error(response)
		console.error("Fel vid API-anrop:", err);
	}
}

async function fetchData() {
	Path = filePathData
	DateObj = new Date();
	async function getData() {
		const url = "https://openapi.growatt.com/v4/new-api/queryLastData";
		let req = new Request(url);
		req.method = "POST";
		req.headers = {
			"Content-Type": "application/x-www-form-urlencoded",
			"token": settings.token
		};
		req.body = `deviceSn=${encodeURIComponent(settings.deviceSn)}&deviceType=${encodeURIComponent(settings.deviceType)}`;
		try {
			req.timeoutInterval = 10;
			const response = await req.loadJSON();
			if (req.response.statusCode === 200) {
				const dataJSON = JSON.stringify(response, null ,2);
				fm.writeString(filePathData, dataJSON);
				settings.updatehour = String(DateObj.getHours()).padStart(2,"0");
				settings.updateminute = String(DateObj.getMinutes()).padStart(2,"0");
				fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
			} else {
				console.error("Fel statuskod:", req.response.statusCode);
			}
		} catch (err) {
			console.error(response)
			console.error("Fel vid API-anrop:", err);
		}
	}
	
	if (fm.fileExists(filePathData)) {
		let modified = fm.modificationDate(filePathData);
		let now = new Date();
		let minutesDiff = (now - modified) / (1000 * 60);
		if ( minutesDiff > 10 ) {
			await getData();
		}
	} else {
		await getData();
	}
	let content = fm.readString(filePathData);
	data = JSON.parse(content);
	
	if (settings.deviceType == "min") {
		ppv = data["data"][settings.deviceType][0]["ppv"];
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
		batterysoc = data["data"][settings.deviceType][0]["bmsSoc"];
		homekwh = data["data"][settings.deviceType][0]["elocalLoadToday"];
		exportkwh = data["data"][settings.deviceType][0]["etoGridToday"];
		importkwh = data["data"][settings.deviceType][0]["etoUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["echargeToday"];
		batterydischargekwh = data["data"][settings.deviceType][0]["edischargeToday"];
	} else if (settings.deviceType == "storage") {
		solarkwh = data["data"][settings.deviceType][0]["epvToday"];
		batterysoc = data["data"][settings.deviceType][0]["capacity"];
		homekwh = data["data"][settings.deviceType][0]["eopDischrToday"];
		exportkwh = data["data"][settings.deviceType][0]["eToGridToday"];
		importkwh = data["data"][settings.deviceType][0]["eToUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["etoday"];
		batterydischargekwh = data["data"][settings.deviceType][0]["eBatDisChargeToday"];
	} else if (settings.deviceType == "inv") {
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
	} else if (settings.deviceType == "max") {
		solarkwh = data["data"][settings.deviceType][0]["eacToday"];
	} else if (settings.deviceType == "sph") {
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
		batterysoc = data["data"][settings.deviceType][0]["soc"];
		homekwh = data["data"][settings.deviceType][0]["elocalLoadToday"];
		exportkwh = data["data"][settings.deviceType][0]["etoGridToday"];
		importkwh = data["data"][settings.deviceType][0]["etoUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["echarge1Today"];
		batterydischargekwh = data["data"][settings.deviceType][0]["edischarge1Today"];
	} else if (settings.deviceType == "sph-s") {
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
		batterysoc = data["data"][settings.deviceType][0]["soc"];
		homekwh = data["data"][settings.deviceType][0]["elocalLoadToday"];
		exportkwh = data["data"][settings.deviceType][0]["etoGridToday"];
		importkwh = data["data"][settings.deviceType][0]["etoUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["echarge1Today"];
		batterydischargekwh = data["data"][settings.deviceType][0]["edischarge1Today"];
	}
}

async function readTranslations() {
	if (!fm.fileExists(filePathTranslations)) {
		let url = "https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Translations.json";
		let req = new Request(url);
		req.timeoutInterval = 10;
		let content = await req.loadString();
		fm.writeString(filePathTranslations, content);
	}
	try {
		translationData = JSON.parse(fm.readString(filePathTranslations));
		const langMap = {
			1: "en",
			3: "sv"
		};
		currentLang = langMap[settings.language] || "en"; // fallback to english
	} catch (error) {
		console.error(error);
	}
}

function t(key) {
	const entry = translationData[key];
	if (!entry) return `[${key}]`; // key is missing
	return entry[currentLang] || entry["en"] || `[${key}]`;
}

async function ask() {
	[settings.area, settings.vat, settings.currency] = await askForArea();
  settings.includevat = await askForIncludeVAT();
  settings.extras = await askForExtras();
  settings.showattop = "graph, today"
  settings.showatmiddle = "pricestats, today"
  settings.graphOption = {"top": "line"},
  settings.resolution = 60;
  settings.height = 550
	settings.token = await askForToken();
	settings.deviceSn = await askForDeviceSn();
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return settings
}

async function PriceStats(day) {
  await Data(day);
  if (prices == 0) {
    return;
    }
  let bottom = listwidget.addStack();
  // now
	let now = bottom.addText(t("now") + " " + Math.round(pricesJSON[hour]));
	now.font = Font.lightSystemFont(11);
	now.textColor = new Color("#00ffff");
	bottom.addSpacer();
  // lowest
  let lowest = bottom.addText(t("lowest") + " " + Math.round(priceLowest));
  lowest.font = Font.lightSystemFont(11);
  lowest.textColor = new Color("#75cf00");
  bottom.addSpacer();
  // average
  let avg = bottom.addText(t("average") + " " + Math.round(priceAvg));
  avg.font = Font.lightSystemFont(11);
  avg.textColor = new Color("#f38");
  bottom.addSpacer();
  // highest
  let highest = bottom.addText(t("highest") + " " + Math.round(priceHighest));
  highest.font = Font.lightSystemFont(11);
  highest.textColor = new Color("#ff1c00");
  listwidget.addSpacer(5);
}

async function askForExtras() {
  let alert = new Alert();
  alert.title = t("extraelectricitycost");
  alert.message = (t("enterextra") + `${settings.currency}`);
  alert.addTextField("e.g. 0.30",String(settings.extras ?? "0")).setDecimalPadKeyboard();
  alert.addAction("OK");
  await alert.present();
  let input = alert.textFieldValue(0);
  input = input.replace(",", ".")
  let newCost = parseFloat(input);
  settings.extras  = newCost
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return newCost;
}

async function askForIncludeVAT() {
  let alert = new Alert();
  alert.message = t("doyouwantvat") + "?";
  alert.addAction(t("withvat"));
  alert.addAction(t("withoutvat"));
  let index = await alert.presentAlert();
	settings.includevat = [1,0][index];
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
  return [1,0][index];
}

async function askForArea() {
  let alert = new Alert();
  alert.message = t("chooseyourelectricityarea") + ":";
  let areas = ["SE1","SE2","SE3","SE4"];
  for (let area of areas) {
    alert.addAction(area);
  }
  let index = await alert.presentAlert();
  settings.area = ["SE1","SE2","SE3","SE4"][index];
  settings.vat = 25;
  currencies = "SEK";
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
  return [settings.area, settings.vat, currencies];
}

// Select resolution
async function askForLanguage() {
	let alert = new Alert();
	alert.message = "Language/Språk:";
	alert.addAction("English");
	alert.addAction("Svenska");
	let index = await alert.presentAlert();
	settings.language = [1,3][index];
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return [1,3][index];
}

// Include extra cost?
async function askForToken() {
	let alert = new Alert();
	alert.title = "Token";
	alert.message = (t("askfortoken") + "?");
	alert.addTextField("abc123abc123abc123",settings.token).setDefaultKeyboard();
	alert.addAction("OK");
	await alert.present();
	let input = alert.textFieldValue(0);
	settings.token = input
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return input;
}

async function Graph(day, graphOption) {
//chart
  await Data(day);
  let left = listwidget.addStack();
  let whatday = left.addText(date);
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(13);
  left.addSpacer();
  let updatetext = left.addText("Nord Pool " + updated);
  updatetext.font = Font.lightSystemFont(13);
  updatetext.textColor = new Color("#ffffff");
  if (settings.resolution == 60) {
    let avgtoday = []
    let dotNow = ""
    let countertoday = 0
    let counterdot = 0
    
    do{
      avgtoday += priceAvg + ","
      countertoday += 1
    }
    while (countertoday < 24)
    
    do{
      if (hour == counterdot && day == "today") {
        dotNow += pricesJSON[counterdot] + ","
      }
      else {
        dotNow += ","
      }
      counterdot += 1
    }
    while (counterdot < 24)
    let graphtoday = "https://quickchart.io/chart?bkg=black&w=1300&h=" + settings.height + "&c="
    graphtoday += encodeURI("{\
      data: { \
        labels: ["+hours+"],\
        datasets: [\
        {\
            data: ["+dotNow+"],\
            type: 'line',\
            fill: false,\
            borderColor: 'rgb(0,255,255)',\
            borderWidth: 65,\
            pointRadius: 6\
          },\
          {\
            data: ["+avgtoday+"],\
            type: 'line',\
            fill: false,\
            borderColor: 'rgb(255,127,39)',\
            borderWidth: 6,\
            pointRadius: 0\
          },\
          {\
            data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\
            type: 'line',\
            fill: false,\
            borderColor: 'rgb(255,255,255)',\
            borderWidth: 6,\
            pointRadius: 0\
          },\
          {\
            data: ["+pricesJSON+"],\
            type: '"+settings.graphOption.top+"',\
            fill: false,\
            borderColor: getGradientFillHelper('vertical',['rgb(255,25,255)','rgb(255,48,8)','rgb(255,127,39)','rgb(255,255,0)','rgb(57,118,59)']),\
            borderWidth: 20, \
            pointRadius: 0\
          },\
        ]\
      },\
        options:\
          {\
            legend:\
            {\
              display: false\
            },\
            scales:\
            {\
              xAxes: [{\
                offset:true,\
                ticks:{fontSize:35,fontColor:'white'}\
              }],\
              yAxes: [{\
                ticks:{stepSize:10,beginAtZero:true,fontSize:35,fontColor:'white'}\
              }]\
            }\
          }\
    }")
    graphtoday.timeoutInterval = 5;
    const GRAPH = await new Request(graphtoday).loadImage()
    let emptyrow = listwidget.addStack()
    listwidget.addSpacer(5)
    let chart = listwidget.addStack()
    chart.addImage(GRAPH) 
  }
  listwidget.addSpacer(5);
}

// Include extra cost?
async function askForDeviceSn() {
	let alert = new Alert();
	alert.title = ("Serial number");
	alert.message = (t("askfordevicesn") + "?");
	alert.addTextField().setDefaultKeyboard();
	alert.addAction("OK");
	await alert.present();
	let input = alert.textFieldValue(0);
	settings.deviceSn = input;
	return input;
}

async function renderSection(position) {
	const value = settings[`showat${position}`];
	if (!value || value === "nothing") return;
	const [type, day] = value.split(",").map(s => s.trim());
	const graphOption = settings.graphOption[position]
	switch (type) {
		case "status":
		await Status(day);
		break;
		case "graph":
		await Graph(day, graphOption);
		break;
		case "pricestats":
    await PriceStats(day);
    break;
		default:
	}
}

async function Data(day) {
  allValues = [];
  Path = fm.joinPath(dir, "NordPool_" + day + "Prices.json");
  DateObj = new Date();
  async function getData() {
    const yyyy = DateObj.getFullYear();
    const mm = String(DateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(DateObj.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const Url = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${date}&market=DayAhead&indexNames=${settings.area}&currency=${settings.currency}&resolutionInMinutes=${settings.resolution}`;
    const request = new Request(Url);
    request.timeoutInterval = 1;
    let response = (await request.loadJSON());
    const dataJSON = JSON.stringify(response, null ,2);
    fm.writeString(Path, dataJSON);
  }
  if (fm.fileExists(Path)) {
    let modified = fm.modificationDate(Path);
    let now = new Date();
    let minutesDiff = (now - modified) / (1000 * 60 * 60);
    if (minutesDiff > 10) {
      await getData();
    }
  } else {
    await getData();
  }
  hour = DateObj.getHours();
  minute = DateObj.getMinutes();
  let content = fm.readString(Path);
  response = JSON.parse(content);
  date = response.deliveryDateCET;  
  prices = response.multiIndexEntries;
  let Updated = response.updatedAt;
  updated = Updated.replace(/\.\d+Z$/, '').replace('T', ' ');
  for (let i = 0; i < prices.length; i++) {
    const value = prices[i]["entryPerArea"][`${settings.area}`];
    allValues.push(String(value/10* (1 + "." + (settings.includevat*settings.vat)) + settings.extras));
  }
  pricesJSON = JSON.parse(JSON.stringify(allValues));
  priceLowest = (Math.min(...pricesJSON.map(Number)));
  priceHighest = (Math.max(...pricesJSON.map(Number)));
  priceDiff = (priceHighest - priceLowest)/3;
  priceAvg = pricesJSON.map(Number).reduce((a, b) => a + b, 0) / pricesJSON.length;
}

async function createWidget(){
	//token = set loginAndGetToken();
	listwidget.backgroundColor = new Color("#000000");
	if (!settings.deviceType || settings.deviceType.length === 0 || settings.deviceType == "") {
		await getDeviceType();
	}
	await fetchData(settings.deviceType);
	await renderSection("top");
  await renderSection("middle");
	let moms = listwidget.addStack();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer(40);
  momstext = moms.addText(t("updated") + String(settings.updatehour) + ":" + String(settings.updateminute));
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  momstext = moms.addText(settings.area);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  momstext = moms.addText("Extras: " + settings.extras);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  if (settings.includevat == 1) {
    momstext = moms.addText(t("withvat"));
  }
  else {
    momstext = moms.addText(t("withoutvat"));
  }
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  
	listwidget.addSpacer(5)
	
	const date = new Date();
	let first = listwidget.addStack()
	let spacesize = 3;
	let textsize = 17;
	let imagesize = 35;
	let growattrow = first.addStack()
	let exportrow=growattrow.addStack()
	growattrow.addSpacer(spacesize)
	let exportrowvalue=growattrow.addStack()
	growattrow.addSpacer()
	let sunhomerow=growattrow.addStack()
	growattrow.addSpacer(spacesize)
	let sunhomerowvalue=growattrow.addStack()
	growattrow.addSpacer()
	let batteryrow=growattrow.addStack()
	growattrow.addSpacer(spacesize)
	let batteryrowvalue=growattrow.addStack()
	growattrow.addSpacer()
	let percentrow=growattrow.addStack()
	growattrow.addSpacer(spacesize)
	let percentrowvalue=growattrow.addStack()
	listwidget.addSpacer(5)
	let realtimevalue=listwidget.addStack()
	let realtimevalueimage=realtimevalue.addStack()
	realtimevalue.addSpacer(spacesize)
	let realtimevaluetext=realtimevalue.addStack()
	
	exportrow.layoutVertically()
	exportrowvalue.layoutVertically()
	sunhomerow.layoutVertically()
	sunhomerowvalue.layoutVertically()
	batteryrow.layoutVertically()
	batteryrowvalue.layoutVertically()
	percentrow.layoutVertically()
	percentrowvalue.layoutVertically()
	realtimevalue.layoutHorizontally()
	realtimevalueimage.layoutVertically()
	realtimevaluetext.layoutVertically()
	
	let fm = FileManager.iCloud()
	let exportpath = fm.joinPath(fm.documentsDirectory(), "export.png")
	exportimage = await fm.readImage(exportpath)
	let importpath = fm.joinPath(fm.documentsDirectory(), "import.png")
	importimage = await fm.readImage(importpath)
	let sunpath = fm.joinPath(fm.documentsDirectory(), "sun.png")
	sunimage = await fm.readImage(sunpath)
	let homepath = fm.joinPath(fm.documentsDirectory(), "home.png")
	homeimage = await fm.readImage(homepath)
	loadpercent=(homekwh-importkwh)/homekwh*100
	
	if (loadpercent < 20) {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentred.png")
	} else if (loadpercent < 40) {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentorange.png")
	} else if (loadpercent < 70) {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentyellow.png")
	} else {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentgreen.png")
	}
	
	homepercentimage = await fm.readImage(homepercentpath)
	let batterychargepath = fm.joinPath(fm.documentsDirectory(), "discharge.png")
	batterychargeimage = await fm.readImage(batterychargepath)
	let batterydischargepath = fm.joinPath(fm.documentsDirectory(), "charge.png")
	batterydischargeimage = await fm.readImage(batterydischargepath)
	let batterysocpath
	if (batterysoc < 20) {
	  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocred.png")
	} else if (batterysoc < 40) {
	  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocorange.png")
	} else if (batterysoc < 70) {
	  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocyellow.png")
	} else {
	  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocgreen.png")
	}
	batterysocimage = await fm.readImage(batterysocpath)
	
	
	exportrow.addSpacer(2);
	ii=exportrow.addImage(exportimage);
	ii.imageSize = new Size(imagesize, imagesize);
	exportrow.addSpacer(10)
	pp=exportrow.addImage(importimage);
	pp.imageSize = new Size(imagesize, imagesize);
	
	sunhomerow.addSpacer(2);
	kk=sunhomerow.addImage(sunimage);
	kk.imageSize = new Size(imagesize, imagesize);
	sunhomerow.addSpacer(9)
	ss=sunhomerow.addImage(homeimage);
	ss.imageSize = new Size(imagesize, imagesize);
	
	batteryrow.addSpacer(2);
	de=batteryrow.addImage(batterydischargeimage);
	de.imageSize = new Size(imagesize, imagesize);
	batteryrow.addSpacer(10)
	ll=batteryrow.addImage(batterychargeimage);
	ll.imageSize = new Size(imagesize, imagesize);
	
	percentrow.addSpacer(2);
	l=percentrow.addImage(batterysocimage);
	l.imageSize = new Size(imagesize, imagesize);
	percentrow.addSpacer(10)
	lp=percentrow.addImage(homepercentimage);
	lp.imageSize = new Size(imagesize, imagesize);

	realtimevalueimage.addSpacer(2);
	ked=realtimevalueimage.addImage(sunimage);
	ked.imageSize = new Size(imagesize, imagesize);

	// Value
	let exportkwhtext = exportrowvalue.addText(Math.round(exportkwh) + "\nkWh");
	exportkwhtext.font = Font.lightSystemFont(textsize);
	exportrowvalue.addSpacer(3);
	let importkwhtext = exportrowvalue.addText(Math.round(importkwh)+"\nkWh");
	importkwhtext.font = Font.lightSystemFont(textsize);
	
	let solarkwhtext = sunhomerowvalue.addText(Math.round(solarkwh) + "\nkWh");
	solarkwhtext.font = Font.lightSystemFont(textsize);
	sunhomerowvalue.addSpacer(4);
	let homekwhtext = sunhomerowvalue.addText(Math.round(homekwh) + "\nkWh");
	homekwhtext.font = Font.lightSystemFont(textsize);
	
	let batterychargekwhtext = batteryrowvalue.addText(Math.round(batterychargekwh) + "\nkWh");
	batterychargekwhtext.font = Font.lightSystemFont(textsize);
	batteryrowvalue.addSpacer(3);
	let batterydischargekwhtext = batteryrowvalue.addText(Math.round(batterydischargekwh) + "\nkWh");
	batterydischargekwhtext.font = Font.lightSystemFont(textsize);
	
	let batterysoctext = percentrowvalue.addText(Math.round(batterysoc) + "\n%");
	batterysoctext.font = Font.lightSystemFont(textsize);
	percentrowvalue.addSpacer(3);
	let loadpercenttext = percentrowvalue.addText(Math.round(loadpercent) + "\n%");
	loadpercenttext.font = Font.lightSystemFont(textsize);

	let realtimevaluetext2 = realtimevaluetext.addText(Math.round(ppv) + "\nW");
	realtimevaluetext2.font = Font.lightSystemFont(textsize);
	
	solarkwhtext.textColor = new Color("#ffffff");
	homekwhtext.textColor = new Color("#ffffff");
	exportkwhtext.textColor = new Color("#ffffff");
	importkwhtext.textColor = new Color("#ffffff");
	batterychargekwhtext.textColor = new Color("#ffffff");
	batterydischargekwhtext.textColor = new Color("#ffffff");
	batterysoctext.textColor = new Color("#ffffff");
	loadpercenttext.textColor = new Color("#ffffff");
	realtimevaluetext2.textColor = new Color("#ffffff");

  return listwidget;
}

const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

const now = new Date();
// Hämta antalet dagar i innevarande månad
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
// Skapa array från 1 till antal dagar
const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

let listwidget = new ListWidget();
widget = await createWidget();

if (config.runsInWidget) {
	Script.setWidget(widget);
} else {
	if (Math.random() < 0.5) {
		let alert = new Alert();
		alert.title = "Support";
		alert.message = t("buymeacoffee") + "?";
		alert.addCancelAction("Buymeacoffee 👍");
		alert.addAction("Ko-fi 👍");
		alert.addAction(t("noway"));
		let response = await alert.present();
		if (response === -1) {
			Safari.open("https://buymeacoffee.com/flopp999");
		}
		if (response === 0) {
			Safari.open("https://ko-fi.com/flopp999");
		}
	}
}

widget.presentLarge()
Script.complete();

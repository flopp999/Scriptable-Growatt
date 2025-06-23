// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.18
let token;
let deviceSn;
let epv1 = 23
let epv2 = 18

let homekwh = 23;
let batterysoc = 100
let exportkwh = 33
let importkwh = 1
let batterychargekwh = 5
let batterydischargekwh = 7
// === API-anrop ===

//const baseURL = "https://api.checkwatt.se";
let batteryCapacityKwh;
let widget;
let day;
let date;
let language;
let settings = {}
let langId;
let hour;
let minute;
let translationData;
let monthName;
let currentLang;

const fileNameSettings = Script.name() + "_Settings.json";
const fileNameTranslations = Script.name() + "_Translations.json";
const fileNameData = Script.name() + "_Data.json";
const fileNameDataYear = Script.name() + "_DataYear.json";
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const filePathSettings = fm.joinPath(dir, fileNameSettings);
const filePathTranslations = fm.joinPath(dir, fileNameTranslations);
const filePathData = fm.joinPath(dir, fileNameData);
const filePathdataYear = fm.joinPath(dir, fileNameDataYear);

if (!config.runsInWidget){
  await updatecode();
  await readTranslations();
  await readsettings();
  await createVariables();
  //await start();
}

if (config.runsInWidget){
 await readsettings();
}
if (config.runsInWidget){
  await updatecode();
  await createVariables();
}

async function start() {
  const [topType, topDay] = settings.showattop.split(",").map(s => s.trim());
  const [middleType, middleDay] = settings.showatmiddle.split(",").map(s => s.trim());
 // const [bottomType, bottomDay] = settings.showatbottom.split(",").map(s => s.trim());
  let alert = new Alert();
  //let vatText = includevat == 1 ? t("yes") : t("no")
  alert.message = 
    t("changesetup") + "?\n" +
    t("top").charAt(0).toUpperCase() + t("top").slice(1) + ":\n" + t(topType) + (topDay ? ", " + t(topDay) : "") + "\n" +
    t("middle").charAt(0).toUpperCase() + t("middle").slice(1) + ":\n" + t(middleType) + (middleDay ? ", " + t(middleDay) : "")
    //t("bottom").charAt(0).toUpperCase() + t("bottom").slice(1) + ":\n" + t(bottomType) + (bottomDay ? ", " + t(bottomDay) : "")
  alert.addAction(t("yes"));
  alert.addAction(t("no"));
  let index = await alert.presentAlert();
  if (index === 0) {
    settings = await ask();
    fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function downLoadFiles() {
	const baseUrl = "https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/assets/"
	// Filer att hämta – json + bilder
	const filesToDownload = [
		"batterysocgreen.png",
		"batterycharge.png",
		"batterydischarge.png",
		"export.png",
		"home.png",
		"import.png",
		"solar.png"
	]
	// Ladda ner varje fil
	for (let filename of filesToDownload) {
		const url = baseUrl + filename
		const filePath = fm.joinPath(dir, Script.name() + "_" + filename)
		try {
			const req = new Request(url)
			req.timeoutInterval = 5
			const image = await req.loadImage()
			fm.writeImage(filePath, image)
		} catch (error) {
			console.error(`Fel vid nedladdning av ${filename}:`, error)
		}
	}
}



async function updatecode() {
  try {
    const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Version.txt");
    req.timeoutInterval = 1;
    const serverVersion = await req.loadString()
    if (version < serverVersion) {
      try {
        const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Growatt.js");
        req.timeoutInterval = 1;
        const response = await req.load();
        const status = req.response.statusCode;
        if (status !== 200) {
          throw new Error(`Error: HTTP ${status}`);
        }
        const codeString = response.toRawString();
        fm.writeString(module.filename, codeString);

        const reqTranslations = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Translations.json");
        reqTranslations.timeoutInterval = 1;
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
      langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
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

async function getStatus() {
  const endpoint = `/site/Statuses?serial=` + rpiSerial;
  const url = baseURL + endpoint;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };
  const req = new Request(url);
  req.method = "GET";
  req.headers = headers;
  try {
    const responsestatus = await req.loadJSON();
    if (req.response.statusCode === 200) {
			if (responsestatus[0]["Pending"][0] == "fcrd") {
				mode = "CO"
			} else if (responsestatus[0]["Pending"][0] == "sc") {
				mode = "SC"
			} else {
				mode = "Unknown"
			}
			if (responsestatus[0]["Service"][0] == "off") {
				modeStatus = t("deactivated")
			} else if (responsestatus[0]["Service"][0] == "fcrd" || responsestatus[0]["Service"][0] == "sc") {
				modeStatus = t("activated")
			} else {
				modeStatus = "Unknown"
			}

			
			
			FpUpInKw = responsestatus[0]["FpUpInKw"]
			FpDownInKw = responsestatus[0]["FpDownInKw"]
			ChargingMax = responsestatus[0]["RelatedMeters"][0]["PeakAcKw"]
			DischargingMax = responsestatus[0]["RelatedMeters"][1]["PeakAcKw"]
      return null;
    } else {
      console.error("❌ Fel statuskod:", req.response.statusCode);
    }
  } catch (err) {
    console.error("❌ Fel vid hämtning av status", err);
  }
  return null;
}

// == Hämta revenue med JWT ==
async function fetchData(jwtToken) {
	Path = filePathData
	DateObj = new Date();
	async function getData() {
		const url = "https://openapi.growatt.com/v1/device/tlx/tlx_last_data";
		let req = new Request(url);
		req.method = "POST";
		req.headers = {
		  "Content-Type": "application/x-www-form-urlencoded",
		  "token": token
		};
		req.body = `tlx_sn=${encodeURIComponent(deviceSn)}`;
		try {
			req.timeoutInterval = 1;
	  	const response = await req.loadJSON();
			if (req.response.statusCode === 200) {
				const dataJSON = JSON.stringify(response, null ,2);
				fm.writeString(filePathData, dataJSON);
		  	console.log("Svar från Growatt:", response);
		    settings.updatehour = String(DateObj.getHours()).padStart(2,"0");
				settings.updateminute = String(DateObj.getMinutes()).padStart(2,"0");
				fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
			} else {
				console.error("❌ Fel statuskod:", req.response.statusCode);
			}
		} catch (err) {
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
	//hour = DateObj.getHours();
	//minute = DateObj.getMinutes();
	let content = fm.readString(filePathData);
	data = JSON.parse(content);


	epv1 = data["data"]["epv1Today"];
		    epv2 = data["data"]["epv2Today"];
		    batterysoc = data["data"]["bmsSoc"];
		    homekwh = data["data"]["elocalLoadToday"];
		    exportkwh = data["data"]["etoGridToday"];
		    //importkwh = data["data"]["elocalLoadToday"];
		    batterychargekwh = data["data"]["echargeToday"];
		    batterydischargekwh = data["data"]["edischargeToday"];

	updated = "" + hour + minute + "";
}

async function createVariables() {
  token = settings.token;
  deviceSn = settings.deviceSn;
	hour = settings.updatehour;
	minute = settings.updateminute;
}

async function readTranslations() {
  if (!fm.fileExists(filePathTranslations)) {
    let url = "https://raw.githubusercontent.com/flopp999/Scriptable-Growatt/main/Translations.json";
    let req = new Request(url);
    req.timeoutInterval = 1;
    let content = await req.loadString();
    fm.writeString(filePathTranslations, content);
  }
  try {
    translationData = JSON.parse(fm.readString(filePathTranslations));
    const langMap = {
      1: "en",
      3: "sv"
    };
    currentLang = langMap[langId] || "en"; // fallback to english
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
  settings.token = await askForToken();
  settings.deviceSn = await askForDeviceSn();
  return settings
}

// Select resolution
async function askForLanguage() {
  let alert = new Alert();
  alert.message = "Language/Språk:";
  alert.addAction("English");
  alert.addAction("Svenska");
  let index = await alert.presentAlert();
  settings.language = [1,3][index];
  fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
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
  token = input
  return input;
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
  deviceSn = input;
  return input;
}

async function Status(day) {
	let row = listwidget.addStack();
	row.layoutHorizontally()
  let left = row.addStack()
  left.layoutVertically()
	row.addSpacer(40)
	let mid = row.addStack()
	mid.layoutVertically()
	let right = row.addStack()
	right.layoutVertically()
	let whatday = left.addText(t("mode") + ": " + mode + ", " + modeStatus);
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
	whatday = mid.addText(t("capacity") + ": " + String(batteryCapacityKwh) +  "kWh");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
  whatday = left.addText(t("charge") + ": " + String(ChargingMax) + "kW");
  whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
  whatday = mid.addText(t("up") + ": " + String(FpUpInKw) + "kW");
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(13);
	whatday = left.addText(t("discharge") + ": " + String(DischargingMax) + "kW");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
	whatday = mid.addText(t("down") + ": " + String(FpDownInKw) + "kW");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
}



const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const now = new Date();
// Hämta antalet dagar i innevarande månad
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
// Skapa array från 1 till antal dagar
const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
    case "revenue":
      await Revenue();
      break;
    default:
  }
}

let listwidget = new ListWidget();

async function Revenue() {
	let ja = listwidget.addStack()
  listwidget.addSpacer(10)
	let save = listwidget.addStack();
  save.layoutHorizontally()
  let saveleft = save.addStack()
  saveleft.layoutVertically()
  save.addSpacer(20)
  let savemid = save.addStack()
  savemid.layoutVertically()
  save.addSpacer(30)
  let saveright = save.addStack()
  saveright.layoutVertically()
  save.addSpacer(20)
  let savemost = save.addStack()
  savemost.layoutVertically()
  let te = saveleft.addText(String(monthName))
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff")
  te = savemid.addText(" ")
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveleft.addText("FCR-D");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = savemid.addText(String(Math.round(totalFcrd)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveleft.addText(t("savings"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveleft.addText(t("peakbought"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemid.addText(String(Math.round(totalSavings)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	 te = savemid.addText(String(peakBought.toFixed(1)) + "kW");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveright.addText(t("thisyear"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveright.addText("FCR-D");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveright.addText(t("savings"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(" ")
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(String(Math.round(totalFcrdYear)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(String(Math.round(totalSavingsYear)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
}

async function createWidget(){
	//token = set loginAndGetToken();
	await fetchData(token);
	const date = new Date();
	let solarkwh = epv1+epv2
//let widget = new ListWidget();
let first = listwidget.addStack()
first.layoutHorizontally()
first.addSpacer()
//let solarrow = widget.addStack();
//let importrow = widget.addStack()
let exportrowr = first.addStack()
let exportrow=exportrowr.addStack()
exportrow.layoutVertically()
//let homerow = widget.addStack()
//let batterychargerow = widget.addStack()
//let batterydischargerow = widget.addStack()
first.addSpacer()
let fm = FileManager.iCloud()
let exportpath = fm.joinPath(fm.documentsDirectory(), "export.png")
exportimage = await fm.readImage(exportpath)
let importpath = fm.joinPath(fm.documentsDirectory(), "import.png")
importimage = await fm.readImage(importpath)
let solarpath = fm.joinPath(fm.documentsDirectory(), "solar.png")
solarimage = await fm.readImage(solarpath)
let homepath = fm.joinPath(fm.documentsDirectory(), "home.png")
homeimage = await fm.readImage(homepath)
let batterychargepath = fm.joinPath(fm.documentsDirectory(), "batterycharge.png")
batterychargeimage = await fm.readImage(batterychargepath)
let batterydischargepath = fm.joinPath(fm.documentsDirectory(), "batterydischarge.png")
batterydischargeimage = await fm.readImage(batterydischargepath)
let batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysoc.png")
batterysocimage = await fm.readImage(batterysocpath)

exportrow.addSpacer()
kk=exportrow.addImage(solarimage);
kk.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
ss=exportrow.addImage(homeimage);
ss.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
ii=exportrow.addImage(exportimage);
ii.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
pp=exportrow.addImage(importimage);
pp.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
de=exportrow.addImage(batterychargeimage);
de.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
ll=exportrow.addImage(batterydischargeimage);
ll.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
l=exportrow.addImage(batterysocimage);
l.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
//exportrow.addSpacer()
exportrowr.addSpacer(10)

let exportvalue = exportrowr.addStack()
exportvalue.layoutVertically()

exportvalue.addSpacer(15)
let solarkwhtext = exportvalue.addText(Math.round(solarkwh) + " kWh");
exportvalue.addSpacer(23)
let homewhtext = exportvalue.addText(Math.round(homekwh) + " kWh");
exportvalue.addSpacer(23)
let exportkwhtext = exportvalue.addText(Math.round(exportkwh) + " kWh");
exportvalue.addSpacer(23)
let importkwhtext = exportvalue.addText(Math.round(importkwh) + " kWh");
exportvalue.addSpacer(23)
let batterychargekwhtext = exportvalue.addText(Math.round(batterychargekwh) + " kWh");
exportvalue.addSpacer(23)
let batterydischargekwhtext = exportvalue.addText(Math.round(batterydischargekwh) + " kWh");
exportvalue.addSpacer(23)
let batterysoctext = exportvalue.addText(Math.round(batterysoc) + " %");

solarkwhtext.textColor = new Color("#ffffff");
homewhtext.textColor = new Color("#ffffff");
exportkwhtext.textColor = new Color("#ffffff");
importkwhtext.textColor = new Color("#ffffff");
batterychargekwhtext.textColor = new Color("#ffffff");
batterydischargekwhtext.textColor = new Color("#ffffff");
batterysoctext.textColor = new Color("#ffffff");
	
  listwidget.backgroundColor = new Color("#000000");
  await renderSection("top");
  //await renderSection("middle");
  //await renderSection("bottom");  
  listwidget.addSpacer(0);
  let moms = listwidget.addStack();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
	moms.addSpacer();
  momstext = moms.addText("updated " + settings.updatehour + ":" + settings.updateminute);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  return listwidget;
}

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

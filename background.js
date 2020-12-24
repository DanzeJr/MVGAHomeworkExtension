function hexToText(value) {
	var hex = value.toString();
	var result = "";
	for (var i = 0; i < hex.length; i += 2) {
		result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	return result;
}

function validURL(str) {
	var pattern = new RegExp(
		"^(https?:\\/\\/)?" + // protocol
			"((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
			"((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
			"(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
			"(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
			"(\\#[-a-z\\d_]*)?$",
		"i"
	); // fragment locator
	return !!pattern.test(str);
}

// Testing whether the input is both a string and valid url:
function isUrl(url) {
	try {
		return toString.call(url) === "[object String]" && !!new URL(url);
	} catch (_) {
		return false;
	}
}

function saveLink(url) {
	chrome.storage.sync.get("history", function (data) {
		let isExisted = false;
		data = data.history;
		for (let i = 0; i < data.length; i++) {
			if (data[i].url == url) {
				data[i].views = data[i].views + 1;
				isExisted = true;
				break;
			}
		}

		if (!isExisted) {
			data.push({ url: url, views: 1 });
		}
		chrome.storage.sync.set({ history: data }, function () {
			console.log("Increased views");
		});
	});
}

function openIgnognito(url) {
	if (!isUrl(url)) {
		alert(chrome.i18n.getMessage("invalid_url") + "\n" + url);
		return;
	}
	saveLink(url);
	chrome.windows.getAll(
		{ populate: false, windowTypes: ["normal"] },
		function (windows) {
			for (let w of windows) {
				if (w.incognito) {
					// Use this window.
					chrome.tabs.create({ url: url, windowId: w.id });
					return;
				}
			}

			// No incognito window found, open a new one.
			chrome.windows.create({ url: url, incognito: true });
		}
	);
}

const CONTEXT_MENU_ID = "MVGAHomeWorkExtension";
function openHomework(info) {
	if (info.menuItemId !== CONTEXT_MENU_ID) {
		return;
	}
	openIgnognito(
		isUrl(info.selectionText)
			? info.selectionText
			: hexToText(info.selectionText)
	);
}

chrome.contextMenus.onClicked.addListener(openHomework);
chrome.runtime.onInstalled.addListener(function () {
	chrome.storage.sync.set({ history: [] }, function () {
		console.log("Initiate history");
	});

	chrome.contextMenus.create({
		title: chrome.i18n.getMessage("open_in_incognito"),
		contexts: ["selection"],
		id: CONTEXT_MENU_ID,
	});
});

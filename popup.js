let table = document.getElementById("data");

function updateViews(url, viewsCol) {
	viewsCol.innerText = +viewsCol.innerText + 1;
	chrome.storage.sync.get("history", function (data) {
		data = data.history;
		for (let i = 0; i < data.length; i++) {
			if (data[i].url == url) {
				data[i].views++;
				break;
			}
		}
		chrome.storage.sync.set({ history: data }, function () {
			console.log("Increased views");
		});
	});
}

function openIncognito(url) {
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

function copyToClipboard(value) {
	let textArea = document.createElement("textarea");
	textArea.value = value;
	document.body.appendChild(textArea);
	textArea.select();
	textArea.setSelectionRange(0, 999999);
	document.execCommand("copy");
	textArea.remove();
}

function removeLink(url, row) {
	chrome.storage.sync.get("history", function (data) {
		data = data.history;
		for (let i = 0; i < data.length; i++) {
			if (data[i].url == url) {
				data.splice(i, 1);
				table.removeChild(row);
				checkEmpty(data);
				break;
			}
		}
		chrome.storage.sync.set({ history: data }, function () {
			console.log("Link removed");
		});
	});
}

function checkEmpty(data) {
	if (data.length === 0) {
		let notification = document.createElement("h4");
		notification.innerText = chrome.i18n.getMessage("no_link");
		let container = document.getElementsByClassName("container").item(0);

		container.parentElement.appendChild(notification);
		container.remove();
		return true;
	}

	return false;
}

function localizeHtmlPage() {
	//Localize by replacing __MSG_***__ meta tags
	var objects = document.getElementsByClassName("i18n");
	for (var j = 0; j < objects.length; j++) {
		var obj = objects[j];

		var valStrH = obj.innerHTML;
		var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
			return v1 ? chrome.i18n.getMessage(v1) : "";
		});

		if (valNewH != valStrH) {
			obj.innerHTML = valNewH;
		}
	}
}

localizeHtmlPage();
chrome.storage.sync.get("history", function (data) {
	const links = data.history;
	if (checkEmpty(links)) {
		return;
	}
	for (let link of links) {
		let url = new URL(link.url);
		let row = document.createElement("tr");
		row.setAttribute("id", url.href);
		let siteCol = document.createElement("td");
		let linkCol = document.createElement("td");
		let viewsCol = document.createElement("td");
		let copyCol = document.createElement("td");
		let removeCol = document.createElement("td");

		let copyIcon = document.createElement("i");
		let removeIcon = document.createElement("i");

		siteCol.innerText = url.hostname;
		siteCol.addEventListener("click", function () {
			openIncognito(url.href);
		});

		linkCol.innerHTML = url.href;
		linkCol.style = "cursor: pointer";
		linkCol.addEventListener("click", function () {
			updateViews(url.href, viewsCol);
			openIncognito(url.href);
		});

		viewsCol.innerHTML = link.views;

		copyIcon.classList.add("fas", "fa-copy");
		copyCol.appendChild(copyIcon);
		let tooltip = document.createElement("span");
		tooltip.classList.add("tooltiptext");
		tooltip.innerText = chrome.i18n.getMessage("copy_to_clipboard");
		copyCol.classList.add("tooltip");
		copyCol.appendChild(tooltip);
		copyCol.addEventListener("click", function () {
			copyToClipboard(url.href);
			tooltip.classList.add("success");
			tooltip.innerText = chrome.i18n.getMessage("copied_to_clipboard");
		});
		copyCol.addEventListener("mouseleave", function () {
			tooltip.classList.remove("success");
			tooltip.innerText = chrome.i18n.getMessage("copy_to_clipboard");
		});

		removeIcon.classList.add("fas", "fa-trash-alt");
		removeCol.appendChild(removeIcon);
		removeCol.addEventListener("click", function () {
			removeLink(url.href, row);
		});

		row.appendChild(siteCol);
		row.appendChild(linkCol);
		row.appendChild(viewsCol);
		row.appendChild(copyCol);
		row.appendChild(removeCol);
		table.appendChild(row);
	}
});

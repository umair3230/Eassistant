const MAX_WIDTH_PANEL = 350;

const EASSISTANT_CONTROL_ID = {
  BUBBLE: "bubble-id-eassistant",
  BUBBLE_IFRAME: "bubble-id-iframe",
  BUBBLE_IFRAME_SETTING: "advisor-setting",
};

const EASSISTANT_CONTROL_STYLE = {
  FIXED:
    "z-index:9999999999;position:fixed;box-shadow: 0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 3px 10px 0 rgba(0,0,0,.12);",
  FIXED_NO_TOP: "position:absolute;",
  BOTTOM_TRIANGLE:
    "width:0;height:0;border-left:7.5px solid transparent;border-right:7.5px solid transparent;border-bottom:10px solid rgb(60, 167, 241);",
  TOP_TRIANGLE:
    "width:0;height:0;border-left:7.5px solid transparent;border-right:7.5px solid transparent;border-top:10px solid rgb(60, 167, 241);",
  BUBBLE: `background-color:#FFFFFF;border-radius:5px;white-space:nowrap;width: ${MAX_WIDTH_PANEL}px;height: 100%;top: 0px;`,
  PADDING: 10,
  IFRAME: "width: 100%; height: 100%;border: none;float: left;display: block;",
};

const CHROME_RUNTIME_MESSAGES = {
  EIRemovePanel: "eassistant-injection-trigger-remove-panel",
  EISwitchPanel: "eassistant-injection-trigger-switch-panel",
  EISettingPanel: "eassistant-injection-trigger-setting",
  EIReloadSettingPanel: "eassistant-injection-trigger-reload-setting",
  EIResizePanel: "eassistant-injection-trigger-resize-panel",
  EIAlreadyInject: "eassistant-injection-already-inject-panel",
  EINetworkAlert: "eassistant-injection-trigger-network-alert",
};

var messagesAllow = {
  "trigger-eassistant-draw": true,
  "eassistant-injection-trigger-switch-panel": true,
  "eassistant-injection-trigger-setting": true,
  "eassistant-injection-trigger-reload-setting": true,
  "eassistant-injection-trigger-resize-panel": true,
  "eassistant-injection-already-inject-panel": true,
  "eassistant-injection-trigger-network-alert": true,
};

var settingURL = undefined;
var isShowingNetworkAlert = false;
var isShowingSettingPage = false;
try {
  localStorage.getItem("");

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.msg === CHROME_RUNTIME_MESSAGES.EIRemovePanel) {
      removeEassistant();
      sendResponse({ success: true });
      return true;
    }
    if (!messagesAllow[request.msg]) {
      return;
    }
    if (window.top !== window.self) {
      return;
    }

    if (request.msg === CHROME_RUNTIME_MESSAGES.EISwitchPanel) {
      switchPanel(sendResponse);
      return true;
    }
    if (request.msg === CHROME_RUNTIME_MESSAGES.EISettingPanel) {
      setting(request.data);
      return;
    }
    if (request.msg === CHROME_RUNTIME_MESSAGES.EIReloadSettingPanel) {
      reloadSetting();
      return true;
    }
    if (request.msg === CHROME_RUNTIME_MESSAGES.EIResizePanel) {
      resizeScreen();
      return;
    }
    if (request.msg === CHROME_RUNTIME_MESSAGES.EINetworkAlert) {
      if (request.data === "show" || request.data === "hide") {
        isShowingNetworkAlert = request.data === "show";
        settingAndNetworkAlertResizeScreen();
      }
      return;
    }
    if (request.msg === CHROME_RUNTIME_MESSAGES.EIAlreadyInject) {
      sendResponse({ alreadyInject: usedToDraw() });
      return true;
    }
    if (request.data.documentBranchId) {
      localStorage.setItem(
        "documentBranchId",
        request.data.documentBranchId.toString()
      );
    } else {
      localStorage.removeItem("documentBranchId");
    }
    if (!usedToDraw()) {
      drawEassistant(
        request.data.url,
        request.data.appId,
        request.data.drawInLeft
      );
    }
    sendResponse({ ok: true });
    return true;
  });
} catch (e) {}

function usedToDraw() {
  return document.querySelector(`#${EASSISTANT_CONTROL_ID.BUBBLE}`) !== null;
}
window.addEventListener("message", function (event) {
  if (event.data) {
    let request = JSON.parse(event.data);
    if (request.msg === CHROME_RUNTIME_MESSAGES.EIRemovePanel) {
      removeEassistant();
      // sendResponse({ success: true });
      return true;
    }
  }
  // We only accept messages from ourselves
  //  if (event.source != window) return;
});
function drawEassistant(url, appId, drawInLeft) {
  let bubble = window.document.getElementById(EASSISTANT_CONTROL_ID.BUBBLE);
  if (!bubble) {
    bubble = window.document.createElement("DIV");
    bubble.setAttribute("id", EASSISTANT_CONTROL_ID.BUBBLE);
    bubble.setAttribute("name", EASSISTANT_CONTROL_ID.BUBBLE);
    bubble.setAttribute(
      "style",
      EASSISTANT_CONTROL_STYLE.FIXED +
        EASSISTANT_CONTROL_STYLE.BUBBLE +
        "right:0"
    );
  }
  let ifrm = window.document.getElementById(
    EASSISTANT_CONTROL_ID.BUBBLE_IFRAME
  );
  if (!ifrm) {
    ifrm = document.createElement("iframe");
    ifrm.setAttribute("id", EASSISTANT_CONTROL_ID.BUBBLE_IFRAME);
    ifrm.setAttribute("name", EASSISTANT_CONTROL_ID.BUBBLE_IFRAME);
    ifrm.setAttribute("src", url);
    ifrm.setAttribute("style", EASSISTANT_CONTROL_STYLE.IFRAME);
  }

  settingURL = `chrome-extension://${appId}/index.html`;

  if (drawInLeft) {
    bubble.style.left = "0px";
  }

  bubble.appendChild(ifrm);
  document.body.insertBefore(bubble, document.body.firstChild);
  isShowingSettingPage = false;
}

function removeEassistant() {
  let bubble = window.document.getElementById(EASSISTANT_CONTROL_ID.BUBBLE);
  if (bubble) {
    document.body.removeChild(bubble);
  }
}

function switchPanel(sendResponse) {
  let bubble = window.document.getElementById(EASSISTANT_CONTROL_ID.BUBBLE);
  if (bubble) {
    if (bubble.style.left) {
      bubble.style.left = "";
    } else {
      bubble.style.left = "0px";
    }
  }
  const isLeft = bubble.style.left === "0px";
  sendResponse(isLeft);
}

function setting(isShowSetting) {
  let settingIfrm = window.document.getElementById(
    EASSISTANT_CONTROL_ID.BUBBLE_IFRAME_SETTING
  );
  if (settingIfrm) {
    settingIfrm.src = settingURL;
  } else {
    settingIfrm = document.createElement("iframe");
    settingIfrm.setAttribute("id", EASSISTANT_CONTROL_ID.BUBBLE_IFRAME_SETTING);
    settingIfrm.setAttribute(
      "name",
      EASSISTANT_CONTROL_ID.BUBBLE_IFRAME_SETTING
    );
    settingIfrm.setAttribute("src", settingURL);
    settingIfrm.setAttribute("style", EASSISTANT_CONTROL_STYLE.IFRAME);
    let main = window.document.getElementById(EASSISTANT_CONTROL_ID.BUBBLE);
    main.appendChild(settingIfrm);
  }

  isShowingSettingPage = isShowSetting;
  settingAndNetworkAlertResizeScreen();
}

function reloadSetting() {
  var frmSetting = window.document.getElementById(
    EASSISTANT_CONTROL_ID.BUBBLE_IFRAME_SETTING
  );
  if (frmSetting) {
    frmSetting.src = settingURL;
  }
}

function resizeScreen() {
  let bubble = window.document.getElementById(EASSISTANT_CONTROL_ID.BUBBLE);
  if (bubble.style.width === "100%") {
    bubble.style.width = `${MAX_WIDTH_PANEL}px`;
  } else {
    bubble.style.width = "100%";
  }
}

function settingAndNetworkAlertResizeScreen() {
  let mainFrame = window.document.getElementById(
    EASSISTANT_CONTROL_ID.BUBBLE_IFRAME
  );
  if (isShowingSettingPage) {
    mainFrame.style.height = isShowingNetworkAlert ? "138px" : "75px";
  } else {
    mainFrame.style.height = "100%";
  }
}

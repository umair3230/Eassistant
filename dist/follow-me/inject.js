function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let initialTime = "";
var objectInfo = {};

var getXpath = function(e) {
  var i = e;
  if (i && i.id) return '//*[@id="' + i.id + '"]';
  for (var n = []; i && Node.ELEMENT_NODE === i.nodeType; ) {
    for (var o = 0, r = !1, d = i.previousSibling; d; )
      d.nodeType !== Node.DOCUMENT_TYPE_NODE &&
        d.nodeName === i.nodeName &&
        o++,
        (d = d.previousSibling);
    for (d = i.nextSibling; d; ) {
      if (d.nodeName === i.nodeName) {
        r = !0;
        break;
      }
      d = d.nextSibling;
    }
    n.push(
      (i.prefix ? i.prefix + ":" : "") +
        i.localName +
        (o || r ? "[" + (o + 1) + "]" : "")
    ),
      (i = i.parentNode);
  }
  return n.length ? "/" + n.reverse().join("/") : "";
};
var tabInfo;

let isRecording;

const Messages = {
  SetPositionMouse: "set-position-mouse",
  GetPositionMouse: "get-position-mouse",
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === "clickEvent") {
    objectInfo.coordsScreenShot = request.data.coordsScreenShot;
    objectInfo.coordsControlImage = request.data.coordsControlImage;

    rrwebRecord.addCustomEvent("click", {
      objectInfo: objectInfo,
    });
  }

  if (request.msg === "tabInfo") {
    tabInfo = request.data;
  }

  if (request.msg === "active-tab" && isRecording) {
    tabInfo = request.data;
    if (stopRecord) {
      stopRecord();
      stopRecord = null;
      record();
    }
  }

  if (request.msg === "tab-already-record") {
    sendResponse({ ok: true });
  }
  return true;
});

window.addEventListener(
  "mousedown",
  (event) => {
    let stringfyObj = stringify_object(event);

    let xpath = getXpath(event.target);

    if (isRecording) {
      if (!initialTime) {
        initialTime = localStorage.getItem("initialTime");
      }
      objectInfo = {
        stringfyObj: stringfyObj,
        path: xpath,
        tabInfo: tabInfo,
      };
    }
  },
  true
);

function getElementByXpath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

function getDomPath2(el) {
  var stack = [];
  while (el.parentNode != null) {
    var sibCount = 0;
    var sibIndex = 0;
    for (var i = 0; i < el.parentNode.childNodes.length; i++) {
      var sib = el.parentNode.childNodes[i];
      if (sib.nodeName == el.nodeName) {
        if (sib === el) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    if (el.hasAttribute("id") && el.id != "") {
      stack.unshift(el.nodeName.toLowerCase() + "#" + el.id);
    } else if (sibCount > 1) {
      stack.unshift(el.nodeName.toLowerCase() + ":eq(" + sibIndex + ")");
    } else {
      stack.unshift(el.nodeName.toLowerCase());
    }
    el = el.parentNode;
  }
  return stack.slice(1); // removes the html element
}

function getDomPath(el) {
  var stack = [];
  while (el.parentNode != null) {
    var sibCount = 0;
    var sibIndex = 0;
    for (var i = 0; i < el.parentNode.childNodes.length; i++) {
      var sib = el.parentNode.childNodes[i];
      if (sib.nodeName == el.nodeName) {
        if (sib === el) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    if (el.hasAttribute("id") && el.id != "") {
      stack.unshift(el.nodeName.toLowerCase() + "#" + el.id);
    } else if (sibCount > 1) {
      stack.unshift(el.nodeName.toLowerCase() + ":eq(" + sibIndex + ")");
    } else {
      stack.unshift(el.nodeName.toLowerCase());
    }
    el = el.parentNode;
  }

  return stack.slice(1); // removes the html element
}

const IFRAME_PADDING = ["padding-left", "padding-top"];
var isFrame = window.top !== window.self;
let mPoint = {};

let handleEvent = function(event) {
  let eventFull = JSON.parse(JSON.stringify(event));
  delete eventFull.data.target;
  if (!isFrame) {
    chrome.runtime.sendMessage({
      msg: "hasEvent-full",
      data: eventFull,
    });
  }

  if (
    event.data &&
    ((event.data.type === 1 && event.data.source === 2) ||
      event.data.source === 5)
  ) {
    if (event.data.target) {
      let target = event.data.target;
      // delete event.data.target;
      let boundingTarget = target.getBoundingClientRect();
      let data = {
        ...event,
        target2: event.data.target,
        target: {
          top: boundingTarget.top,
          left: boundingTarget.left,
          width: boundingTarget.width,
          height: boundingTarget.height,
          text: event.data.text || target.textContent || target.value,
        },
      };

      if (isFrame) {
        window.parent.postMessage(
          JSON.stringify({
            msg: "recording-step",
            data,
            index: window.frames.name || window.frames.location.href,
          }),
          "*"
        );
      } else {
        chrome.runtime.sendMessage({
          msg: "hasEvent",
          data,
        });
      }
    } else {
      chrome.runtime.sendMessage({
        msg: "hasEvent",
        data: event,
      });
    }
  }
};
let stopRecord;
let record = () => {
  stopRecord = rrwebRecord({
    emit: handleEvent,
  });
};

var iframes = Array.from(document.getElementsByTagName("IFRAME"))
  .map(function(iframe) {
    var style = getComputedStyle(iframe);
    iframe[IFRAME_PADDING[0]] = +style
      .getPropertyValue(IFRAME_PADDING[0])
      .match(/[0-9]*/)[0];
    iframe[IFRAME_PADDING[1]] = +style
      .getPropertyValue(IFRAME_PADDING[1])
      .match(/[0-9]*/)[0];

    var bounding = iframe.getBoundingClientRect();
    return {
      index: iframe.name || iframe.src,
      bounding: {
        left: bounding.left + iframe["padding-left"],
        top: bounding.top + iframe["padding-top"],
        width: bounding.width,
        height: bounding.height,
      },
    };
  })
  .filter(function(x) {
    return x.bounding.width > 0 && x.bounding.height > 0;
  });

window.addEventListener(
  "message",
  function(request) {
    if (!request.data) {
      return;
    }

    var req = undefined;

    try {
      req = JSON.parse(request.data);
    } catch (e) {
      return;
    }

    if (
      (req.msg !== "recording-step" && req.msg !== Messages.GetPositionMouse) ||
      req.identifier
    ) {
      return;
    }

    var iframe =
      document.querySelector('[name="' + req.index + '"]') ||
      document.querySelector('[src="' + req.index + '"]') ||
      document.querySelector(
        '[src="' + req.index.replace(/https?:\/\/.*?\//, "/") + '"]'
      );

    var item = undefined;

    if (!iframe) {
      item = iframes.find(function(x) {
        return (
          x.index === req.index ||
          x.index === req.index.replace(/https?:\/\/.*?\//, "/") ||
          x.bounding.left >= 0
        );
      });

      if (item) {
        iframe =
          document.querySelector('[name="' + item.index + '"]') ||
          document.querySelector('[src="' + item.index + '"]') ||
          document.querySelector(
            '[src="' + item.index.replace(/https?:\/\/.*?\//, "/") + '"]'
          );
      }
    }

    if (req.msg === "recording-step") {
      req.data.mPoint = mPoint;
    }

    if (iframe) {
      var style = getComputedStyle(iframe);
      var bounding = iframe.getBoundingClientRect();
      iframe[IFRAME_PADDING[0]] = +style
        .getPropertyValue(IFRAME_PADDING[0])
        .match(/[0-9]*/)[0];
      iframe[IFRAME_PADDING[1]] = +style
        .getPropertyValue(IFRAME_PADDING[1])
        .match(/[0-9]*/)[0];

      if (req.msg === "recording-step") {
        req.data.target.left += bounding.left + iframe["padding-left"];
        req.data.target.top += bounding.top + iframe["padding-top"];
        req.data.mPoint.clientX += bounding.left + iframe["padding-left"];
        req.data.mPoint.clientY += bounding.top + iframe["padding-top"];
      } else if (req.msg === Messages.GetPositionMouse) {
        req.data.clientX += bounding.left + iframe["padding-left"];
        req.data.clientY += bounding.top + iframe["padding-top"];
      }
    } else if (item) {
      if (req.msg === "recording-step") {
        req.data.target.left += item.bounding.left;
        req.data.target.top += item.bounding.top;
        req.data.mPoint.clientX += item.bounding.left;
        req.data.mPoint.clientY += item.bounding.top;
      } else if (req.msg === Messages.GetPositionMouse) {
        req.data.clientX += item.bounding.left;
        req.data.clientY += item.bounding.top;
      }
    }

    if (isFrame) {
      window.parent.postMessage(
        JSON.stringify({
          msg: req.msg,
          data: req.data,
          index: window.frames.name || window.frames.location.href,
        }),
        "*"
      );
    } else {
      switch (req.msg) {
        case Messages.GetPositionMouse:
          chrome.runtime.sendMessage({
            msg: Messages.SetPositionMouse,
            mPoint: req.data,
          });
          break;
        case "recording-step":
          chrome.runtime.sendMessage({ msg: "hasEvent", data: req.data });
          break;
      }
    }
  },
  true
);

chrome.storage.sync.get("is_recording", function(result) {
  isRecording = result.is_recording;
  if (isRecording) {
    record();
    appendCaptureControl("opus_btnCapture_Cancel", btnCancelCapture);
    appendCaptureControl("opus_btnPromptCapture", btnPromptCapture);
    appendCaptureControl("opus_txtPromptCapture", inputPromptCapture);
    appendCaptureControl("opus_btnCapture", btnCapture);
  }
});

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== "sync") return;

  var isRecordingChange = changes["is_recording"];

  if (!isRecordingChange) {
    return;
  }

  isRecording = isRecordingChange.newValue;
  if (isRecording) {
    record();

    appendCaptureControl("opus_btnCapture_Cancel", btnCancelCapture);
    appendCaptureControl("opus_btnPromptCapture", btnPromptCapture);
    appendCaptureControl("opus_txtPromptCapture", inputPromptCapture);
    appendCaptureControl("opus_btnCapture", btnCapture);
  } else {
    removeCaptureControl("opus_btnCapture_Cancel");
    removeCaptureControl("opus_btnPromptCapture");
    removeCaptureControl("opus_txtPromptCapture");
    removeCaptureControl("opus_btnCapture");

    if (stopRecord) {
      stopRecord();
      stopRecord = null;
    }
  }
});

window.addEventListener("mousemove", handleEventMousemove, true);

function handleEventMousemove(event) {
  if (!isRecording) {
    return;
  }
  mPoint = {
    screenX: event.screenX,
    screenY: event.screenY,
    clientX: event.clientX,
    clientY: event.clientY,
  };

  if (window.top === window.self) {
    chrome.runtime.sendMessage({
      msg: Messages.SetPositionMouse,
      mPoint: mPoint,
    });
  } else {
    window.parent.postMessage(
      JSON.stringify({
        msg: Messages.GetPositionMouse,
        data: mPoint,
        index: window.frames.name || window.frames.location.href,
      }),
      "*"
    );
  }
}

//handle for native window browser
var btnCancelCapture, btnPromptCapture, inputPromptCapture, btnCapture;
var drawButtonCustomNativeWindow = function() {
  btnCancelCapture = document.createElement("button");
  btnCancelCapture.id = "opus_btnCapture_Cancel";
  btnCancelCapture.hidden = true;
  btnCancelCapture.setAttribute(
    "style",
    "display: none !important;width: 0 !important;height: 0 !important;border: none !important;padding: 0 !important;"
  );
  btnCancelCapture.innerText = "";

  btnPromptCapture = document.createElement("button");
  btnPromptCapture.id = "opus_btnPromptCapture";
  btnPromptCapture.hidden = true;
  btnPromptCapture.setAttribute(
    "style",
    "display: none !important;width: 0 !important;height: 0 !important;border: none !important;padding: 0 !important;"
  );
  btnPromptCapture.innerText = "";

  inputPromptCapture = document.createElement("input");
  inputPromptCapture.id = "opus_txtPromptCapture";
  inputPromptCapture.hidden = true;
  inputPromptCapture.setAttribute(
    "style",
    "display: none !important;width: 0 !important;height: 0 !important;border: none !important;padding: 0 !important;"
  );
  inputPromptCapture.innerText = "";

  btnCapture = document.createElement("button");
  btnCapture.id = "opus_btnCapture";
  btnCapture.hidden = true;
  btnCapture.setAttribute(
    "style",
    "display: none !important;width: 0 !important;height: 0 !important;border: none !important;padding: 0 !important;"
  );
  btnCapture.innerText = "";

  btnPromptCapture.addEventListener("click", function(ev) {
    ev.target.innerText = "Ok";
    handleEvent({
      data: {
        type: 1,
        source: 2,
        target: ev.target,
      },
      timestamp: new Date().getTime(),
      type: 3,
    });
  });

  btnCancelCapture.addEventListener("click", function(ev) {
    ev.target.innerText = "Cancel";
    handleEvent({
      data: {
        type: 1,
        source: 2,
        target: ev.target,
      },
      timestamp: new Date().getTime(),
      type: 3,
    });
  });

  btnCapture.addEventListener("click", function(ev) {
    ev.target.innerText = "Ok";
    handleEvent({
      data: {
        type: 1,
        source: 2,
        target: ev.target,
      },
      timestamp: new Date().getTime(),
      type: 3,
    });
  });
};
var appendCaptureControl = function(controlId, control) {
  if (document.body) {
    if (!document.getElementById(controlId)) {
      document.body.appendChild(control);
    }
  }
};

function removeCaptureControl(controlId) {
  var control = document.getElementById(controlId);
  if (control) {
    document.body.removeChild(control);
  }
}

var disablerFunction = function() {
  _alert = window.alert;
  window.alert = function alert(msg) {
    setTimeout(() => {
      if (document.getElementById("opus_btnCapture")) {
        document.getElementById("opus_btnCapture").click();
      }
    }, 10);
    return _alert(msg);
  };

  _confirm = window.confirm;
  window.confirm = function confirm(message) {
    var result = _confirm(message);
    if (result) {
      if (document.getElementById("opus_btnCapture")) {
        document.getElementById("opus_btnCapture").click();
      }
    } else {
      if (document.getElementById("opus_btnCapture_Cancel")) {
        document.getElementById("opus_btnCapture_Cancel").click();
      }
    }
    return result;
  };

  _prompt = window.prompt;
  window.prompt = function(message) {
    var result = _prompt(message);
    if (result !== null) {
      if (document.getElementById("opus_txtPromptCapture")) {
        document.getElementById("opus_txtPromptCapture").innerText = result;
      }

      if (document.getElementById("opus_btnPromptCapture")) {
        let btn = document.getElementById("opus_btnPromptCapture");
        btn.value = result;
        btn.click();
      }
    } else {
      if (document.getElementById("opus_btnCapture_Cancel")) {
        document.getElementById("opus_btnCapture_Cancel").click();
      }
    }
    return result;
  };
};
var appendCustomNativeWindowToDOM = function() {
  drawButtonCustomNativeWindow();
};
appendCustomNativeWindowToDOM();
var disablerCode = "(" + disablerFunction.toString() + ")();";

var disablerScriptElement = document.createElement("script");
disablerScriptElement.textContent = disablerCode;

document.documentElement.appendChild(disablerScriptElement);
disablerScriptElement.parentNode.removeChild(disablerScriptElement);

function stringify_object(object, depth = 0, max_depth = 2) {
  // change max_depth to see more levels, for a touch event, 2 is good
  if (depth > max_depth) return "Object";

  const obj = {};
  for (let key in object) {
    let value = object[key];
    if (value instanceof Node)
      // specify which properties you want to see from the node
      value = { id: value.id };
    else if (value instanceof Window) value = "Window";
    else if (value instanceof Object)
      value = stringify_object(value, depth + 1, max_depth);

    obj[key] = value;
  }

  return depth ? obj : JSON.stringify(obj);
}

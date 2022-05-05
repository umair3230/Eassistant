var isChrome = true;
var recorder;
var video = document.createElement("video");
video.autoplay = true;
var isRecording = false;
var events = [];
var eventsFull = [];
var tabId = 0;
var numberStep = 0;
var screenPoint = {
  screenX: 0,
  screenY: 0,
  clientX: 0,
  clientY: 0,
};
let tabInfo;

const Messages = {
  HasEvent: "hasEvent",
  HasEventFull: "hasEvent-full",
  SetPositionMouse: "set-position-mouse",
};

chrome.extension.onRequest.addListener(async function(request, sender) {
  if (request.data === "stop") {
    await stopScreenRecording();
    isRecording = false;
    return;
  }
  tabId = request.data.id;
  if (isRecording) {
    stopScreenRecording();
  } else {
    events = [];
    eventsFull = [];
    captureDesktop();
  }
  isRecording = !isRecording;
});

// chrome.browserAction.onClicked.addListener(function (tab) {
//     // for the current tab, inject the "inject.js" file & execute it
//     tabId = tab.id;
//     if (isRecording) {
//         stopScreenRecording();
//     } else {
//         events = [];
//         eventsFull = [];
//         captureDesktop();
//     }
//     isRecording = !isRecording;
// });

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === Messages.HasEventFull && isRecording) {
    if (sender.tab.id === tabId) {
      eventsFull.push(request.data);
    }
  }

  if (request.msg === Messages.HasEvent && isRecording) {
    if (sender.tab.id !== tabId) {
      return;
    }
    var preEvent = events[events.length - 1];
    var curEvent = request.data;
    chrome.tabs.getZoom(sender.tab.id, function(zoomFactor) {
      if (curEvent.target) {
        if (
          curEvent.target.top * zoomFactor +
            curEvent.target.height * zoomFactor >
          sender.tab.height
        ) {
          curEvent.target.height =
            sender.tab.height - curEvent.target.top * zoomFactor;
        } else {
          curEvent.target.height = curEvent.target.height * zoomFactor;
        }
        // ScreenShoot
        const location = getBrowserDeviation(
          screenPoint.screenX,
          screenPoint.screenY,
          screenPoint.clientX,
          screenPoint.clientY,
          zoomFactor
        );

        let data = {
          ...curEvent,
          browser: {
            window: {
              x: location.x,
              y: location.y,
              w: sender.tab.width,
              h: sender.tab.height,
            },
            zoomFactor: zoomFactor,
          },
        };

        if (
          curEvent.data.source === 5 &&
          preEvent.data.source === 5 &&
          checkSameTarget(curEvent, preEvent)
        ) {
          events[events.length - 1] = data;
        } else {
          numberStep++;
          events.push(data);
        }
        const coordsScreenShot = {
          x: data.browser.window.x,
          y: data.browser.window.y,
          w: data.browser.window.w,
          h: data.browser.window.h,
        };

        const coordsControlImage = {
          x: coordsScreenShot.x + data.target.left * data.browser.zoomFactor,
          y: coordsScreenShot.y + data.target.top * data.browser.zoomFactor,
          w: data.target.width * data.browser.zoomFactor,
          h: data.target.height,
        };
        data.coordsScreenShot = coordsScreenShot;
        data.coordsControlImage = coordsControlImage;
        console.log(data);

        chrome.tabs.sendMessage(tabId, { msg: "clickEvent", data: data });

        chrome.browserAction.setBadgeText({ text: numberStep.toString() });
      } else {
        events.push(curEvent);
      }
    });
  }

  if (request.msg === Messages.SetPositionMouse) {
    screenPoint = request.mPoint;
  }

  return true;
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.runtime.sendMessage({
    msg: "tabInfo",
    data: tab,
  });
  chrome.tabs.sendMessage(tabId, { msg: "tabInfo", data: tab });

  // if (!tabInfo) {
  //   tabInfo = tab;
  //   chrome.tabs.sendMessage(tabId, { msg: "tabInfo", data: tabInfo });
  //   return;
  // }
  // if (tabInfo && tabInfo.url !== tab.url) {
  //   tabInfo = tab;
  //   chrome.tabs.sendMessage(tabId, { msg: "tabInfo", data: tabInfo });
  // }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  tabId = activeInfo.tabId;
  if (isRecording) {
    chrome.tabs.get(tabId, function(tab) {
      chrome.runtime.sendMessage({
        msg: "tabInfo",
        data: tab,
      });
      chrome.tabs.sendMessage(tabId, { msg: "tabInfo", data: tab });

      chrome.tabs.sendMessage(
        tabId,
        { msg: "tab-already-record" },
        (response) => {
          chrome.tabs.sendMessage(tabId, { msg: "active-tab", data: tab });
          let timestamp = new Date().getTime();
          var setData = (dataUrl) => {
            if (!dataUrl) {
              return;
            }
            let data = {
              data: {
                type: 1, // TODO
                source: 9, // TODO
              },
              timestamp,
              type: 1,
              image: dataUrl,
            };
            if (!dataUrl) {
              delete data.image;
            }
            events.push(data);
          };

          var callback = (dataUrl) => {
            if (!dataUrl) {
              setTimeout(() => {
                chrome.tabs.captureVisibleTab(
                  activeInfo.windowId ? activeInfo.windowId : null,
                  null,
                  function(dataUrl) {
                    setData(dataUrl);
                  }
                );
              }, 1000);
            } else {
              setData(dataUrl);
            }
          };

          captureTab(activeInfo, callback);
        }
      );
    });
  }
});

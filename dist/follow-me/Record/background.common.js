var recorder;
var isRecording = false;
var bitsPerSecond = 12400000;
var isChrome = true; // used by RecordRTC
var videoMaxFrameRates = "";
var videoResolutions = "1920x1080";
var fixVideoSeekingIssues = false;
var mimeType = "video/webm";
var fileExtension = "webm";

function isMediaRecorderCompatible() {
    return true;
}

function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) {
        return "0 Bytes";
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + " " + sizes[i];
}

var Storage = {};

if (typeof AudioContext !== "undefined") {
    Storage.AudioContext = AudioContext;
} else if (typeof webkitAudioContext !== "undefined") {
    Storage.AudioContext = webkitAudioContext;
}

MediaStream.prototype.stop = function () {
    this.getTracks().forEach(function (track) {
        track.stop();
    });
};

/*
==================================================================
Return Random string
==================================================================
*/
function getRandomString() {
    if (
        window.crypto &&
        window.crypto.getRandomValues &&
        navigator.userAgent.indexOf("Safari") === -1
    ) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = "";
        for (var i = 0, l = a.length; i < l; i++) {
            token += a[i].toString(36);
        }
        return token;
    } else {
        return (Math.random() * new Date().getTime())
            .toString(36)
            .replace(/\./g, "");
    }
}

/*
==================================================================
Return Filename string
==================================================================
*/
function getFileName(fileExtension) {
    var d = new Date();
    var year = d.getUTCFullYear() + "";
    var month = d.getUTCMonth() + "";
    var date = d.getUTCDate() + "";

    if (month.length === 1) {
        month = "0" + month;
    }

    if (date.length === 1) {
        date = "0" + date;
    }
    return year + month + date + getRandomString() + "." + fileExtension;
}

/*
==================================================================
Stop recording
==================================================================
*/
function addStreamStopListener(stream, callback) {
    var streamEndedEvent = "ended";
    if ("oninactive" in stream && !("onended" in stream)) {
        streamEndedEvent = "inactive";
    }
    stream.addEventListener(streamEndedEvent, function () {
        callback();
        callback = function () {
        };
    });
    getTracks(stream, "audio").forEach(function (track) {
        track.addEventListener(streamEndedEvent, function () {
            callback();
            callback = function () {
            };
        });
    });
    getTracks(stream, "video").forEach(function (track) {
        track.addEventListener(streamEndedEvent, function () {
            callback();
            callback = function () {
            };
        });
    });
}

function getTracks(stream, kind) {
    if (!stream || !stream.getTracks) {
        return [];
    }

    return stream.getTracks().filter(function (t) {
        return t.kind === (kind || "audio");
    });
}

function getSeekableBlob(inputBlob, callback) {
    // EBML.js copyrights goes to: https://github.com/legokichi/ts-ebml
    if (typeof EBML === "undefined") {
        throw new Error("Please link: https://cdn.webrtc-experiment.com/EBML.js");
    }

    var reader = new EBML.Reader();
    var decoder = new EBML.Decoder();
    var tools = EBML.tools;

    var fileReader = new FileReader();
    fileReader.onload = function (e) {
        var ebmlElms = decoder.decode(this.result);
        ebmlElms.forEach(function (element) {
            reader.read(element);
        });
        reader.stop();
        var refinedMetadataBuf = tools.makeMetadataSeekable(
            reader.metadatas,
            reader.duration,
            reader.cues
        );
        var body = this.result.slice(reader.metadataSize);
        var newBlob = new Blob([refinedMetadataBuf, body], {
            type: "video/webm",
        });

        callback(newBlob);
    };
    fileReader.readAsArrayBuffer(inputBlob);
}

/*
==================================================================
check Event target is same or not
==================================================================
*/
function checkSameTarget(x, y) {
    var res =
        x.target.top == y.target.top &&
        x.target.left == y.target.left &&
        x.target.width == y.target.width &&
        x.target.height == y.target.height;
    return res;
}

function getBrowserDeviation(screenX, screenY, clientX, clientY, zoomFactor) {
    var screenXDeviation = screenX - Math.round(clientX * zoomFactor);
    var screenYDeviation = screenY - Math.round(clientY * zoomFactor);

    if (screenXDeviation >= screen.width) {
        screenXDeviation -= screen.width;
    }

    return {
        x: screenXDeviation,
        y: screenYDeviation,
    };
}

/*
==================================================================
Capture Browser Tab
==================================================================
*/
function captureTab(activeInfo, callback) {
    chrome.tabs.captureVisibleTab(
        activeInfo.windowId ? activeInfo.windowId : null,
        null,
        function (dataUrl) {
            callback(dataUrl);
        }
    );
}

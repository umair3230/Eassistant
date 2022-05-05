const socket = io(Config.SOCKETIO_URL);
let multiUploadArray = [];
let uploadId = "";
const baseURL = "https://api.internal.dev-fm-opuseps.com/v3";
let dataEvents = [];
let progressBlobs = {};
isFileUpload = false;
isEventsUpload = false;
initHeadLessBrowserRunCount = 0;
let temp;
let isMultiPartUploading = false;
let presignedUrlsList = [];
let startNumber = 1;
let endNumber = 16;
let sessionId;
let userInfo;
let fileNamePath;
let filePathEventsData;
let userSettings = JSON.parse(localStorage.getItem("userData"));
let urlBuffer =
    userSettings && userSettings.presignedURLs ? userSettings.presignedURLs : 15;
let start = 0;
let end = urlBuffer;
let presignedUrlsArray = [];
const SendMessages = {
    GetWholeHtml: "get-whole-html",
    PauseRecording: "pause-recording",
    StartRecording: "start-recording",
};
const BUFFER_SIZE = 6350671;
socket.on("open-view-page", () => {
    chrome.tabs.query({}, function (tabs) {
        let found = false;
        const url = "chrome-extension://" + chrome.runtime.id + "/webpreview/";
        const urlSearch =
            "chrome-extension://" + chrome.runtime.id + "/preview.html";
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url === urlSearch) {
                found = true;
                chrome.tabs.update(tabs[i].id, {
                    active: true,
                    url: `${url}index.html`,
                });
                break;
            }
        }
    });
});

/*
==================================================================
Capture Desktop and start recording
If recording already started then stop the recording
==================================================================
*/
function captureDesktop() {
    if (isRecording) {
        stopScreenRecording();
        return;
    }

    if (recorder && recorder.streams) {
        recorder.streams.forEach(function (stream, idx) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });

            if (idx === 0 && typeof stream.onended === "function") {
                stream.onended();
            }
        });
        recorder.streams = null;
        return;
    }

    const screenSources = ["screen", "window"];

    chrome.desktopCapture.chooseDesktopMedia(screenSources, onAccessApproved);
}

/*
==================================================================
Fetch user settings and initialize the Media API
==================================================================
*/
function onAccessApproved(chromeMediaSourceId) {
    if (!chromeMediaSourceId || !chromeMediaSourceId.toString().length) {
        setDefaults();
        chrome.runtime.reload();
        return;
    }

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: chromeMediaSourceId,
            },
            optional: [],
            cursor: "never",
        },
    };

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(async function (stream) {
            let userInfo = JSON.parse(localStorage.getItem("userData"));
            let token = localStorage.getItem("auth_token");
            try {
                let session = await axios({
                    method: "POST",
                    url: baseURL + "/DocumentSession",
                    data: {},
                    headers: {
                        Authorization: token,
                    },
                });
                session = session.data.result;
                localStorage.setItem("currentSession", session);
            } catch (e) {
                localStorage.setItem("isRecording", "false");
                localStorage.removeItem("userData");
                localStorage.removeItem("currentSession");
                setDefaults();
                chrome.runtime.reload();
            }
            try {
                let settings = await axios({
                    method: "GET",
                    url: baseURL + "/RecordingSetting?tenantId=" + userInfo.tenantId,
                    data: {},

                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: token,
                    },
                });
                let {result} = settings.data.result;
                localStorage.setItem("settings", JSON.stringify(result));
                let bitpersecond = 0;
                let framepersecond = 0;
                if (result) {
                    bitpersecond = result.bitpersecond;
                    framepersecond = result.framepersecond;
                } else {
                    bitpersecond = 12400000;
                    framepersecond = 8;
                }

                const track = stream.getVideoTracks()[0];
                track
                    .applyConstraints({
                        frameRate: {exact: framepersecond ? framepersecond : 8},
                    })
                    .then(() => {
                        addStreamStopListener(stream, function () {
                            stopScreenRecording();
                        });
                        initVideoPlayer(stream);
                        gotStream(stream, bitpersecond);
                    });
            } catch (e) {
                localStorage.setItem("isRecording", "false");
                setDefaults();
                chrome.runtime.reload();
            }
        })

        .catch(function (error) {
            alert(
                "Unable to capture screen using:\n" +
                JSON.stringify(constraints, null, "\t") +
                "\n\n" +
                error
            );
            setDefaults();
            chrome.runtime.reload();
        });
}

function gotStream(stream, bitpersecond) {
    const options = {
        type: "video",
        recorderType: MediaStreamRecorder,
        disableLogs: false,
        ignoreMutedMedia: false,
        timeSlice: 1000,
        mimeType: mimeType,
    };
    if (bitsPerSecond) {
        bitsPerSecond = parseInt(bitpersecond);
        if (!bitsPerSecond || bitsPerSecond < 100) {
            bitsPerSecond = 8000000000; // 1 GB /second
        }
    }

    if (bitsPerSecond) {
        options.bitsPerSecond = bitsPerSecond;
    }

    startRecordingCallback(options);
    initHeadLessBrowser = false
    recorder = new MediaStreamRecorder(stream, options);

    recorder.streams = [stream];
    chrome.runtime.sendMessage({msg: SendMessages.StartRecording});

    recorder.record();

    isRecording = true;
    chrome.browserAction.setIcon({path: "../rec.png"});

    addStreamStopListener(recorder.streams[0], function () {
        stopScreenRecording();
    });

    initialTime = Date.now();
    chrome.storage.sync.set({is_recording: true});
}

/*
==================================================================
Hanlde Stop recording
==================================================================
*/
async function stopScreenRecording() {
    if (!recorder || !isRecording) return;

    isRecording = false;
    chrome.storage.sync.set({is_recording: false});

    recorder.stop(async function onStopRecording(blob, ignoreGetSeekableBlob) {
        if (fixVideoSeekingIssues && recorder && !ignoreGetSeekableBlob) {
            getSeekableBlob(recorder.blob, function (seekableBlob) {
                onStopRecording(seekableBlob, true);
            });
            return;
        }

        let file = new File(
            [recorder ? recorder.blob : ""],
            getFileName(fileExtension),
            {
                type: mimeType,
            }
        );

        if (ignoreGetSeekableBlob === true) {
            file = new File([blob], getFileName(fileExtension), {
                type: mimeType,
            });
        }
        DiskStorage.StoreFile(file, function (response) {
            try {
                videoPlayers.forEach(function (player) {
                    player.srcObject = null;
                });
                videoPlayers = [];
            } catch (e) {
            }

            if (recorder && recorder.streams) {
                recorder.streams.forEach(function (stream, idx) {
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                    });

                    if (idx == 0 && typeof stream.onended === "function") {
                        stream.onended();
                    }
                });

                recorder.streams = null;
            }

            isRecording = false;

            stopRecordingCallback(file);
            events = [];
            eventsFull = [];
            chrome.storage.sync.set({
                isRecording: "false",
                openPreviewPage: "false",
            });


        });
        if (file.size < BUFFER_SIZE && !isMultiPartUploading) {
            isFileUpload = true;
            await uploadVideoToS3(fileNamePath, file);
            chrome.tabs.query({}, function (tabs) {
                setDefaults();
            });
        }
        localStorage.setItem("selected-file", file.name);


    });
}

/*
==================================================================
Set default values
==================================================================
*/
function setDefaults() {
    chrome.browserAction.setIcon({
        path: "epilogue.png",
    });

    if (recorder && recorder.streams) {
        recorder.streams.forEach(function (stream) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        });

        recorder.streams = null;
    }

    recorder = null;
    isRecording = false;

    bitsPerSecond = 0;
    videoMaxFrameRates = "";
    isMultiPartUploading = false;
    videoResolutions = "1280x720";
    fixVideoSeekingIssues = false;
    numberStep = 0;
    startNumber = 1;
    endNumber = 16;
    chrome.storage.sync.set({
        isRecording: "false", // FALSE
    });
}

/*
==================================================================
Handle start recording
==================================================================
*/
async function startRecordingCallback(options) {
    userInfo = JSON.parse(localStorage.getItem("userData"));
    sessionId = localStorage.getItem("currentSession");

    fileNamePath = `${userInfo.tenantId}/${sessionId}/session-video.mp4`;

    uploadId = await getUploadId(fileNamePath);
    presignedUrlsList = await this.getSignedUrl(
        startNumber,
        endNumber,
        fileNamePath,
        uploadId
    );

    options.ondataavailable = function (blob) {
        const data = {
            blobData: blob,
            eventsData: events.splice(0, events.length - 1),
            eventsFullData: eventsFull.splice(0, eventsFull.length),
            startTime: initialTime,
        };
        dataEvents = dataEvents
            ? dataEvents.concat(data.eventsFullData)
            : data.eventsFullData
                ? data.eventsFullData
                : [];

        uploadMulitpartToS3(data);
    };
}

/*
==================================================================
Handle stop recording
==================================================================
*/
async function stopRecordingCallback() {
    chrome.browserAction.setBadgeText({text: ""});
    localStorage.setItem("isUploading", "false");
    localStorage.setItem("isRecording", "false");
    for (let event in dataEvents) {
        dataEvents[event].beginTime = initialTime;
    }
    const filePath = `${userInfo.tenantId}/${sessionId}/events.json`;
    if (
        JSON.stringify(dataEvents).length &&
        JSON.stringify(dataEvents).length < BUFFER_SIZE
    ) {
        const sessionId = localStorage.getItem("currentSession");

        filePathEventsData = filePath;
        const blob = new Blob([JSON.stringify(dataEvents)], {
            type: "application/json",
        });
        let file = new File([blob], "events.json", {
            type: "application/json",
        });
        isEventsUpload = true;
        uploadVideoToS3(filePath, file);
    } else {
        uploadMultipartEventData(dataEvents, filePath);
    }
}

let buffer = [];
let buff;
let numParts = 0;
let bufferLength = 0;
const currentPresignedUrl = 0;

/*
==================================================================
Handle Multipart upload to s3
==================================================================
*/
async function uploadMulitpartToS3(data) {
    try {
        let buf = await data.blobData.arrayBuffer();
        buffer = _appendBuffer(
            buffer.length === 0 ? new Uint8Array(buffer) : buffer,
            new Uint8Array(buf)
        );

        if ((buffer.byteLength >= BUFFER_SIZE) || (!isRecording && numParts !== 0)) {

            isMultiPartUploading = true;

            let partContent = buffer.buffer;
            bufferLength = 0;
            buffer = [];
            buffer.length = 0;

            if (presignedUrlsList.length === numParts) {
                startNumber = numParts + 1;
                endNumber = numParts + urlBuffer;
                const urls = await this.getSignedUrl(
                    startNumber,
                    endNumber,
                    fileNamePath,
                    uploadId
                );

                presignedUrlsList = [...presignedUrlsList, ...urls];
            }

            const partNumber = ++numParts;
            progressBlobs[partNumber] = 0;

            const options = {
                headers: {
                    partNumber: partNumber,
                    Accept: "application/json",
                    Expires: 60,
                    "Content-Type": "video/mp4",
                    "Content-Encoding": "UTF-8",
                },
                onUploadProgress: (progressEvent) => {
                    const {loaded, total} = progressEvent;
                    const percentCompleted = Math.floor((loaded / total) * 100);
                    progressBlobs[partNumber] = percentCompleted;

                    if (!isRecording) {
                        let sum = 0;
                        for (const obj in progressBlobs) {
                            sum = sum + progressBlobs[obj];
                        }
                        percentage = (sum / (numParts * 100)) * 100;
                        if (percentage === 100) {
                            localStorage.setItem("isUploading", "false");
                        }
                        chrome.runtime.sendMessage({percentage});
                    }
                    sum = 0;
                },
                partNumber: partNumber,
                maxContentLength: 100000000,
                maxBodyLength: 1000000000,
            };
            const url = presignedUrlsList[partNumber - 1];
            axios.put(url, partContent, options).then(async (resp) => {
                const EtagHeader = resp.headers.etag;
                const uploadPartDetails = {
                    PartNumber: partNumber,
                };

                uploadPartDetails.ETag = EtagHeader;
                multiUploadArray.push(uploadPartDetails);

                if (
                    numParts === multiUploadArray.length &&
                    this.isRecording === false
                ) {
                    multiUploadArray = multiUploadArray.sort(
                        (a, b) => parseFloat(a.PartNumber) - parseFloat(b.PartNumber)
                    );
                    numParts = 0;
                    this.completeUploadFile(
                        fileNamePath,
                        uploadId,
                        multiUploadArray
                    );
                }
            });
        }
    } catch (error) {
        localStorage.setItem("isUploading", "false");
        console.log(error);
    }
}

function mergeTypedArrays(a, b) {
    // Checks for truthy values on both arrays
    if (!a && !b) throw "Please specify valid arguments for parameters a and b.";

    // Checks for truthy values or empty arrays on each argument
    // to avoid the unnecessary construction of a new array and
    // the type comparison
    if (!b || b.length === 0) return a;
    if (!a || a.length === 0) return b;

    // Make sure that both typed arrays are of the same type
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b))
        throw "The types of the two arguments passed for parameters a and b do not match.";

    var c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);

    return c;
}

/*
==================================================================
Append Blob Buffers
==================================================================
*/
function _appendBuffer(buffer1, buffer2) {
    if (!buffer1) {
        return buffer2;
    }
    var concatArray = new Uint8Array([...buffer1, ...buffer2]);
    return concatArray;
}

/*
==================================================================
Fetch upload id
==================================================================
*/
async function getUploadId(fileName) {
    try {
        const ttl = 20 * 60 * 1000; // 20min = 20 x 60 x (1000ms or 1s)
        const body = {
            fileName: fileName,
        };

        const resp = await axios({
            method: "post",
            url: baseURL + "/SessionFileUpload/getUploadId",
            data: body,

            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            maxContentLength: 100000000,
            maxBodyLength: 1000000000,
        });

        return resp.data.result.result;
    } catch (err) {
        localStorage.setItem("isRecording", "false");
        localStorage.setItem("isUploading", "false");

        console.log(err);
    }
}

/*
==================================================================
Call Complete Multipart Upload file and trigger headless browser
==================================================================
*/
async function completeUploadFile(fileName, uploadId, partList) {
    try {
        const ttl = 20 * 60 * 1000; // 20min = 20 x 60 x (1000ms or 1s)

        sessionId = localStorage.getItem("currentSession");

        const body = {
            fileName: fileName,
            uploadId: uploadId,
            sessionId: sessionId,
            partList: partList,
            //  Expires: expires
        };

        const resp = await axios({
            method: "post",
            url: baseURL + "/SessionFileUpload/CompleteMultipartUpload",
            data: body,

            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            maxContentLength: 100000000,
            maxBodyLength: 1000000000,
        });
        initHeadLessBrowserRunCount++;
        let token = localStorage.getItem("auth_token");
        if (initHeadLessBrowserRunCount === 2) {
            await axios({
                method: "GET",
                url: baseURL + "/HeadlessBrowser?sessionId=" + sessionId,
                data: body,

                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                maxContentLength: 100000000,
                maxBodyLength: 1000000000,
            });
            resetValuesToInitialState();
        }

        chrome.runtime.sendMessage({completed: true});
        localStorage.setItem("isUploading", "false");

        return resp.data.result.result;
    } catch (err) {
        localStorage.setItem("isUploading", "false");
        console.log(err);
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

/*
==================================================================
Upload events using Multipart Upload
==================================================================
*/
async function uploadMultipartEventData(events, filePath) {
    try {
        const file = JSON.stringify(events);

        const uploadId = await this.getUploadId(filePath);

        const chunkSize = 6000000; // 10MiB
        const chunkCount = Math.floor(file.length / chunkSize) + 1;

        const multiUploadArray = [];
        const preSignedUrl = await this.getSignedUrl(
            1,
            chunkCount,
            filePath,
            uploadId
        );
        for (let uploadCount = 1; uploadCount < chunkCount + 1; uploadCount++) {
            const start = (uploadCount - 1) * chunkSize;
            const end = uploadCount * chunkSize;
            let fileBlob =
                uploadCount < chunkCount ? file.slice(start, end) : file.slice(start);
            const nextS = (uploadCount + 1 - 1) * chunkSize;
            const nextE = (uploadCount + 1) * chunkSize;
            const nextBlob =
                uploadCount + 1 < chunkCount
                    ? file.slice(nextS, nextE)
                    : file.slice(nextS);
            if (nextBlob.length < chunkSize) {
                fileBlob = fileBlob.concat(nextBlob);
            }


            // Start sending files to S3 part by part
            chrome.runtime.sendMessage({percentage: 80});
            const uploadChunck = await fetch(preSignedUrl[uploadCount - 1], {
                method: "PUT",
                body: fileBlob,
            });

            const EtagHeader = uploadChunck.headers.get("ETag");

            const uploadPartDetails = {
                ETag: EtagHeader,
                PartNumber: uploadCount,
            };
            if (fileBlob.length > chunkSize) {
                ++uploadCount;
            }

            multiUploadArray.push(uploadPartDetails);
        }
        chrome.runtime.sendMessage({percentage: 80});
        await this.completeUploadFile(filePath, uploadId, multiUploadArray);
        chrome.runtime.sendMessage({percentage: 100});
        chrome.runtime.sendMessage({completed: true});
        localStorage.setItem("isUploading", "false");
    } catch (err) {
        console.log(err, err.stack);
        localStorage.setItem("isUploading", "false");
    }
}

/*
==================================================================
Upload Files directly on s3 if file size id less than 5 mb
==================================================================
*/
async function uploadVideoToS3(filename, contents) {
    try {
        let sessionId = localStorage.getItem("currentSession");

        let formData = new FormData();
        formData.append("File", contents);
        formData.append("FileName", filename);
        formData.append("SessionId", sessionId);

        const resp = await axios({
            method: "post",
            url: baseURL + "/SessionFileUpload/UploadFileTOS3",
            data: formData,

            headers: {
                Accept: "application/json",
                "Content-Type": "multipart/form-data",
            },
            maxContentLength: 100000000,
            maxBodyLength: 1000000000,
        });
        if (isMultiPartUploading && initHeadLessBrowserRunCount === 0) {
            chrome.runtime.sendMessage({percentage: 65});
        }
        initHeadLessBrowserRunCount++;
        let token = localStorage.getItem("auth_token");

        if (initHeadLessBrowserRunCount === 2) {
            await axios({
                method: "GET",
                url: baseURL + "/HeadlessBrowser?sessionId=" + sessionId,
                data: {},

                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                maxContentLength: 100000000,
                maxBodyLength: 1000000000,
            });
            chrome.runtime.sendMessage({percentage: 100});
            chrome.runtime.sendMessage({completed: true});
            localStorage.setItem("isUploading", "false");
            resetValuesToInitialState();
        }


        return resp.data.result.result;
    } catch (error) {
        localStorage.setItem("isUploading", "false");
        localStorage.setItem("isRecording", "false");
        console.log(error);
    }
}

function resetValuesToInitialState() {
    chrome.browserAction.setIcon({
        path: "epilogue.png",
    });
    start = 0;
    end = urlBuffer;
    presignedUrlsArray = [];

    uploadId = "";
    dataEvents = [];
    progressBlobs = {};

    buffer = [];
    buff = null;
    bufferLength = 0;
    multiUploadArray = [];
    startNumber = 1;
    endNumber = 16;
    isMultiPartUploading = false;
    initHeadLessBrowserRunCount = 0;
}

/*
==================================================================
Get presigned URLs default is 15
==================================================================
*/
async function getSignedUrl(start, end, fileName, uploadId) {
    try {
        const body = {
            fileName: fileName,
            uploadId: uploadId,
            start,
            end,
        };

        const resp = await axios({
            method: "post",
            url: baseURL + "/SessionFileUpload/GetSignedUrl",
            data: body,

            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            maxContentLength: 100000000,
            maxBodyLength: 1000000000,
        });
        return resp.data.result.result;
    } catch (error) {
        localStorage.setItem("isUploading", "false");
        localStorage.setItem("isRecording", "false");
        console.log(error);
    }
}

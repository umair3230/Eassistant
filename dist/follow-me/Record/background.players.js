var videoPlayers = [];

function initVideoPlayer(stream) {
    var videoPlayer = document.createElement('video');
    videoPlayer.srcObject = stream;
    videoPlayers.push(videoPlayer);
}

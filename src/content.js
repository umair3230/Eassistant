chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    console.log(request, sender, sendResponse);
    sendResponse('Test '+JSON.stringify("request"));
    if(request.message === 'clicked_browser_action' || request.message === 'closePanel'){
        console.log('open popup if not logged in');
        toggleSidePanel();
    }
    
});

var sidePanel = document.createElement('iframe'); 
sidePanel.src = chrome.runtime.getURL("index.html");
var att = document.createAttribute("class");
att.value = "sidebar__panel";
sidePanel.setAttributeNode(att);

function toggleSidePanel(){
    var ifr = document.querySelector('sidebar__panel');
    if(ifr){
        document.body.removeChild(ifr);
        ifr.style.width = "0px";
    }else{
        document.body.appendChild(sidePanel);
        sidePanel.style.width = "350px";
    }
    
}

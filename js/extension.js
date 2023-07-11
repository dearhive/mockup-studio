/**
 * Created by Deepak on 1/31/2016.
 */
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.runtime.openOptionsPage();
});

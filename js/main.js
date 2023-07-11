/**
 * @preserve Copyright 2016, Deepak Ghimire.  All rights reserved.
 */
"use strict";
var deip = deip || {};

deip.isDevelopment = window.location.href.indexOf("localhost/deip") > -1;
deip.isOnlineDemo = window.location.href.indexOf("mockup.deipgroup.com") > -1;

deip.isChrome = (window.chrome !== void 0);
deip.isApp = (deip.isChrome
    ? (window.chrome.app.runtime !== void 0)
    : false);
deip.isExtension = (deip.isChrome
    ? (window.chrome.browserAction !== void 0)
    : false);
deip.actionType = (deip.isApp ? "App-" : (deip.isExtension ? "Ext-" : "Web-"));


deip.send = function () {

};
deip.sendEvent = function (category, action, label) {
    if (deip.isApp) {
        if (tracker !== void 0)
            tracker.sendEvent(category, action, label);
    }
    else{
        if (window.ga !== void 0)
            window.ga('send', 'event', category, action, label);
    }
};
var service, tracker, out;

function initAnalyticsConfig(config) {
    config.setTrackingPermitted(true);
}

function startApp() {
    // Initialize the Analytics service object with the name of your app.
    service = analytics.getService('MOCKUP');
    service.getConfig().addCallback(initAnalyticsConfig);

    // Get a Tracker using your Google Analytics app Tracking ID.
    tracker = service.getTracker('UA-40859319-2');

    tracker.sendAppView('Editor');
    //deip.sendEvent("App", deip.actionType, 'App-Load');//shifted to menu load

}

if (!Detector.webgl) {

    if (deip.isApp) {
        swal({
            title: "WebGL Context Lost!",
            text: "The WebGL had crashed and not reloaded properly. You'll need to restart the application.. and maybe Google Chrome too..",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Close App",
            closeOnConfirm: true
        }, function (isConfirm) {
            if (isConfirm) {
                window.close();
            }
        });
    }
    else {
        $("#webgl_notice").css("display", "block");
    }
}
if (!deip.isChrome) $("#chrome_notice").css("display", "block");

if (deip.isApp) {
    var appAnalytics = document.createElement("script");
    appAnalytics.type = "text/javascript";
    appAnalytics.src = "js/libs/google-analytics-bundle.js";
    appAnalytics.async = 1;
    var referenceNode = document.getElementsByTagName("script")[0];
    referenceNode.parentNode.insertBefore(appAnalytics, referenceNode);

}
else if (deip.isExtension) {
// Standard Google Universal Analytics code
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // Note: https protocol here

    ga('create', 'UA-40859319-2', 'auto');
    ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
    ga('require', 'displayfeatures');
    ga('send', 'pageview', '/index.html');

    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://apis.google.com/js/api.js?onload=onApiLoad";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'google-api'));

}
else {
    if (!deip.isDevelopment) {
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments)
            }, i[r].l = new Date();
            a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m)
        })(window,document,"script","//www.google-analytics.com/analytics.js","ga");

        ga('create', 'UA-40859319-2', 'auto');
        ga('send', 'pageview');
        //deip.sendEvent("App", deip.actionType, 'Web-Load');
    }

    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.5";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
}
function onApiLoad(){
    if(deip.isFull==true) {
        gapi.load('auth', {
            'callback': function () {

            }
        });
        gapi.load('picker');
        gapi.load('client', {
            'callback': function () {
                gapi.client.load("drive", "v2");
                editor.user.signIn(false).then(function (token) {
                    editor.user.updateUser();
                }, function (error) {
                    console.log("User not logged in. " + (error == undef ? "" : error))
                });
            }
        });
    }
}

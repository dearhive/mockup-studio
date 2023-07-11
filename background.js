chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'state': "normal",
      frame: 'none',
      minWidth : 1200,
      minHeight: 740
  });
});
//(function (i, s, o, g, r, a, m) {
//    i['GoogleAnalyticsObject'] = r;
//    i[r] = i[r] || function () {
//        (i[r].q = i[r].q || []).push(arguments)
//    }, i[r].l = 1 * new Date();
//    a = s.createElement(o),
//            m = s.getElementsByTagName(o)[0];
//    a.async = 1;
//    a.src = g;
//    m.parentNode.insertBefore(a, m)
//})(window, document, 'script', 'http://www.google-analytics.com/analytics.js', 'ga');
//
//ga('create', 'UA-40859319-2', 'auto');
//ga('send', 'pageview');

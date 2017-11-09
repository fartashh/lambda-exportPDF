var system = require('system');
var page = require('webpage').create();

page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

var url = system.args[1];
var file_name = system.args[2]
var margin = system.args[3];

page.paperSize = {
    format: 'A2',
    orientation: 'portrait',
    margin:  JSON.parse(margin)
};

page.evaluate(function () {
    var style = document.createElement('style');
    style.innerHTML = '.card-padding{padding-top: 0;padding-bottom: 0;}';
    document.body.appendChild(style);
})

page.open(url, function start(status) {
    window.setTimeout(function () {
        page.render(file_name, {format: 'pdf'});
        system.stdout.write(file_name)
        phantom.exit();
    }, 5000);
});

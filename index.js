var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');
var fs = require('fs');
/********** CONFIGS **********/

var BUCKET_NAME = 'BUCKET_NAME';
var WEBPAGE = '';
var PHANTOM_BINARY = 'phantomjs';

/********** HELPERS **********/

var filepath = function (url) {
    var tokens = url.split('/')
    var l = tokens.length
    return tokens[l - 2] + "_" + tokens[l - 1].split('?')[0] + ".pdf"
}
var s3 = new AWS.S3();

var save_to_s3 = function (payload, key, context) {
    var param = {
        ACL: 'public-read',
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: 'application/pdf',
        Body: payload
    };
    s3.upload(param, function (err, data) {
        if (err) {
            context.fail(err);
        } else {
            fs.unlink(path.join('/tmp', key));
            context.succeed("https://s3.amazonaws.com/" + BUCKET_NAME + "/" + filepath(url));
        }
    });
};

/********** MAIN **********/

exports.handler = function (event, context) {

    url = event.url + "?is_print=true"
    margin = event.margin || {"top": "1.5cm", "bottom": "2.5cm"}

    // Set the path as described here: https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

    // Set the path to the phantomjs binary
    var phantomPath = path.join(__dirname, PHANTOM_BINARY);

    // Arguments for the phantom script
    var processArgs = [
        path.join(__dirname, 'phantom-script.js'),
        url,
        path.join('/tmp', filepath(url)),
        JSON.stringify(margin)
    ];

    var params = {
        Bucket: BUCKET_NAME,
        Key: filepath(url)
    };

    // Launch the child process
    childProcess.execFile(phantomPath, processArgs, {maxBuffer: 1024 * 5000}, function (error, stdout, stderr) {
        if (error) {
            context.fail(error);
            return;
        }
        if (stderr) {
            context.fail(error);
            return;
        }
        var file_name = stdout;

        fs.readFile(file_name, function (err, data) {
            if (err) {
                context.fail(err);
            }
            else {
                var buffer = new Buffer(data, 'binary');
                save_to_s3(buffer, filepath(url), context);
            }
        });
    });
}


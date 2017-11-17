// through2 是一个对 node 的 transform streams 简单封装
var through = require('through2');
var gutil = require('gulp-util');

var request = require('request');
var path = require('path');
var fs = require('fs');
var skipImgs = [],
    compressInfos = [],
    args = {};

// 常量
var PLUGIN_NAME = 'gulp-tinypng-nokey';
var log = gutil.log.bind(null, PLUGIN_NAME);

// 插件级别函数 (处理文件)
function gulpPrefixer(arguments) {
    args = arguments;

    // 创建一个让每个文件通过的 stream 通道
    var stream = through.obj(function (file, enc, callback) {
        var self = this;

        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(createError(file, 'Streaming not supported'));
        }

        if (file.isBuffer()) {
            tinypng(file, function (data) {
                if (!data) {
                    return callback(null);
                }

                let tinyFile = file.clone();
                tinyFile.contents = data;
                return callback(null, tinyFile);
            });
        }
    });

    stream.on('error', function (err) {
        log(': error ', gutil.colors.red(err));
    })
        .on('end', function () {
            var str = '',
                total = 0, orginTotal = 0,
                ratio;

            compressInfos.forEach(function(e) {
                total += e.size;
                orginTotal += e.originSize;
            });

            ratio = ( parseFloat(total/orginTotal, 10).toFixed(4) * 100 || 0) + '%';

            str += ': ' + gutil.colors.blue('[compress completed] ');
            str += 'skiped: ' + gutil.colors.red(skipImgs.length) + ' imgs, ';
            str += 'compressed: ' + gutil.colors.green(compressInfos.length) + ' imgs, ';
            str += 'totalSize: ' + gutil.colors.green(ratio);
            log(str);
        });

    return stream;
};

function tinypng(file, callback) {
    log(': [tinypng request]', file.relative);
    request({
        url: 'https://tinypng.com/web/shrink',
        method: "post",
        headers: {
            "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Encoding" : "gzip, deflate",
            "Accept-Language" : "zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
            "Cache-Control" : "no-cache",
            "Pragma" : "no-cache",
            "Connection"  : "keep-alive",
            "Host" : "tinypng.com",
            "DNT" : 1,
            "Referer" : "https://tinypng.com/",
            "User-Agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
        },
        body: file.contents
    }, function(error, response, body) {
        var results, filename;

        if(!error) {
            filename = path.basename(file.path);
            try {
                results = JSON.parse(body);
            } catch (e) {
                log('[error]: ', filename + '\n' + body);
                results = {};
            }

            if(results.output && results.output.url) {
                request.get({ url: results.output.url, encoding: null }, function (err, res, body) {
                    var output = results.output;

                    if (err) {
                        skipImgs.push(filename);
                        log('[error]: ', filename + ' ' + err);
                    } else {
                        log(': [compressing]', gutil.colors.green('Ok ') +
                            file.relative
                            + gutil.colors.green(' (' + (output.ratio * 100).toFixed(1) + '%)'));

                        if (args.compareDir) {
                            fs.stat(path.join(args.compareDir, file.relative), (err, stats) => {
                                if (err) {
                                    throw error;
                                }

                                if (stats.size > output.size) {
                                    compressInfos.push({
                                        name: filename,
                                        size: output.size,
                                        ratio: 1 - output.ratio,
                                        originSize: results.input.size
                                    });
                                    callback(new Buffer(body));
                                } else {
                                    skipImgs.push(filename);
                                    log(': [after compression] ' +
                                        file.relative
                                        + gutil.colors.yellow(' the size of the output file is larger'));
                                    callback(null);
                                }
                            });
                        }
                    }

                    callback(err ? null : new Buffer(body));
                });
            } else {
                log('[error]: ', filename + ' ' + results.message);
                callback(null);
            }
        } else {
            skipImgs.push(filename);
            callback(null);
        }
    });
};

module.exports = gulpPrefixer;
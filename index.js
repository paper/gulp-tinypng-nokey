// through2 是一个对 node 的 transform streams 简单封装
var through = require('through2');
var gutil = require('gulp-util');

var mkdirp = require('mkdirp');
var rmdir = require( 'rmdir' );
var request = require('request');
var path = require('path');
var fs = require('fs');

// 常量
const PLUGIN_NAME = 'gulp-tinypng-nokey';
const TEMP_DIR = '.gulp/tinypng-nokey-temp-dir/';

var cleanTemp = function() {
    rmdir(TEMP_DIR, function ( err, dirs, files ){
        mkdirp(TEMP_DIR, function (err) {
            if (err){ console.error('Error creating temp folder'); }
        });
    });
};

var download = function(uri, filename, complete){
    request.head(uri, function(err, res, body){
        request({url: uri, strictSSL: false})
            .pipe(fs.createWriteStream(TEMP_DIR + filename))
            .on('close', function() {
                complete();
            });
    });
};

// 插件级别函数 (处理文件)
function gulpPrefixer(prefixText) {
    cleanTemp();

    // 创建一个让每个文件通过的 stream 通道
    var stream = through.obj(function(file, enc, callback) {
        var self = this;
        
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(createError(file, 'Streaming not supported'));
        }
 
        if (file.isBuffer()) {
            tinypng(file, function(data) {
                file.contents = data;
                self.push(file);
                
                gutil.log(PLUGIN_NAME + ': [compressing]', gutil.colors.green('Ok~ ') + 
                    file.relative + gutil.colors.gray(' (done)'));
                
                return callback();
            });
        }
        
    });
    
    return stream;
};

function tinypng(file, callback) {
   
    request({
        url: 'https://tinypng.com/site/shrink',
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
            "Pragma" : "no-cache",
            "Referer" : "https://tinypng.com/",
            "User-Agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
        },
        body: file.contents
    }, function(error, response, body) {
        var results, filename;
        
        if(!error) {
            filename = path.basename(file.path);
            results = JSON.parse(body);
          
            if(results.output && results.output.url) {
                download(results.output.url, filename, function() {
                    fs.readFile(TEMP_DIR + filename, function(err, data){
                        if (err) {
                            gutil.log(PLUGIN_NAME + '[error]: ', err);
                        }
                        callback(data);
                    });
                });
            } else {
                gutil.log(PLUGIN_NAME + '[error]: ', results.message);
            }
        }
    });
};

module.exports = gulpPrefixer;
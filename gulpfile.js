'use strict';

var gulp = require('gulp');

// 安装包后，就是 require('gulp-tinypng-nokey')
var tiny = require('./index');

// 可以直接在当前目录进行测试
gulp.task('tinypng-test', function(cb) {
    gulp.src('test/img/*')
        .pipe(tiny())
        .pipe(gulp.dest('test/dist/img'));
});
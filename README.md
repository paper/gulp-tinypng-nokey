# gulp-tinypng-nokey
模拟用户上传和下载的行为，来得到压缩图片，突破使用官网api每月500张限制

#### Install
```
$ npm install --save-dev gulp-tinypng-nokey
```

#### How to use
```
var gulp = require('gulp');
var tiny = require('gulp-tinypng-nokey');

gulp.task('tinypng', function(cb) {
    gulp.src('src/*')
        .pipe(tiny())
        .pipe(gulp.dest('dist'));
});
```

#### Intro
尽量放到任务的最后一步，因为这个过程是要上传图片，再下载图片的，和网络稳定有关

#### Reference
https://github.com/creativeaura/gulp-tinypng  
http://www.gulpjs.com.cn/docs/writing-a-plugin/guidelines/
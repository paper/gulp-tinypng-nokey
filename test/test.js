var gulp = require('gulp');
var tiny = require('../index.js');

gulp.src('./*')
    .pipe(tiny())
    .pipe( gulp.dest('./compress') );
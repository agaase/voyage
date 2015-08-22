'use strict';
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        minSuffix: 'min',
        distName: 'opsight',
        cssName: 'index',
        meta: {
            version: '<%= pkg.version %>',
            banner: '/*! opsight.js - v<%= meta.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '* https://github.com/agaase/\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
                'agaase; Licensed MIT */\n',
            css: '/*! opsight.css - v<%= meta.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '* ' + '* Copyright (c) <%= grunt.template.today("yyyy") %> ' + '; Licensed MIT */\n'

        },
        clean: {
            files: ['dist/css','dist/js']
        },
        concat: {
            templateDist: {
                options: {
                    banner: '<%= meta.banner %>',
                    stripBanners: true
                },
                files: {
                    'dist/js/<%= distName %>-<%= meta.version %>.js': ['js/lib/*.js','js/views/base/baseview.js','js/views/base/base-posts.js','js/views/*.js','js/dataop.js','js/uirender.js','js/util.js','js/app.js']
                }
            }
        },
        uglify: {
            target: {
                options: {
                    banner: '<%= meta.banner %>'
                },
                files: {
                    'dist/js/<%= distName %>-<%= meta.version %>.<%= minSuffix %>.js': ['dist/js/<%= distName %>-<%= meta.version %>.js'],
                }
            }
        },
        cssmin : {
            templateDist : {
                options: {
                    banner:'<%= meta.css %>'
                },
                files: {
                    'dist/css/<%= cssName %>.<%= minSuffix %>.css': ['css/index.css']
                }               
            }          
        },
        jshint: {
            beforeconcat: {
                options: {
                    curly: true,
                    eqeqeq: true,
                    immed: true,
                    latedef: true,
                    newcap: true,
                    noarg: true,
                    sub: true,
                    undef: true,
                    boss: true,
                    eqnull: true,
                    globals: {
                        window: true,
                        $: true,
                        jQuery: true,
                        Genwi: true,
                        GENWI: true,
                        console: true,
                        alert: true,
                        setTimeout: true,
                        clearTimeout: true,
                        setInterval: true,
                        clearInterval: true,
                        document: true,
                    }
                },
                src: ['src/*.js']
            }
        }
    });


    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Default task.
    grunt.registerTask('default', ['jshint', 'clean', 'concat', 'uglify','cssmin']);

};
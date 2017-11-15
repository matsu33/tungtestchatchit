/**
 * Created by tung.nguyen on 11/8/2017.
 */
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        vendorPath: 'vendor',
        tmpPath : 'tmp',
        srcPath : 'src',
        mkdir: {
            all: {
                options: {
                    mode: 0777,
                    create: ['<%= tmpPath %>']
                }
            }
        },
        concat: {
            options: {
                separator: ';',
                sourceMap: false
            },
            library: {
                files: {
                    'chatlib.js': [
                        //VENDORS
                        '<%= vendorPath %>/jquery/dist/jquery.js',
                        '<%= vendorPath %>/jquery.cookie/jquery.cookie.js',
                        '<%= vendorPath %>/socket.io-client/dist/socket.io.js'
                    ]
                }
            }
        },
        sass: {
            options: {
                style: 'nested',
                sourcemap: 'none',
                quiet: true,
                update: false,
                trace: true,
                noCache: true
            },
            dist: {
                files: [
                    {
                        '<%= tmpPath %>/css/reset.css': '<%= vendorPath %>/css-reset-and-normalize-sass/scss/flavored-reset-and-normalize.scss',
                        '<%= tmpPath %>/css/app.css': '<%= srcPath %>/scss/*.scss'
                    }
                ]
            }
        },
        cssmin: { // minifying css task
            dist: {
                files: {
                    'reset.min.css': '<%= tmpPath %>/css/reset.css',
                    'app.min.css': '<%= tmpPath %>/css/app.css'
                }
            }
        },
        clean: {
            tempDir: {
                src: ['<%= tmpPath %>/*'],
                options: {
                    force: true
                }
            },
            vendorDir: {
                src: ['<%= vendorPath %>/*'],
                options: {
                    force: true
                }
            }
        },
        watch: {
//            scripts: {
//                files: ['<%= srcPath %>/js/**/*.js', '<%= vendorPath %>/**/*.js'],
//                tasks: ['concat'],
//                options: {
//                    spawn: false
//                }
//            },
            css: {
                files: ['<%= srcPath %>/scss/*.scss'],
                tasks: ['sass', 'cssmin', 'clean:tempDir']
            }/*,
             cam: {
             files: ['<%= srcPath %>/scss/!**!/!*.scss'],
             tasks: ['sass', 'cssmin:xtcam']
             }*/
        },
    });

    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['mkdir', 'concat', 'sass', 'cssmin', 'clean:tempDir', 'watch']);
//    grunt.registerTask('default', ['mkdir', 'concat', 'sass', 'cssmin']);

};
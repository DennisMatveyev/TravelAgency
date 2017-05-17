module.exports = function(grunt){
// Download plugins
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-exec',
        'grunt-contrib-less',
        'grunt-contrib-uglify',
        'grunt-contrib-cssmin',
        'grunt-hashres',
        'grunt-lint-pattern'
    ].forEach(function(task){
        grunt.loadNpmTasks(task);
    });
// Configure plugins
    grunt.initConfig({
        cafemocha: {
            all: { src: 'qa/tests-*.js', options: { ui: 'tdd' } }
        },
        jshint: {
            app: ['app.js', 'public/js/**/*.js','lib/**/*.js'],
            qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js']
        },
        exec: {
            linkchecker:
                { cmd: 'linkchecker http://localhost:3000' }
        },
        less: {
            development: {
                options: {
                    customFunctions: {
                        static: function(lessObject, name) {
                            return 'url("' +
                                require('./lib/static.js').map(name.value) +
                                '")';
                        }
                    }
                },
                files: {
                    'public/css/main.css': 'less/main.less',
                    'public/css/cart.css': 'less/cart.less'
                }
            }
        },
        uglify: {
            all: {
                files: {
                    'public/js/app.min.js': ['public/js/**/*.js']
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'public/css/app.css': ['public/css/**/*.css',
                        '!public/css/app*.css']
                }
            },
            minify: {
                src: 'public/css/app.css',
                dest: 'public/css/app.min.css'
            }
        },
        hashres: {
            options: {
                fileNameFormat: '${name}.${hash}.${ext}'
            },
            all: {
                src: [
                    'public/js/app.min.js',
                    'public/css/app.min.css'
                ],
                dest: [
                    // 'views/layouts/main.handlebars'
                    'config.js'
                ]
            }
        },
        lint_pattern: {
            view_statics: {
                options: {
                    rules: [
                        {
                            pattern: /<link [^>]*href=["'](?!\{\{static )/,
                            message: 'В link обнаружен статический ' +
                            'ресурс, которому не установлено соответствие.'
                        },
                        {
                            pattern: /<script [^>]*src=["'](?!\{\{static )/,
                            message: 'В script обнаружен статический ' +
                            'ресурс, которому не установлено соответствие.'
                        },
                        {
                            pattern: /<img [^>]*src=["'](?!\{\{static )/,
                            message: 'В <img> обнаружен статический ' +
                            'ресурс, которому не установлено соответствие.'
                        }
                    ]
                },
                files: {
                    src: [
                        'views/**/*.handlebars'
                    ]
                }
            },
            css_statics: {
                options: {
                    rules: [
                        {
                            pattern: /url\(/,
                            message: 'В свойстве LESS обнаружен статический ' +
                            'ресурс, которому не установлено соответствие.'
                        }
                    ]
                },
                files: {
                    src: [
                        'less/**/*.less'
                    ]
                }
            }
        }
    });
// Register tasks
    grunt.registerTask('default', ['cafemocha','jshint','exec', 'lint_pattern']);
    grunt.registerTask('static', ['less', 'cssmin', 'uglify', 'hashres']);
};

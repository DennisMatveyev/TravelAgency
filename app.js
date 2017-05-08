var express = require('express');
var formidable = require('formidable' );

var fortunes = require('./lib/fortunes.js');
var weatherData = require('./lib/weather.js');
var credentials = require('./credentials.js');

var app = express();

// template engine Handlebars setting with custom helper
var handlebars = require('express-handlebars').create({ defaultLayout:'main',
                                                        helpers: {
                                                            section: function(name, options){
                                                                if(!this._sections) this._sections = {};
                                                                this._sections[name] = options.fn(this);
                                                                return null;
                                                            }
                                                        }
                                                      });

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

// middleware for decoding URL encoded
app.use(require('body-parser').urlencoded({ extended: true }));

// middlewares for cookies
app.use(require('cookie-parser')(credentials.cookieSecret));
// and session; in this case session storage is in memory by default
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret
}));

// middleware for implementing partial template
app.use(function(req, res, next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = weatherData.getWeatherData();
    next();
});

// middleware for tests; recognizes ?test=1 in the query
app.use(function(req, res, next){
    res.locals.showTests = app.get('env') !== 'production' &&
        req.query.test === '1';
    next();
});

// routes
app.get('/', function(req, res){
    res.render('home');
});

app.get('/about', function(req, res){
    res.render('about', { fortune: fortunes.getFortune(),
                          pageTestScript: '/qa/tests-about.js'});
});

app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
});

// page with subsribe form
app.get('/newsletter', function(req, res){
    res.render('newsletter', { csrf: 'CSRF token goes here' });
});
// and view for processing this form
// app.post('/process' , function(req, res){
//     console.log('Form (from querystring): ' + req.query.form);
//     console.log('CSRF token (from hidden form field): ' + req.body._csrf);
//     console.log('Name (from visible form field): ' + req.body.name);
//     console.log('Email (from visible form field): ' + req.body.email);
//     res.redirect(303, '/thank-you' );
// });
// and AJAX alternative for processing this form
app.post('/process', function(req, res){
    if(req.xhr || req.accepts('json,html') === 'json' ){
// если здесь есть ошибка, то мы должны отправить { error: 'описание ошибки' }
        res.send({ success: true });
    } else {
// если бы была ошибка, нам нужно было бы перенаправлять на страницу ошибки
        res.redirect(303, '/thank-you' );
    }
});

// route for getting page with FILE uploading form
app.get('/contest/vacation-photo', function(req, res){
    var now = new Date();
    res.render('contest/vacation-photo', {
                                          year: now.getFullYear(),
                                          month: now. getMonth()
                                         });
});
// and view for processing file uploading
app.post('/contest/vacation-photo/:year/:month' , function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err) return res.redirect(303, '/error' );
        console.log('received fields:' );
        console.log(fields);
        console.log('received files:' );
        console.log(files);
        res.redirect(303, '/thank-you' );
    });
});

// routes for demo of client-side Handlebars realization
app.get('/nursery-rhyme', function(req, res){
    res.render('nursery-rhyme');
});
app.get('/ajax/nursery-rhyme', function(req, res){
    res.json({
        animal: 'бельчонок',
        bodyPart: 'хвост',
        adjective: 'пушистый',
        noun: 'облако'
    });
});

// 404
app.use(function(req, res){
    res.status(404);
    res.render('404');
});

// 500
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log( 'Express is running at http://localhost:' +
        app.get('port') + '; press Ctrl+C for exiting.' );
});

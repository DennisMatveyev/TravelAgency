var express = require('express');
var formidable = require('formidable' );
var connect = require('connect');
// var nodemailer = require('nodemailer');

var fortunes = require('./lib/fortunes.js');
var weatherData = require('./lib/weather.js');
var cartValidation = require('./lib/cartValidation.js');
var credentials = require('./credentials.js');

var app = express();

// var mailTransport = nodemailer.createTransport('SMTP',{
//     service: 'Gmail',
//     auth: {
//         user: credentials.gmail.user,
//         pass: credentials.gmail.password
//     }
// });

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

// interception of exceptions uncaught via so-called domains
// must be placed before other middlewares and routes
app.use(function(req, res, next){
    // создаем домен для этого запроса
    var domain = require('domain').create();
    // обрабатываем ошибки на этом домене
    domain.on('error', function(err){
        console.error('ПЕРЕХВАЧЕНА ОШИБКА ДОМЕНА\n', err.stack);
        try {
            // Отказобезопасный останов через 5 секунд
            setTimeout(function(){
                console.error(' Отказобезопасный останов.');
                process.exit(1);
            }, 5000);
            // Отключение от кластера
            var worker = require('cluster').worker;
            if(worker) worker.disconnect();
            // Прекращение принятия новых запросов
            server.close();
            try {
                // Попытка использовать маршрутизацию ошибок Express
                next(err);
            } catch(err){
                // Если маршрутизация ошибок Express не сработала,
                // пробуем выдать текстовый ответ Node
                console.error('Сбой механизма обработки ошибок ' +
                    'Express .\n', err.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Ошибка сервера.');
            }
        } catch(err){
            console.error('Не могу отправить ответ 500.\n', err.stack);
        }
    });
    // Добавляем объекты запроса и ответа в домен
    domain.add(req);
    domain.add(res);
    // Выполняем оставшуюся часть цепочки запроса в домене
    domain.run(next);
});

// serving static
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

// choose logging tool depending on mode
switch(app.get('env')){
    case 'development':
        // сжатое многоцветное журналирование для разработки
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // модуль 'express-logger' поддерживает ежедневное
        // чередование файлов журналов
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}

// our custom middleware module; see below more advanced usage
// app.use(require('./lib/tourRequiresWaiver.js'));

// custom middleware module for cart validation
app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

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

// middleware for flash messages
app.use(function(req, res, next){
    // Если имеется экстренное сообщение,
    // переместим его в контекст и удалим
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

// middleware for checking cluster works
// app.use(function(req,res,next){
//     var cluster = require('cluster');
//     if(cluster.isWorker) {
//         console.log('Исполнитель %d получил запрос', cluster.worker.id);
//     }
// });


// ROUTES
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

// Немного измененная версия официального регулярного выражения
// W3C HTML5 для электронной почты:
// https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
    '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
    '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$');

app.post('/newsletter', function(req, res){
    var name = req.body.name || '', email = req.body.email || '';

    if(!email.match(VALID_EMAIL_REGEX)) {
        if(req.xhr) return res.json({ error: 'Некорректный адрес электронной почты.' });
        req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'Введенный вами адрес электронной почты некорректен.'
        };
        return res.redirect(303, '/newsletter/archive');
    }

    new NewsletterSignup({ name: name, email: email }).save(function(err) {

        if(err) {
            if(req.xhr) return res.json({ error: 'Ошибка базы данных.' });
            req.session.flash = {
                type: 'danger',
                intro: 'Ошибка базы данных!',
                message: 'Произошла ошибка базы данных. Пожалуйста, попробуйте позднее'
            };
            return res.redirect(303, '/newsletter/archive');
        }

        if(req.xhr) return res.json({ success: true });

        req.session.flash = {
            type: 'success',
            intro: 'Спасибо!',
            message: 'Вы были подписаны на информационный бюллетень.'
        };
        return res.redirect(303, '/newsletter/archive');
    });
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

app.post('/cart/checkout', function(req, res){
    var cart = req.session.cart;
    if(!cart) next(new Error('Корзина не существует.'));
    var name = req.body.name || '', email = req.body.email || '';
// Проверка вводимых данных
    if(!email.match(VALID_EMAIL_REGEX))
        return res.next(new Error('Некорректный адрес электронной почты.'));
// Присваиваем случайный идентификатор корзины;
// При обычных условиях мы бы использовали
// здесь идентификатор из БД
    cart.number = Math.random().toString().replace(/^0\.0*/, '');
    cart.billing = {
        name: name,
        email: email
    };
    // res.render('email/cart-thank-you',
    //     { layout: null, cart: cart }, function(err,html){
    //         if( err ) console.log('ошибка в шаблоне письма');
    //         mailTransport.sendMail({
    //             from: '"EnjoyTravel": info@enjoytravel.com',
    //             to: cart.billing.email,
    //             subject: 'Спасибо за заказ поездки',
    //             html: html,
    //             generateTextFromHtml: true
    //     }, function(err){
    //             if(err) console.error('Не могу отправить подтверждение: ' + err.stack);
    //         });
    //     }
    // );
    res.render('cart-thank-you', { cart: cart });
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
app.use(function(err, req, res, next){
    res.status(404);
    res.render('404 Not Found');
});

// 500
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500 Server Error');
});

// for the purpose of clusterization, app_cluster.js
var server = function() {
    app.listen(app.get('port'), function() {
        console.log( 'Express запущен в режиме ' + app.get('env') +
            ' на http://localhost:' + app.get('port') +
            '; нажмите Ctrl+C для завершения.' );
    });
};

if(require.main === module){
    // Приложение запускается непосредственно;
    // запускаем сервер приложения
    server();
} else {
    // Приложение импортируется как модуль посредством "require"
    // экспортируем функцию для создания сервера
    module.exports = server;
}

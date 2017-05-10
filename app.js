var express = require('express');
var formidable = require('formidable' );
var connect = require('connect');
var fs = require('fs');
var mongoose = require('mongoose');
// var nodemailer = require('nodemailer');

var fortunes = require('./lib/fortunes.js');
var weatherData = require('./lib/weather.js');
var cartValidation = require('./lib/cartValidation.js');
var credentials = require('./credentials.js');
var Vacation = require('./models/vacation.js');

var app = express();

var opts = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};
// we use mlab hosting in our connect
switch(app.get('env')){
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString, opts);
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString, opts);
        break;
    default:
        throw new Error('Unknown environment: ' + app.get('env'));
}

// connect-redis would be better for session storage
var MongoSessionStore = require('session-mongoose')(require('connect')); // connect@2.0; v3 doesn't work
var sessionStore = new MongoSessionStore({
    url: credentials.mongo[app.get('env')].connectionString
});

// processing cookies and using mongodb as session storage
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: sessionStore
}));


// HARDCODE for filling DB
Vacation.find(function(err, vacations){
    if(err) return console.error(err);

    if(vacations.length) return;

    new Vacation({
        name: 'Однодневный тур по реке Худ',
        slug: 'hood-river-day-trip',
        category: 'Однодневный тур',
        sku: 'HR199',
        description: 'Проведите день в плавании по реке Колумбия ' +
                     'и насладитесь сваренным по традиционным рецептам ' +
                     'пивом на реке Худ!',
        priceInCents: 9995,
        tags: ['однодневный тур', 'река худ',
               'плавание', 'виндсерфинг', 'пивоварни'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0
    }).save();

    new Vacation({
        name: 'Отдых в Орегон Коуст',
        slug: 'oregon-coast-getaway',
        category: 'Отдых на выходных',
        sku: 'OC39',
        description: 'Насладитесь океанским воздухом ' +
                     'и причудливыми прибрежными городками!',
        priceInCents: 269995,
        tags: ['отдых на выходных', 'орегон коуст',
               'прогулки по пляжу'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0
    }).save();

    new Vacation({
        name: 'Скалолазание в Бенде',
        slug: 'rock-climbing-in-bend',
        category: 'Приключение',
        sku: 'B99',
        description: 'Пощекочите себе нервы горным восхождением ' +
                     'на пустынной возвышенности.',
        priceInCents: 289995,
        tags: ['отдых на выходных', 'бенд',
               'пустынная возвышенность', 'скалолазание'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'Гид по данному туру в настоящий момент ' +
               'восстанавливается после лыжной травмы.'
    }).save();
});


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

// создаем поддомен "admin"... это должно находиться
// до всех остальных маршрутов
// var admin = express.Router();
// app.use(vhost('admin.*', admin));  // ? require vhost
// // создаем маршруты для "admin"; это можно разместить в любом месте.
// admin.get('/', function(req, res){
//     res.render('admin/home');
// });
// admin.get('/users', function(req, res){
//     res.render('admin/users');
// });

// import all other routes
require('./routes.js')(app);

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

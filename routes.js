var main = require('./routes_handlers/main.js');
var tours = require('./routes_handlers/tours.js');
var newsletter = require('./routes_handlers/newsletter.js');
var contest = require('./routes_handlers/contest.js');
var vacations = require('./routes_handlers/vacations.js');
var cart = require('./routes_handlers/cart.js');

module.exports = function(app){

    app.get('/', main.home);
    app.get('/about', main.about);

    app.get('/tours/hood-river', tours.hoodRiver);
    app.get('/tours/request-group-rate', tours.requestRate);

    // page with subscribe form
    app.get('/newsletter', newsletter.get);
    // and processing this form
    app.post('/newsletter', newsletter.post);
    // and AJAX alternative for processing this form
    app.post('/process', newsletter.postAjax);

    // route for getting page with FILE uploading form
    app.get('/contest/vacation-photo', contest.vacationPhotoForm);
    // and view for processing file uploading
    app.post('/contest/vacation-photo/:year/:month', contest.vacationPhotoUpload);

    // get page with actual vacations
    app.get('/vacations', vacations.actualVacations);
    app.get('/set-currency/:currency', vacations.setCurrency);
    app.get('/notify-me-when-in-season', vacations.getNotifyPage);
    app.post('/notify-me-when-in-season', vacations.postNotifyForm);

    // cart processing
    app.post('/cart/checkout', cart.checkout);

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

};
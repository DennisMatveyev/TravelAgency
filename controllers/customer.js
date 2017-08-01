// Реализация MVC

var Customer = require('../models/customer.js');
var customerViewModel = require('../view_models/customer.js');
// ??? just exports
exports = {
    registerRoutes: function(app) {
        app.get('/customer/:id', this.home);
        app.get('/customer/:id/preferences', this.preferences);
        app.get('/orders/:id', this.orders);
        app.post('/customer/:id/update', this.ajaxUpdate);
    },
    home: function(req, res, next) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); // передать это обработчику 404
            customer.getOrders(function(err, orders) {
                if(err) return next(err);
                res.render('customer/home',
                    customerViewModel(customer, orders));
            });
        });
    },
    preferences: function(req, res, next) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); // передать это обработчику 404
            customer.getOrders(function(err, orders) {
                if(err) return next(err);
                res.render('customer/preferences',
                    customerViewModel(customer, orders));
            });
        });
    },
    orders: function(req, res, next) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); // передать это обработчику 404
            customer.getOrders(function(err, orders) {
                if(err) return next(err);
                res.render('customer/preferences',
                    customerViewModel(customer, orders));
            });
        });
    },
    ajaxUpdate: function(req, res) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); // передать это обработчику 404
            if(req.body.firstName){
                if(typeof req.body.firstName !== 'string' ||
                    req.body.firstName.trim() === '')
                    return res.json({ error: 'Invalid name.'});
                customer.firstName = req.body.firstName;
            }
// и т. д.
            customer.save(function(err) {
                return err ? res.json({ error: 'Ошибка обновления покупателя.' })
                    : res.json({ success: true });
            });
        });
    }
};
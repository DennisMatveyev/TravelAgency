var fortunes = require('../lib/fortunes.js');

exports.home = function(req, res){
    res.render('home');
};

exports.about = function(req, res){
    res.render('about', {
        fortune: fortunes.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
};


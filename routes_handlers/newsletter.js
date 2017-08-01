// Немного измененная версия официального регулярного выражения
// W3C HTML5 для электронной почты:
// https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
    '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
    '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$');

exports.post = function(req, res){
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
};

exports.get = function(req, res){
    res.render('newsletter', { csrf: 'CSRF token goes here' });
};

exports.postAjax = function(req, res){
    if(req.xhr || req.accepts('json,html') === 'json' ){
        // если здесь есть ошибка, то мы должны отправить { error: 'описание ошибки' }
        res.send({ success: true });
    } else {
        // если бы была ошибка, нам нужно было бы перенаправлять на страницу ошибки
        res.redirect(303, '/thank-you' );
    }
};


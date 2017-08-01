exports.checkout = function(req, res){
    var cart = req.session.cart;
    if(!cart) res.next(new Error('Корзина не существует.'));
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
};

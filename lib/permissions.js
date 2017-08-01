module.exports = {
    customerOnly: function(req, res, next){
        if(req.user && req.user.role==='customer') return next();
        // Мы хотим, чтобы при посещении страниц только
        // покупатели знали, что требуется логин
        res.redirect(303, '/unauthorized');
    },
    employeeOnly: function(req, res, next){
        if(req.user && req.user.role==='employee') return next();
        // мы хотим, чтобы неуспех авторизации посещения
        // страниц только для сотрудников был скрытым
        // чтобы потенциальные хакеры не смогли даже
        // узнать, что такая страница существует
        next('route');
    }
};

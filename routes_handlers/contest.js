var formidable = require('formidable' );
var fs = require('fs');

exports.vacationPhotoForm = function(req, res){
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),
        month: now. getMonth()
    });
};

// Проверяем, существует ли каталог
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
    // TODO...
}

exports.vacationPhotoUpload = function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err) {
            res.session.flash = {
                type: 'danger',
                intro: 'Упс!',
                message: 'Во время обработки отправленной Вами формы ' +
                'произошла ошибка. Пожалуйста, попробуйте еще раз.'
            };
            return res.redirect(303, '/contest/vacation-photo');
        }
        var photo = files.photo;
        var dir = vacationPhotoDir + '/' + Date.now();
        var path = dir + '/' + photo.name;
        fs.mkdirSync(dir);
        fs.renameSync(photo.path, dir + '/' + photo.name);
        saveContestEntry('vacation-photo', fields.email,
            req.params.year, req.params.month, path);
        req.session.flash = {
            type: 'success',
            intro: 'Удачи!',
            message: 'Вы стали участником конкурса.'
        };
        return res.redirect(303, '/contest/vacation-photo/entries');
    });
};


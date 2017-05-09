// Example module for sending promo emails
// var emailService = require('./lib/email.js')(credentials);
// emailService.send('customer@gmail.com',
//                     'Сегодня распродажа туров!',
//                     'Налетайте на них, пока не остыли!');

// var nodemailer = require('nodemailer');
//
// module.exports = function(credentials){
//     var mailTransport = nodemailer.createTransport('SMTP',{
//         service: 'Gmail',
//         auth: {
//             user: credentials.gmail.user,
//             pass: credentials.gmail.password
//         }
//     });
//     var from = '<info@enjoytravel.com>';
//     var errorRecipient = 'email@gmail.com';
//     return {
//         send: function(to, subj, body){
//             mailTransport.sendMail({
//                 from: from,
//                 to: to,
//                 subject: subj,
//                 html: body,
//                 generateTextFromHtml: true
//             }, function(err){
//                 if(err) console.error(' Невозможно отправить письмо: '
//                     + err);
//             });
//         },
//         emailError: function(message, filename, exception){
//             var body = '<h1>Site Error</h1>' +
//                 'message:<br><pre>' + message + '</pre><br>';
//             if(exception) body += 'exception:<br><pre>' +
//                 exception + '</pre><br>';
//             if(filename) body += 'filename:<br><pre>' +
//                 filename + '</pre><br>';
//             mailTransport.sendMail({
//                 from: from,
//                 to: errorRecipient,
//                 subject: 'Ошибка сайта',
//                 html: body,
//                 generateTextFromHtml: true
//             }, function(err){
//                 if(err) console.error(' Невозможно отправить письмо: ')
//             });
//         }
//     };
// };
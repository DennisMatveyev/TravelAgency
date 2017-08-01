var fortunes = require('../lib/fortunes.js');
var expect = require('chai').expect;

suite('Тесты печений-предсказаний', function(){
    test('getFortune() должна возвращать предсказание', function(){
        expect(typeof fortunes.getFortune() === 'string');
    });
});
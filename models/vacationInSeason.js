var mongoose = require('mongoose');

var vacationInSeasonSchema = mongoose.Schema({
    email: String,
    skus: [String]
});

var VacationInSeason = mongoose.model('VacationInSeason',
                                               vacationInSeasonSchema);

module.exports = VacationInSeason;

// model for our API
// Поскольку мы хотим модерировать обновления, то не можем позволить API
// просто обновлять исходную запись. Подход будет состоять в создании новой за-
// писи, ссылающейся на исходную (в ее свойстве updateId ). Как только запись будет
// одобрена, мы можем обновить исходную запись информацией из записи с обнов-
// лением, а затем удалить запись с обновлением.
var mongoose = require('mongoose');

var attractionSchema = mongoose.Schema({
    name: String,
    description: String,
    location: { lat: Number, lng: Number },
    history: {
        event: String,
        notes: String,
        email: String,
        date: Date
    },
    updateId: String,
    approved: Boolean
});

var Attraction = mongoose.model('Attraction', attractionSchema);

module.exports = Attraction;

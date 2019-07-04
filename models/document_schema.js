var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var docSchema = new Schema ({
    model_id: String,
    document_name: String,
    plain_text: String,
    tokenized_text: [String]
})
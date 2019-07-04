var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const bodyParser = require('body-parser');
var assert = require('assert');
var dbName = 'testing';     // Database Name, change this to the name of your local MongoDB database
var collectionTwo = 'add_Document_Collection';
var url = `mongodb://localhost:27017/${dbName}`;
const fetch = require("node-fetch");
var path = require('path');
var fs = require('fs');

var app = express();

app.use(bodyParser.json()); // Parse input text to JSON
app.use(bodyParser.urlencoded({ extended: true })); // Ensure proper/safe URL encoding

app.get('/annotate/v2', function (req, res) {
    res.sendFile(path.join(__dirname, '../views', '/doc_annotate_v2.html'));
});


app.post('/v2/generate-model/:id', function (req, res) {
    var model_id = req.params.id;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var db = client.db(dbName);
        db.collection(`${collectionTwo}`).find({ model_id: model_id }, { projection: { tokenized_text: [] } }).toArray(function (err, document) {
            if (err) throw err;
            saveToDoc(document);
            client.close();
        });
    });
})

app.get('/v2/getAllDocuments', function (req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var db = client.db(dbName);
        db.collection(`${collectionTwo}`).find({}, { projection: { _id: 1, model_id: 1, document_name: "" } }).toArray(function (err, document) {
            if (err) throw err;
            res.send(JSON.stringify(document));
            client.close();
        });
    });
})

app.get('/v2/document/:id', function (req, res) {
    var docId = req.params.id;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var db = client.db(dbName);

        db.collection(`${collectionTwo}`).findOne({ _id: new ObjectId(docId) }, function (err, document) {
            var temp = [{ id: "", value: "" }];
            var splitWord = [];
            document.tokenized_text.forEach(element => {
                splitWord = element.split(("\t"));
                temp.push({ id: splitWord[0], value: splitWord[1] })
                document.tokenized_text = temp;
            });
            res.send(JSON.stringify(document));
            client.close();
        });
    });
})

app.post('/v2/update/entity/:id/:word/:entity', function (req, res) {
    var docInfo = req.body;
    fetch(`http://127.0.0.1:8080/document/${docInfo.docID}`)
        .then(res => res.json())
        .then(function (data) {
            var index = findWord(data.tokenized_text, docInfo.word);
            if (index != -1) {
                MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {

                    var db = client.db(dbName);
                    var setIndex = "tokenized_text." + index;
                    var toUpdate = docInfo.word + "\t" + docInfo.value;
                    db.collection(`${collectionTwo}`).updateOne(
                        { "_id": new ObjectId(docInfo.docID) },
                        { $set: { [setIndex]: toUpdate } }
                    );
                });
            } else {
                res.end('{"failed" : "Unable to find the word given, please try again", "status" : 400}');
            }
        })
        .then(function () {
            res.end('{"success" : "Updated Successfully", "status" : 200}');
        })
        .catch(err => console.error(err));
})

function findWord(text, word) {
    for (var i = 0; i < text.length; i += 1) {
        if (text[i]["id"] === word) {
            return i - 1;
        }
    }
    return -1;
}

function saveToDoc(text) {
    var d = new Date();
    dd = d.toDateString();
    var logger = fs.createWriteStream(dd + ' - model-1.txt', {
        flags: 'w' // 'a' means appending (old data will be preserved)
    });

    for (var i = 0; i < text.length; i++) {
        for (var j = 0; j < text[i].tokenized_text.length; j++) {
            if (text[i].tokenized_text[j] === "\tEOF") {
                logger.write("\r\n");
            } else {
                logger.write(text[i].tokenized_text[j] + "\r\n");
            }
        }
    }
    logger.close;
}

module.exports = app;
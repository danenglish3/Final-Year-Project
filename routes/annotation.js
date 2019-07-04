var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const bodyParser = require('body-parser');
var assert = require('assert');
var dbName = 'testing';     // Database Name, change this to the name of your local MongoDB database
var collectionTwo = 'add_Document_Collection';
var collectionOne = 'add_Model_Collection';
var url = `mongodb://localhost:27017/${dbName}`;
const fetch = require("node-fetch");
var path = require('path');
var fs = require('fs');

var app = express();

app.use(bodyParser.json()); // Parse input text to JSON
app.use(bodyParser.urlencoded({ extended: true })); // Ensure proper/safe URL encoding

app.get('/annotate', function (req, res) {
    res.sendFile(path.join(__dirname, '../views', '/document_annotate.html'));
});

/* This request will generate a text document when the button is pressed on the page.
It will grab the tokenized text from each docuemtn related to a model - Call the saveToDoc function
which will output it in a Stanford NER friendly way */
app.post('/generate-model/:id', function (req, res) {
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

//Gets all the documents that are against a model
app.get('/getAllDocuments', function (req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var db = client.db(dbName);
        db.collection(`${collectionTwo}`).find({}, { projection: { _id: 1, model_id: 1, document_name: "" } }).toArray(function (err, document) {
            db.collection(`${collectionOne}`).find().toArray(function (err, result) {
                document.push(result[0].entity_list);
                if (err) throw err;
                res.send(JSON.stringify(document));
                client.close();
            });
        });
    });
})

//Gets a document with a given ID
app.get('/document/:id', function (req, res) {
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

//Addding a new entity if it is already not present within the
app.post('/addEntity/:entity/:colour', function (req, res) {
    var entityListSize;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var db = client.db(dbName);
        
        db.collection(`${collectionOne}`).findOne({entity_list: {$elemMatch: {entity: req.params.entity} } }, function (err, document) {
        
            if (err) throw err;

            if (document === null){
                db.collection(`${collectionOne}`).findOne({"model_id": "1"}, function (err1, doc1) {
                    entityListSize = doc1.entity_list.length;
                    
                    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
                        var db2 = client.db(dbName);
                        db2.collection(`${collectionOne}`).updateOne( { "model_id": "1"}, 
                        { $set: { ["entity_list." + entityListSize] : { "entity" : req.params.entity, "colour": req.params.colour }}});   

                        res.end('{"Success" : "Added new entity + colour into DB", "status" : 200}');
                    });       
               });        
            }
            // console.log(document);
            client.close();
        });
    });

})

/* Updates a document given the specified word and entity set */
app.post('/update/entity/:id/:word/:entity', function (req, res) {
    var docInfo = req.body;
    //Fetches a document
    fetch(`http://127.0.0.1:8080/document/${docInfo.docID}`)
        .then(res => res.json())
        .then(function (data) {

            var wordList = docInfo.word;
            // console.log(req.body);
            //If there is only 1 word to be updated
            if (wordList.length === 1) {

                //Configure backslash if present
                if (wordList[0] == "\"") {
                    wordList[0] = "\\\"";
                }
                var index = findWord(data.tokenized_text, wordList[0]);
                if (index != -1) { 
                    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {

                        var db = client.db(dbName);
                        var setIndex = "tokenized_text." + index;
                        var toUpdate = wordList[0] + "\t" + docInfo.value;
                        db.collection(`${collectionTwo}`).updateOne(
                            { "_id": new ObjectId(docInfo.docID) },
                            { $set: { [setIndex]: toUpdate } }
                        );
                    });
                } else {
                    res.end('{"failed" : "Unable to find the word given, please try again", "status" : 400}');
                }
            } else {
                // Need handle contractions when entered to be annotated
                for (var j = 0; j < wordList.length; j++) {
                    if (wordList[j] == "'") {
                        // Set [we,',ve] to [we've]
                        wordList[j - 1] += wordList[j] + wordList[j + 1];
                        wordList.splice(j, j + 1);
                    }
                }

                // Minus 1 to offset off by 1 error...
                var indexOfFirstWord = (findWordList(data.tokenized_text, wordList)) - 1;
                console.log(indexOfFirstWord);
                if (indexOfFirstWord >= 0) {
                    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {

                        var db = client.db(dbName);
                        for (var i = 0; i < wordList.length; i++) {
                            var index = indexOfFirstWord + i;
                            var setIndex = "tokenized_text." + (index);
                            console.log(setIndex);
                            var toUpdate = wordList[i] + "\t" + docInfo.value;
                            db.collection(`${collectionTwo}`).updateOne(
                                { "_id": new ObjectId(docInfo.docID) },
                                { $set: { [setIndex]: toUpdate } }
                            );
                        }
                    });
                } else {
                    res.end('{"failed" : "Unable to find the given word pattern, please try again", "status" : 400}');
                }
            }
        })
        .then(function () {
            res.end('{"success" : "Updated Successfully", "status" : 200}');
        })
        .catch(err => console.error(err));
})

function findWordList(text, wordList) {
    console.log(wordList[0]);
    // Really cool function. map() checks each iteration for the equality of e and wordList[0]. If
    // they match the index is returned, otherwise the result is set to an empty string. The .filter then
    // ensures the output result only contains strings and are not empty
    var indices = text.map((e, i) => e.id === wordList[0] ? i : '').filter(String)
    console.log("indices: " + indices);
    var count = 0;
    for (var i = 0; i < indices.length; i++) {
        for (var e = 0; e < wordList.length; e++) {
            var temp = indices[i];
            temp += e;
            if (text[temp]["id"] === wordList[e]) {
                count++;
                console.log("index: " + temp + "   word at index: " + text[temp]["id"] + "  wordList " + wordList[e]);
            }
            if (count === wordList.length) {
                console.log("count: " + count + "  wordlist length: " + wordList.length);
                return indices[i];
            }
        }
        count = 0;
    }
    return -1;

}

function findWord(text, word) {
    for (var i = 0; i < text.length; i += 1) {
        if (text[i]["id"] == word) {
            return i - 1;
        }
    }
    return -1;
}

function saveToDoc(text) {
    var d = new Date();
    dd = d.toDateString();
    var logger = fs.createWriteStream(dd + ' - model-1.txt', {
        flags: 'w'
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
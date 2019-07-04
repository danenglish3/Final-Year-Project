var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const bodyParser = require('body-parser');
var assert = require('assert');
var dbName = 'testing';     // Database Name, change this to the name of your local MongoDB database
var collectionOne = 'add_Model_Collection';
var collectionTwo = 'add_Document_Collection';
var url = `mongodb://localhost:27017/${dbName}`;
var path = require('path');

var Tokenizr = require('tokenizr');

var app = express();

app.use(bodyParser.json()); // Parse input text to JSON
app.use(bodyParser.urlencoded({ extended: true })); // Ensure proper/safe URL encoding

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../views', '/index.html'));
});

app.get('/get-service1-data', function (req, res) {
    //The data from the MongoDB is loaded into data_array

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var data_array = [];
        var db = client.db(dbName);

        db.collection(`${collectionOne}`).find().toArray(function (err, result) {
            if (err) throw err;
            console.log(result.model_name, result);
            client.close();
            res.send(result);
        });
    });
})

app.get('/get-service2-data', function (req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var data_array = [];
        var db = client.db(dbName);

        db.collection(`${collectionTwo}`).find().toArray(function (err, result) {
            if (err) throw err;
            console.log(result.model_id, result);
            client.close();
            res.send(result);
        });
    });
})

app.get('/get-data/:modelName', function (req, res) {

    var inputName = { model_name: req.params.modelName };
    console.log(inputName);
    //console.log("id.model_name + ' ' + id.timestamp");

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);
        var resultArray = [];
        var db = client.db(dbName);
        //console.log(inputName);
        console.log("db: " + db.databaseName);

        db.collection(`${collectionTwo}`).find(inputName).toArray(function (err, result) {
            if (err) throw err;
            console.log(result);
            res.end(JSON.stringify(result));
            client.close();
        });
    });
})

app.post('/update/:id', function (req, res) {
    // console.log(req.body);
})

//inserting into MongoDB must be in the curly braces of the app.post
//Accepts the inputs from create a model form box
app.post('/create', function (req, res) {
    console.log("The information entered is: ", req.body);
    var item = {
        model_name: req.body.model_name,
        timestamp: req.body.timestamp
    };

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);

        const db = client.db(dbName);

        //This creates a collection if it does not already exist
        db.collection(`${collectionOne}`).insertOne(item, function (err, result) {
            assert.equal(null, err);
            console.log(`Item has been successfully inserted into ${collectionOne}.`);

        });
    });

    res.redirect('/');
});

app.post('/add-document', function (req, res) {
    console.log("The information entered is: ", req.body);
    var item = {
        model_id: req.body.model_id,
        document_name: req.body.doc_name,
        plain_text: req.body.plain_text,
        tokenized_text: tokenizeDocument(req.body.plain_text)
    };

    console.log(item.tokenized_text);

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        assert.equal(null, err);

        const db = client.db(dbName);

        //This creates a collection if it does not already exist
        db.collection(`${collectionTwo}`).insertOne(item, function (err, result) {
            assert.equal(null, err);
            console.log(`Item has been successfully inserted into ${collectionTwo}.`);

        });
    });
    res.redirect('/');
});

// USed to tokenize the input plain text data
function tokenizeDocument(inputDoc) {

    let lexer = new Tokenizr();
    var tokenizedDoc = [];

    lexer.rule(/[a-zA-Z]['a-zA-Z]*/, (ctx, match) => { //word
        ctx.accept("0")
    })
    lexer.rule(/[-+]?[0-9]\.?[0-9]+/, (ctx, match) => { //number match
        ctx.accept("0")
    })
    lexer.rule(/[ \t\r\n]+/, (ctx, match) => { //ignore space, new lines, tabs, returns
        ctx.ignore()
    })
    lexer.rule(/./, (ctx, match) => { // chars
        ctx.accept("0")
    })


    let cfg = inputDoc;
    lexer.input(cfg);

    var splittedToken = [];
    var usableToken = "";
    var tempToken = "";

    lexer.tokens().forEach((token) => {
        splittedToken = token.toString().split(", text");
        usableToken = splittedToken[0].substr(1, splittedToken[0].length); //Removes < from the front of string

        splittedToken = usableToken.split((" ")); //Split token into 4 lots
        splittedToken[3] = splittedToken[3].replace(/^"(.*)"$/, '$1'); //Remove the "" surrounding the value
        tempToken = splittedToken[3] + "\t" + splittedToken[1].substr(0, splittedToken[1].length - 1);

        tokenizedDoc.push(tempToken); //Push into array
    });

    return tokenizedDoc;
}

function getDetails() {
    var userInput = document.getElementById('model_name').value;
    alert(userInput);
}

module.exports = app;
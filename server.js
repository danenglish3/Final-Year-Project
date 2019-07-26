const express = require('express');
const app = express();
// const server = app.listen(PORT, listening);
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const url = 'mongodb://localhost:27017/testing'; // DB Connection URL
const dbName = 'CBA_Project';// Database Name, change this to the name of your local MongoDB database
var mongoose = require('mongoose');

app.use(bodyParser.json()); // Parse input text to JSON
app.use(bodyParser.urlencoded({ extended: true })); // Ensure proper/safe URL encoding
app.use("/public", express.static('./public'));



const PORT = 8080; // Specify a network port

app.listen(PORT, () => console.log(`Server is running on port ${PORT} at 'http://localhost:${PORT}' (CTRL + C to exit)`));

/* function listening() {
    console.log(`Server is running on port ${PORT} at 'http://localhost:${PORT}' (CTRL + C to exit)`);
} */
app.use(require('./routes/index'));
app.use(require('./routes/annotation'));
<<<<<<< HEAD
=======
app.use(require('./routes/annotate-v2'));
>>>>>>> master

mongoose
    .connect(
        'mongodb://localhost:27017/testing',
        { useNewUrlParser: true }
)
.then(() => console.log('mongo connected'))
.catch(err => console.log(err));

//DB connect
MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    assert.equal(null, err);
    console.log(`Connected successfully to MongoDB, you can now access the database "${dbName}" successfully.`);
});
console.log("db_connect file called!", Date.now());

// ---------------- Third Party Modules -------------- //
const mongoose = require("mongoose");
require("dotenv").config();
// ----------------------- X ------------------------- //

const dbEngine = process.env.DB_Engine;
const username = process.env.DB_Username;
const password = process.env.DB_Password;
const host = "127.0.0.1";
const port = process.env.DB_Port;
const dbName = process.env.DB_Name;

const credential = `${username || username && password ? `${username}:${password}@` : ''}`;
const connectionString = `${dbEngine}://${credential}${host}:${port}/${dbName}`;
const connectionOptions = {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true};

mongoose.connect(connectionString, connectionOptions)
.then(() => {
    console.log("MongoDB database connection has been successfully made!", Date.now());
})
.catch(err => {
    console.error(`Database connection error: ${err}`);
    process.exit();
});

mongoose.connection.on('error', err => {
    console.error(err);
    process.exit();
});

/* mongoose.disconnect()
.then(() => {
    console.log("Disconnected from MongoDB database!");
})
.catch(err => {
    console.error(err);
    process.exit();
}); */

module.exports = mongoose;
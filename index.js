console.log("index.js file hit!", Date.now());

// ------------------ Core Modules ------------------- //
const path = require('path');
// ----------------------- X ------------------------- //

// ---------------- Third Party Modules -------------- //
const express = require('express');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
const expressEjsLayouts = require('express-ejs-layouts');
require("dotenv").config();
// ----------------------- X ------------------------- //

// -------------- User defined Modules --------------- //
require('./modules/db_connect');
const Auth = require('./modules/auth');
// ----------------------- X ------------------------- //

const objAuth = new Auth();

const app = express();

app.use(cookieParser());
app.use(expressEjsLayouts);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views');
app.set('view engine', 'ejs');
app.set('layout', path.join(__dirname, 'views/layouts/blog_layout'));

// ############################ Routes ############################ //
app.use(objAuth.authorize); // For authorization
app.use((req, res, next) => {
    global.appVersion = "App v1.0.1";
    next();
});

// --------------- Setting different Rouutes ------------------- //
app.use('/blogs', require('./routes/blogs'));
app.use('/users', require('./routes/users'));
// app.use('/auth', require('./routes/auth'));
// ---------------------------- X ------------------------------ //

app.get(['/', '/index', '/home'], (req, res) => {
    console.log("Welcome to Blog World!");
    const objPageData = {title: 'Home'};

    // res.sendFile(`${__dirname}/index.html`);
    res.render('index', objPageData);
});
// ############################## X ############################### //

// --------------------- Server connection ------------------- //
const host = process.env.Host;
const port = process.env.Port;

app.listen(port, host, err => {
    if( err )
    {
        console.error("Error in starting the Server");
        process.exit(1);
    }
    
    console.log(`Server is running at ${host}:${port}`, Date.now());
});
// ---------------------------- X ---------------------------- //
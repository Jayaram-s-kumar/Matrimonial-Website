
var express = require('express');
var path = require('path')
var {engine} = require('express-handlebars')
const hbs = require('hbs')

var fileupload = require("express-fileupload")



var indexRouter = require('./routes/index')

var app = express();

app.use(fileupload())

var cookieParser = require("cookie-parser")
var session = require('express-session')

// view engine setup
app.engine('hbs',engine({extname:'hbs',defaultLayout:'default', layoutsDir: path.join(__dirname, '/views/layouts'),partialsDir:path.join(__dirname, 'views/partials')}))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','hbs')    
   

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));



app.use(cookieParser())
const oneday=24*60*60*1000
app.use(session({secret:'key',cookie:{maxAge:oneday},resave:false,saveUninitialized:true}))



app.use('/', indexRouter);

module.exports = app;

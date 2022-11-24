
var express = require('express');
var path = require('path')
var {engine} = require('express-handlebars')
var exphbs = require('express-handlebars')
const hbs = require('hbs')

var fileupload = require("express-fileupload")

const db = require('./Database')


var indexRouter = require('./routes/index')

var app = express();

app.use(fileupload()) 

var cookieParser = require("cookie-parser")
var session = require('express-session');
const { connected } = require('process');

// view engine setup
app.engine('hbs',engine({extname:'hbs',defaultLayout:'default', layoutsDir: path.join(__dirname, '/views/layouts'),partialsDir:path.join(__dirname, 'views/partials'),helpers:{
    check:function(array,id,options){
       
        let found = false
        for(i=0;i<array.length;i++){
       
         
            if(id.toString()==array[i].userid.toString()){
                if(array[i].accepted==true){
                    
                    found = true
                    return options.fn({viewprofile:true})
                    break
                }else{
                   
                    found = true
                    return options.fn({intrestsend:true})
                    break
                }
            }

        }  
        if(!found){
            
            return options.fn({iamintrested:true})
        }
     
    },
    ifiacceptedornot:function(array,requested_user_id,options){
        for(i=0;i<array.length;i++){
            if(array[i].userid.toString()==requested_user_id.toString()){
                if(array[i].accepted==true){ 
                    return options.fn({
                        accepted:true
                    })
                }else{
                    return options.fn({
                        accept:true
                    })
                }
            }
        }
    },
    ifheacceptedornot:function(intersted_array,curr_user_id,options){
      //  console.log(intersted_array)
      //  console.log(curr_user_id)
        for(i=0;i<intersted_array.length;i++){
            if(intersted_array[i].userid.toString()==curr_user_id.toString()){
                if(intersted_array[i].accepted==true){
                    return options.fn({
                        accepted:true
                    })
                }else{
                    return options.fn({
                        accept:true
                    })
                }
            }
        }
    }
}}))
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

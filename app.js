var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const paginate = require('express-paginate')
const axios = require('axios')
const cors = require('cors')


var hbs = require('express-handlebars');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var session = require('express-session')
var app = express();
var cropper = require('cropperjs')
const bcrypt = require('bcrypt')
// var fileUpload = require('express-fileupload')
var db = require('./config/connection')
const bodyParser = require('body-parser')
var MongoDBStore = require('connect-mongodb-session')(session);


var store = new MongoDBStore({
  uri: 'mongodb+srv://vaishak:2X8bUhQ5JCETZPia@cluster0.rddhz.mongodb.net/connect_mongodb_session_test?retryWrites=true&w=majority',
  collection: 'mySessions'
});

store.on('error', function(error) {
  console.log(error);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials',
  helpers:{
    counter:(index)=>index+1
  }

}))
app.use(cors({
  origin: '*',
}))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
// app.use(session({ secret: "Key", cookie: { maxAge: 60000000 } }))

// mongodb session store////
app.use(require('express-session')({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: true 
}));



db.connect((err) => {
  if (err) console.log(err);
  else console.log("Database connected successfully ");
})

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
})



app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use(function(req,res,next){
  res.status(404)
  res.render('404',{url:req.url})
  return;
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500); 
  res.render('error'); 
});

module.exports = app;

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require('dotenv').config();
require('./models/connection');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var categoriesRouter = require('./routes/categories');

var app = express();
const cors = require('cors');

// Définissez vos options CORS ici
const corsOptions = {
    origin: 'https://stockify-frontend-wine.vercel.app/', // Remplacez par l'URL de votre frontend déployé
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Restreignez aux méthodes HTTP que vous utilisez
    credentials: true, // Si vous gérez des cookies ou des sessions
    optionsSuccessStatus: 200 // Pour la compatibilité avec les anciens navigateurs   
};

// Utilisez les options CORS
app.use(cors(corsOptions));

const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/categories', categoriesRouter);

module.exports = app;

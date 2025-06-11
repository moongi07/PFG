const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware de sesión
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));


app.use(flash());
app.use((req, res, next) => {
  res.locals.mensaje = req.flash("mensaje");
  next();
});


app.use(expressLayouts);
app.set('layout', 'layout'); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 


app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));


app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(fileUpload());

// Rutas 
const rutas = require('./routes/las_rutas');
const eventos = require('./routes/eventos_nuevo');
const recomendar = require('./routes/test');

app.use('/', rutas);
app.use('/api/eventos', eventos);
app.use('/api/test', recomendar);

// Puerto
app.set('port', process.env.PORT || 3000);

// Servidor
app.listen(app.get('port'), () => {
  console.log('SERVIDOR iniciado en el puerto:', app.get('port'));
});

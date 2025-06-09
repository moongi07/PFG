//******************************************************************
// VERSIÓN Ficheros v1.0
// en esta versión no utilizamos LOGIN y por tanto no hay usuarios
//******************************************************************

//******************************************************************
// importamos librerías necesarias
//******************************************************************
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser=require("body-parser");
const fileUpload = require('express-fileupload');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
require('dotenv').config();


//******************************************************************
// creamos una instancia de la APLICACIÓN a través de la librería de "express"
// una vez creada la instancia "app" -> nuestra aplicación será -> "app"
const app = express();

//******************************************************************
const session = require('express-session');
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true solo si usas HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));


app.use(flash());
app.use((req, res, next) => {
    res.locals.mensaje = req.flash("mensaje");
    next();
});
// app.use((req, res, next) => {
//    console.log('Sesión actual:', req.session);
//    next();
// });

app.use(expressLayouts); // Activa los layouts
app.set('layout', 'layout')
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));



//******************************************************************
// configuraciones 
// puerto por el que escuchamos
//******************************************************************

// puede estar configurado en una variable del sistema "process.env.PORT"
// aquí no lo está -> por tanto utilizaremos el puerto 3000
app.set('port', process.env.PORT || 3000);

//******************************************************************
// configuraciones 
// motor de plantillas que vamos a utilizar para crear las "vistas"
//******************************************************************

app.set('view engine', 'ejs');

//******************************************************************
// configuraciones 
// indicamos la carpeta donde vamos a tener las "vistas"
//******************************************************************

app.set('views', path.join(__dirname, 'views'));


//******************************************************************
// configuraciones 
// "body-parser" analiza los datos codificados enviados utilizando la solicitud HTTP POST
//******************************************************************

app.use(bodyParser.urlencoded({extended: false}));
// analiza las solicitudes con contenido de tipo application/json
app.use(bodyParser.json());

//******************************************************************
// configuraciones 
// librería para poder subir ficheros
//******************************************************************

app.use(fileUpload());

//******************************************************************
// configuraciones 
// le indicamos donde está la carpeta de ficheros estáticos (hojas de estilo, imágenes, etc.
//******************************************************************

app.use(express.static(path.join(__dirname,'public')));


//******************************************************************
// configuraciones 
// aquí le indicamos donde tenemos las rutas -> asociadas a nuestra aplicación
// no hay que poner extensión al fichero de rutas 
//******************************************************************
app.use(fileUpload());
const rutas = require('./routes/las_rutas');
const eventos = require('./routes/eventos_nuevo');
const recomendar = require('./routes/test');



app.use( '/', rutas);
app.use('/api/eventos', eventos);
app.use('/api/test', recomendar);
//******************************************************************
//******************************************************************
//******************************************************************
// iniciamos el servidor -> para arrancar la aplicación -> 127.0.0.1:3000
//******************************************************************
app.listen(app.get('port'), () =>
{
   console.log('SERVIDOR iniciado en el puerto:', app.get('port'));
});
//******************************************************************
//******************************************************************
//******************************************************************

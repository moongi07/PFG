const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
//encriptar contraseñas
const bcrypt = require('bcryptjs');
//generar pdf
const PDFDocument = require('pdfkit');
//enviar correo
const nodemailer = require('nodemailer');
//para generar id unicos
const { v4: uuidv4 } = require("uuid");


const dbConnection = require('../config/dbConnection');
// realizamos una conexión a la base de datos
const connection = dbConnection();


//*********************************************************
//*********************************************************
//             controlador: INDEX request tipo->(GET "/")
//				vista: 'index' -> 
//*********************************************************
//*********************************************************
router.get('/', (req, res) => {
    if (req.session && req.session.user) {
         res.render('index');
     } else {    
    res.redirect('/login'); 
    }
});
//*********************************************************
//*********************************************************
//             controlador: LOGIN request tipo->(GET "/LOGIN")
//				vista: 'login' -> 
//*********************************************************
//*********************************************************
router.get('/login', (req, res) => {
    
    res.render('login', { mensaje: null });  
});

//*********************************************************
//*********************************************************
//        controlador: LOGIN request tipo->(POST "/LOGIN")
//				vista: 'login' -> 
//*********************************************************
//*********************************************************
router.post('/login', (req, res) => {
  const { tusuario, tpassword } = req.body;

  const sql = "SELECT usuario_id, username, password, nombre, apellidos, email, telefono FROM usuario WHERE username = ?";

  connection.query(sql, [tusuario], async (err, results) => {
    if (err) {
      console.error("Error en la consulta de login:", err);
      return res.render('error', { errorMessage: "Error al procesar la solicitud." });
    }

    console.log("Usuario recibido:", tusuario);

    if (results.length > 0) {
      const user = results[0];
      console.log("Usuario encontrado:", user);

      const passwordMatch = await bcrypt.compare(tpassword, user.password);
      console.log("¿Contraseña correcta?", passwordMatch);

      if (passwordMatch) {
        req.session.userId = user.usuario_id; // ← 🔧 aquí estaba el fallo
        req.session.user = user;

        req.session.save((err) => {
          if (err) {
            console.log("Error al guardar sesión:", err);
            return res.redirect('/login');
          }
          return res.redirect('/');
        });
      } else {
        return res.render('login', { mensaje: "Credenciales erróneas !!" });
      }
    } else {
      return res.render('login', { mensaje: "Credenciales erróneas !!" });
    }
  });
});


// Devuelve true si el usuario está logueado
router.get('/usuario-logeado', (req, res) => {
  if (!req.session.userId) {
    console.log("no ha iniciado sesion");
    res.json({ logeado: false });
  } else {
    console.log("ha iniciado sesion correctamente");
    res.json({ logeado: true });
  }
});

router.post('/pedidos', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const pedido = req.body.items;
  req.session.pedido = pedido;

  res.json({ mensaje: 'Pedido guardado. Redirigiendo a compra...' });
});


//*********************************************************
//*********************************************************
//             controlador: REGISTRO request tipo->(GET "/REGISTRO")
//				vista: 'registro' -> 
//*********************************************************
//*********************************************************
router.get('/registro', (req, res) => {
    
   res.render("registro"); 

});

router.post('/registro', async (req, res) => {
    const { tnombre, tapellidos, tusuario, temail, telefono, tpassword, tconfirmarpassword } = req.body;

    if (tpassword !== tconfirmarpassword) {
        return res.render('registro', { mensaje: "Las contraseñas no coinciden." });
    }

    try {
        const hashedPassword = await bcrypt.hash(tpassword, 10);

        const user = {
            username: tusuario,
            password: hashedPassword,
            nombre: tnombre,
            apellidos: tapellidos,
            email: temail,
            telefono: telefono
        };

        // Aquí se usa el pool
        connection.query('INSERT INTO usuario SET ?', user, (err, result) => {
            if (err) {
                console.error("Error al registrar el usuario:", err);
                return res.render('registro', { mensaje: "Hubo un error al registrar tu cuenta." });
            }

            console.log("Usuario registrado correctamente.");
            res.render('login', { mensaje: `Bienvenido!! ${user.username} Tu cuenta ha sido creada!!` });
        });
    } catch (error) {
        console.error("Error en el proceso de registro:", error);
        res.render('registro', { mensaje: "Error interno del servidor." });
    }
});

    //vista de error, al final no la usamos
router.get('/error', (req, res) => {
    
    res.render('error', { errorMessage: req.session.error });
    
    delete req.session.error;
});


//*********************************************************
//*********************************************************
//         controlador: MENU request tipo->(GET "/menu")
//				vista: 'menu' -> 
//*********************************************************
//*********************************************************
router.get('/menu', (req, res) => {
  const sql = "SELECT producto_id, nombre, descripcion, precio, seccion_id FROM producto";

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener productos:", err);
      return res.status(500).send("Error al obtener los productos");
    }



    const secciones = {
      cafes: [],
      bebidas: [],
      dulces: []
    };

    results.forEach(producto => {
      const item = {
        id: producto.producto_id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio
      };

      if (producto.seccion_id === 1) {
        secciones.cafes.push(item);
      } else if (producto.seccion_id === 2) {
        secciones.bebidas.push(item);
      } else if (producto.seccion_id === 3) {
        secciones.dulces.push(item);
      }
    });

    res.render('menu', { secciones });
  });
});



//*********************************************************
//*********************************************************
//         controlador: MASCARRITO request tipo->(POST "/mascarrito")
//				vista: 'carrito' -> 
//*********************************************************
//*********************************************************
router.get('/compra', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const pedido = req.session.pedido;
  const usuarioId = req.session.userId;

  if (!pedido || pedido.length === 0) {
    return res.render('error', { mensaje: "No hay pedido que procesar." });
  }

  const pedidos = pedido.map(item => [
    usuarioId,
    item.id,
    item.cantidad,
  ]);

  const sql = 'INSERT INTO consumicion (usuario_id, producto_id, cantidad) VALUES ?';

  const PDFDocument = require('pdfkit');
  const fs = require('fs');
  const path = require('path');
  const { v4: uuidv4 } = require('uuid');

  const tempDir = path.join(__dirname, "..", "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  connection.query(sql, [pedidos], async (err, result) => {
    if (err) {
      console.error("Error al registrar la compra: ", err);
      return res.render('error', { mensaje: "Hubo un error al procesar tu compra." });
    }

    delete req.session.pedido;

    // ✅ Lógica de LOGROS DESPUÉS de insertar consumiciones
    connection.query(
      "SELECT SUM(cantidad) AS total FROM consumicion WHERE usuario_id = ?",
      [usuarioId],
      function (err, results) {
        if (err) {
          console.error("Error al comprobar los logros: ", err);
          
          return;
        }

        const totalConsumiciones = results[0].total;
        console.log("total consumiciones: "+ totalConsumiciones);

        const queryLogros = `
          SELECT id_logro
          FROM logros
          WHERE cantidad <= ?
          AND id_logro NOT IN (
            SELECT id_logro FROM usuario_logro WHERE usuario_id = ?
          )
        `;

        connection.query(queryLogros, [totalConsumiciones, usuarioId], function (err, logros) {
          if (err) {
            console.error("Error al buscar logros alcanzados: ", err);
            return;
          }

          if (logros.length > 0) {
            logros.forEach((logro) => {
              const insertQuery = `
                INSERT INTO usuario_logro (usuario_id, id_logro)
                VALUES (?, ?)
              `;
              connection.query(insertQuery, [usuarioId, logro.id_logro], function (err) {
                if (err) {
                  console.error(`Error al insertar el logro ${logro.id_logro}: `, err);
                } else {
                  console.log(`✅ Logro ${logro.id_logro} asignado al usuario ${usuarioId}`);
                }
              });
            });
          } else {
            console.log(`ℹ️ No hay logros nuevos para el usuario ${usuarioId}`);
          }
        });
      }
    );

    // ✅ GENERAR Y ENVIAR PDF
    const tempFileName = `factura_${uuidv4()}.pdf`;
    const tempFilePath = path.join(tempDir, tempFileName);
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const writeStream = fs.createWriteStream(tempFilePath);
    doc.pipe(writeStream);

    const productos = pedido;
    const nombreUsuario = req.session.user?.nombre || "Cliente";
    const userId = req.session.userId;
    const today = new Date();
    const primaryColor = "#4F2C1D";
    const accentColor = "#D4B996";

    // Cabecera
    doc.font("Helvetica-Bold").fontSize(18).fillColor(primaryColor).text("Café entre líneas", 50, 50);
    doc.font("Helvetica").fontSize(10).fillColor(primaryColor)
      .text("Factura generada automáticamente", 50, 70)
      .text(`Fecha: ${today.toLocaleDateString()}`, 50, 85)
      .text(`Cliente: ${nombreUsuario}`, 50, 100)
      .text(`ID Cliente: ${userId}`, 50, 115);

    doc.moveTo(50, 140).lineTo(550, 140).strokeColor(accentColor).stroke();

    // Tabla
    doc.rect(50, 160, 500, 25).fill(primaryColor);
    doc.fillColor("white").fontSize(12)
      .text("Producto", 60, 170)
      .text("Precio", 250, 170)
      .text("Cantidad", 350, 170)
      .text("Total", 450, 170);

    let y = 195;
    let subtotal = 0;

    for (const item of productos) {
      const totalItem = item.precio * item.cantidad;
      subtotal += totalItem;

      doc.fillColor("black").fontSize(12)
        .text(item.nombre, 60, y)
        .text(`${item.precio.toFixed(2)} €`, 250, y)
        .text(item.cantidad.toString(), 350, y)
        .text(`${totalItem.toFixed(2)} €`, 450, y);

      y += 25;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    }

    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).strokeColor(accentColor).stroke();

    y += 10;
    doc.fillColor("black")
      .text(`Subtotal: ${subtotal.toFixed(2)} €`, 400, y)
      .text(`IVA (21%): ${iva.toFixed(2)} €`, 400, y + 20)
      .font("Helvetica-Bold")
      .text(`Total: ${total.toFixed(2)} €`, 400, y + 45);

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${tempFileName}"`);
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      fs.unlink(tempFilePath, err => {
        if (err) console.error("Error al eliminar PDF temporal:", err);
      });
    });
  });
});


//*********************************************************
//*********************************************************
//             controlador: ELIMINAR DEL CARRITO 
//          request tipo->(POST "/eliminarproducto")
//				vista: 'carrito' -> 
//*********************************************************
//*********************************************************
router.post('/reservas', (req, res) => {
  console.log('POST /reservas ejecutado');

  if (!req.session.user) {
    console.log('Sesión no encontrada');
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { fecha, mesa } = req.body;
  console.log('Datos recibidos:', { fecha, mesa });

  if (!mesa || !fecha) {
    console.log('Campos faltantes');
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const userId = req.session.userId;
  console.log('User ID:', userId);

  const fechaFormateada = new Date(fecha).toISOString().slice(0, 19).replace('T', ' ');

  const sql = `
    INSERT INTO reservas (usuario_id, mesa_id, fecha_hora)
    VALUES (?, ?, ?)
  `;

  console.log('Ejecutando query con:', [userId, mesa, fechaFormateada]);

  connection.query(sql, [userId, mesa, fechaFormateada], (err, result) => {
    if (err) {
      console.error('ERROR MYSQL:', err); // Asegúrate de que esta línea esté
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    console.log('Reserva insertada:', result);
    res.json({ success: true, id: result.insertId });
  });
});


//*********************************************************
//*********************************************************
//             controlador: GRACIAS
//          request tipo->(GET "/gracias")
//				vista: 'gracias' -> 
//*********************************************************
//*********************************************************
router.get('/gracias', (req, res) => {
//vista a la que redirigimos cuando el usuario haya efectuado la compra y se le haya mandado el correo con la factura
   res.render('gracias');
});




//*********************************************************
//*********************************************************
//         controlador: USER request tipo->(GET "/user")
//				vista: 'user' -> 
//*********************************************************
//*********************************************************
router.get('/user', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.userId;

  const sqlUser = `
    SELECT usuario_id, username, nombre, apellidos, email, telefono 
    FROM usuario 
    WHERE usuario_id = ?
  `;

  const sqlLogros = `
    SELECT l.nombre, l.descripcion
    FROM logros l
    JOIN usuario_logro ul ON l.id_logro = ul.id_logro
    WHERE ul.usuario_id = ?
  `;

  const sqlReservas = `
    SELECT mesa_id, fecha_hora
    FROM reservas
    WHERE usuario_id = ?
    ORDER BY fecha_hora DESC
  `;

  connection.query(sqlUser, [userId], (err, userResults) => {
    if (err) {
      console.error("Error obteniendo usuario:", err);
      return res.status(500).send("Error al obtener los datos del usuario");
    }

    if (userResults.length === 0) {
      return res.status(404).send("Usuario no encontrado");
    }

    const { usuario_id, username, nombre, apellidos, email, telefono } = userResults[0];

    connection.query(sqlLogros, [userId], (err, logrosResults) => {
      if (err) {
        console.error("Error obteniendo logros:", err);
        return res.status(500).send("Error al obtener los logros del usuario");
      }

      connection.query(sqlReservas, [userId], (err, reservasResults) => {
        if (err) {
          console.error("Error obteniendo reservas:", err);
          return res.status(500).send("Error al obtener las reservas del usuario");
        }

        // Renderizar vista con usuario, logros y reservas
        res.render('user', {
          usuario_id,
          username,
          nombre,
          apellidos,
          email,
          telefono,
          logros: logrosResults,
          reservasUsuario: reservasResults
        });
      });
    });
  });
});





//*********************************************************
//*********************************************************
//        controlador: EDITAR request tipo->(GET "/editar")
//				vista: 'editar' -> 
//*********************************************************
//*********************************************************	
router.post('/editar-usuario', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { usuario_id, username, nombre, apellidos, email, telefono } = req.body;

  // Validación básica
  if (!usuario_id || !username || !nombre || !apellidos || !email || !telefono) {
    return res.status(400).send("Todos los campos son obligatorios.");
  }

  // Seguridad extra: asegurarse de que el usuario edita solo su perfil
  if (parseInt(usuario_id) !== req.session.userId) {
    console.log(usuario_id);
    console.log(req.session.userId);
    return res.status(403).send("No tienes permiso para editar este perfil.");
  }

  const sql = `
    UPDATE usuario 
    SET username=?, nombre = ?, apellidos = ?, email = ?, telefono = ?
    WHERE usuario_id = ?
  `;

  const values = [username,nombre, apellidos, email, telefono, usuario_id];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      return res.status(500).send("Error del servidor al actualizar los datos.");
    }

    res.redirect('/user');
  });
});





//*********************************************************
//*********************************************************
//         controlador: FOCUS request tipo->(GET "/focus")
//				vista: 'focus' -> 
//*********************************************************
//*********************************************************
router.get('/calendario', (req, res) => {
  res.render('calendario'); // Renderiza la vista calendario.ejs
});

router.get('/reserva', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }   
  res.render('reserva');
});


router.get('/api/mesas-reservadas', (req, res) => {
  const sql = "SELECT mesa_id FROM reservas WHERE fecha_hora >= NOW()";

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error obteniendo reservas:", err);
      return res.status(500).json({ error: "Error al obtener las reservas." });
    }

    res.json(results); // Devuelve un JSON con los datos [{ mesa_id: "table-1" }, ...]
  });
});


router.get('/quiz', (req, res) => {
  res.render('quiz');
});




//*********************************************************
//*********************************************************
//         controlador: LOGOUT request tipo->(GET "/logout")
//				  vista: 'user' -> mandamos a vista /login
//*********************************************************
//*********************************************************
router.post('/logout', (req, res) =>
	{
			// cerramos la sesión
			req.session.destroy(function(err)
			{
				res.redirect("/");
			});
	});

//********************************************
//********************************************	
//							MUY IMPORTANTE !!
//	las rutas tienen que ser visibles en todo el proyecto
//********************************************
// para exportar las rutas a otros módulos
module.exports = router;
//********************************************
//********************************************

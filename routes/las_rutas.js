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

//api almacena pedidos
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
  //cogemos los datos
    const { tnombre, tapellidos, tusuario, temail, telefono, tpassword, tconfirmarpassword } = req.body;

    //comprobamos que ambas contraseñas coinciden
    if (tpassword !== tconfirmarpassword) {
        return res.render('registro', { mensaje: "Las contraseñas no coinciden." });
    }

    try {
        //encriptamos la contraseña
        const hashedPassword = await bcrypt.hash(tpassword, 10);
        //objeto user
        const user = {
            username: tusuario,
            password: hashedPassword,
            nombre: tnombre,
            apellidos: tapellidos,
            email: temail,
            telefono: telefono
        };

        //el insert a la bbdd
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

    //vista de error
router.get('/error', (req, res) => {
    
    res.render('error', { errorMessage: req.session.error });
    
    delete req.session.error;
});

router.delete('/eliminarreservas/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }
const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
      secure: true, // Usar SSL
      tls: {
        rejectUnauthorized: false, // ayuda con algunos problemas de certificados
      },
    })
  
    // Verificamos la conexion, esto ya no haría falta, eran pruebas para solucionar errores
    transporter.verify((error, success) => {
      if (error) {
        console.log("Error de configuración del servidor de correo:", error)
      } else {
        console.log("Servidor de correo listo para enviar mensajes")
      }
    })
  const reservaId = req.params.id;
  const userId = req.session.userId;
  const userEmail = req.session.user.email;

  // Recuperar detalles de la reserva antes de eliminar
  const getReservaSql = 'SELECT mesa_id, fecha_hora FROM reservas WHERE id = ? AND usuario_id = ?';

  connection.query(getReservaSql, [reservaId, userId], (err, rows) => {
    if (err) {
      console.error('Error al obtener la reserva:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o no autorizada' });
    }

    const { mesa_id, fecha_hora } = rows[0];
    const fechaFormateada = new Date(fecha_hora).toLocaleString('es-ES');

    // Eliminar la reserva
    const deleteSql = 'DELETE FROM reservas WHERE id = ? AND usuario_id = ?';

    connection.query(deleteSql, [reservaId, userId], (err, result) => {
      if (err) {
        console.error('Error al eliminar la reserva:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Reserva no encontrada o no autorizada' });
      }

      // Enviar email de cancelación
      if (userEmail) {
        const mailOptions = {
          from: '"Café entre líneas" <no-reply@tucafeteria.com>',
          to: userEmail,
          subject: 'Tu reserva ha sido cancelada',
          html: `
            <div style="font-family: 'Arial', sans-serif; color: #4e342e; line-height: 1.6; padding: 20px;">
              <h2 style="color: #c62828;">Reserva cancelada</h2>
              <p>Hola,</p>
              <p>Te informamos que tu reserva ha sido cancelada correctamente.</p>
              <p><strong>🪑 Mesa:</strong> ${mesa_id}<br>
                 <strong>📅 Fecha y hora:</strong> ${fechaFormateada}</p>
              <p>Esperamos verte pronto por aquí. Puedes hacer una nueva reserva cuando lo desees.</p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 0.9em; color: #8d6e63;">Este correo ha sido enviado automáticamente. Por favor, no respondas a esta dirección. Si tienes preguntas, contáctanos en <a href="mailto:contacto@tucafeteria.com" style="color: #5d4037;">contacto@tucafeteria.com</a>.</p>
              <p style="font-size: 0.9em; color: #a1887f;">Café entre líneas – Calle de la Lectura 123, Ciudad Literaria</p>
            </div>
          `
        };
  transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error enviando email:', error);
          return res.status(500).json({ error: 'Reserva guardada pero no se pudo enviar el correo.' });
        }
        console.log('Email enviado:', info.response);
      });
      }

      res.json({ success: true });
    });
  });
});

//*********************************************************
//*********************************************************
//         controlador: MENU request tipo->(GET "/menu")
//				vista: 'menu' -> 
//*********************************************************
//*********************************************************
router.get('/menu', (req, res) => {

  //select de todos los productos
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

      //los dividimos por secciones
      if (producto.seccion_id === 1) {
        secciones.cafes.push(item);
      } else if (producto.seccion_id === 2) {
        secciones.bebidas.push(item);
      } else if (producto.seccion_id === 3) {
        secciones.dulces.push(item);
      }
    });

    //lo mandamos a la vista
    res.render('menu', { secciones });
  });
});

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
//         controlador: COMPRA request tipo->(GET "/compra")
//				vista: 'carrito' -> 
//*********************************************************
//*********************************************************
router.get('/compra', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  //cogemos el pedido y el id del usuario
  const pedido = req.session.pedido;
  const usuarioId = req.session.userId;

  if (!pedido || pedido.length === 0) {
    return res.render('error', { mensaje: "No hay pedido que procesar." });
  }

  //lo metemos en un map
  const pedidos = pedido.map(item => [
    usuarioId,
    item.id,
    item.cantidad,
  ]);

  //hacemos el insert en la bbdd
  const sql = 'INSERT INTO consumicion (usuario_id, producto_id, cantidad) VALUES ?';

  //GENERAMOS EL PDF
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

    //eliminamos la variable de sesion
    delete req.session.pedido;

    //comprobamos si el usuario ha conseguido algún logro
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
          //si hay algun logro lo insertamos
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

   //GENERAR Y ENVIAR PDF
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





router.post('/reservas', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
      secure: true, // Usar SSL
      tls: {
        rejectUnauthorized: false, // ayuda con algunos problemas de certificados
      },
    })
  
    // Verificamos la conexion, esto ya no haría falta, eran pruebas para solucionar errores
    transporter.verify((error, success) => {
      if (error) {
        console.log("Error de configuración del servidor de correo:", error)
      } else {
        console.log("Servidor de correo listo para enviar mensajes")
      }
    })
  const { fecha, mesa } = req.body;

  if (!mesa || !fecha) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const userId = req.session.userId;
  const userEmail = req.session.user.email;

  const fechaDate = new Date(fecha);
  if (isNaN(fechaDate)) {
    return res.status(400).json({ error: 'Fecha inválida' });
  }

  const año = fechaDate.getFullYear();
  const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaDate.getDate()).padStart(2, '0');
  const hora = String(fechaDate.getHours()).padStart(2, '0');
  const minutos = String(fechaDate.getMinutes()).padStart(2, '0');
  const segundos = String(fechaDate.getSeconds()).padStart(2, '0');

  const fechaFormateada = `${año}-${mes}-${dia} ${hora}:${minutos}:${segundos}`;

  const checkSql = `
    SELECT * FROM reservas
    WHERE usuario_id = ?
      AND fecha_hora = ?
  `;

  connection.query(checkSql, [userId, fechaFormateada], (err, results) => {
    if (err) {
      console.error('Error al consultar reservas existentes:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: 'Ya tienes una reserva para esta fecha y hora exacta.' });
    }

    const insertSql = `
      INSERT INTO reservas (usuario_id, mesa_id, fecha_hora)
      VALUES (?, ?, ?)
    `;

    connection.query(insertSql, [userId, mesa, fechaFormateada], (err, result) => {
      if (err) {
        console.error('ERROR MYSQL:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      
 const mailOptions = {
  from: '"Café entre líneas" <no-reply@tucafeteria.com>',
  to: userEmail,
  subject: '🎉 ¡Reserva confirmada en Café entre líneas!',
  text: `Hola,

Gracias por reservar con nosotros. Te confirmamos que tu reserva para la mesa ${mesa} ha sido registrada con éxito para el día ${fechaDate.toLocaleString('es-ES')}.

Si necesitas modificar o cancelar tu reserva, no dudes en contactarnos.

¡Te esperamos!

– El equipo de Café entre líneas`,

html: `
  <div style="font-family: 'Arial', sans-serif; color: #4e342e; line-height: 1.6; padding: 20px;">
    <h2 style="color: #5d4037;">¡Gracias por tu reserva!</h2>
    <p>Hola,</p>
    <p>Te confirmamos que tu reserva ha sido registrada correctamente.</p>
    <p><strong>🪑 Mesa:</strong> ${mesa}<br>
       <strong>📅 Fecha y hora:</strong> ${fechaDate.toLocaleString('es-ES')}</p>
    <p>Si necesitas cancelar tu reserva, puedes hacerlo directamente desde nuestra web. Solo haz clic en el icono de usuario y accede a tu perfil.</p>
    <p>¡Te esperamos con una taza caliente y una sonrisa! ☕📖</p>
    <hr style="margin: 30px 0;">
    <p style="font-size: 0.9em; color: #8d6e63;">Este correo ha sido enviado automáticamente. Por favor, no respondas a esta dirección. Si tienes preguntas, escríbenos a <a href="mailto:contacto@tucafeteria.com" style="color: #5d4037;">contacto@tucafeteria.com</a>.</p>
    <p style="font-size: 0.9em; color: #a1887f;">Café entre líneas – Calle de la Lectura 123, Ciudad Literaria</p>
  </div>
`

};

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error enviando email:', error);
          // Puedes decidir si mandas error o confirmas la reserva aunque falle el email:
          return res.status(500).json({ error: 'Reserva guardada pero no se pudo enviar el correo.' });
        }
        console.log('Email enviado:', info.response);
        res.json({ success: true, id: result.insertId });
      });
    });
  });
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

  //COGEMOS LOS DATOS DEL USUARIO
  const sqlUser = `
    SELECT usuario_id, username, nombre, apellidos, email, telefono 
    FROM usuario 
    WHERE usuario_id = ?
  `;

  //COGEMOS SUS LOGROS
  const sqlLogros = `
    SELECT l.nombre, l.descripcion
    FROM logros l
    JOIN usuario_logro ul ON l.id_logro = ul.id_logro
    WHERE ul.usuario_id = ?
  `;

  //Y SUS RESERVAS
  const sqlReservas = `
    SELECT id, mesa_id, fecha_hora
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

        //LO MANDAMOS TODO A LA VISTA
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
//        controlador: EDITAR request tipo->(POST "/editar-usuario")
//				vista: 'user' -> 
//*********************************************************
//*********************************************************	
router.post('/editar-usuario', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  //cogemos los datos
  const { usuario_id, username, nombre, apellidos, email, telefono } = req.body;

  // Validación básica
  if (!usuario_id || !username || !nombre || !apellidos || !email || !telefono) {
    return res.status(400).send("Todos los campos son obligatorios.");
  }

  //nos aseguramos de que el id del usuario que ha iniciado sesion y el que esta editando es el mismo
  if (parseInt(usuario_id) !== req.session.userId) {
    console.log(usuario_id);
    console.log(req.session.userId);
    return res.status(403).send("No tienes permiso para editar este perfil.");
  }

  //hacemos el update
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

  // Actualizar los datos en la sesión para que estén sincronizados
  req.session.user = {
    ...req.session.user,
    username,
    nombre,
    apellidos,
    email,
    telefono,
  };

  // Redirigimos a user
  res.redirect('/user');
});
});

router.get('/contacto', (req, res) => {
  res.render('contacto'); 
});
//vista del calendario
router.get('/calendario', (req, res) => {
  res.render('calendario'); 
});

//vista de la reserva asegurandonos de que ha iniciado sesion el usuario
router.get('/reserva', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }   
  res.render('reserva');
});


router.get('/api/mesas-reservadas', (req, res) => {
  const { fecha } = req.query;

if (!fecha) {
  return res.status(400).json({ error: "Falta el parámetro 'fecha'." });
}

// Asegura formato completo con segundos
let fechaParseada = fecha;
if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fecha)) {
  fechaParseada += ':00'; // añade segundos si faltan
}

const fechaObj = new Date(fechaParseada);

if (isNaN(fechaObj.getTime())) {
  return res.status(400).json({ error: "Fecha inválida." });
}

  // Calculamos la franja horaria de la reserva (2 horas)
  const reservaInicio = fechaObj.toISOString().slice(0, 19).replace('T', ' ');
  const reservaFinObj = new Date(fechaObj.getTime() + 2 * 60 * 60 * 1000);
  const reservaFin = reservaFinObj.toISOString().slice(0, 19).replace('T', ' ');

  console.log(`Consultando mesas reservadas entre ${reservaInicio} y ${reservaFin}`);

  const sql = `
    SELECT mesa_id 
    FROM reservas 
    WHERE NOT (
      fecha_hora + INTERVAL 2 HOUR <= ? OR
      fecha_hora >= ?
    )
  `;

  connection.query(sql, [reservaInicio, reservaFin], (err, results) => {
    if (err) {
      console.error("Error obteniendo reservas:", err);
      return res.status(500).json({ error: "Error al obtener las reservas." });
    }

    // Convertimos los mesa_id numéricos a "table-<n>"
    const mesasFormateadas = results.map(r => ({
      mesa_id: r.mesa_id
    }));

    console.log('Mesas reservadas devueltas al frontend:', mesasFormateadas);
    res.json(mesasFormateadas);
  });
});


//vista quiz
router.get('/quiz', (req, res) => {
  res.render('quiz');
});




//*********************************************************
//*********************************************************
//         controlador: LOGOUT request tipo->(POST "/logout")
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

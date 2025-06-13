const express = require('express');
const router = express.Router();
const librosPorCategoria = {
  intenso: [
    { titulo: 'El nombre del viento', autor: 'Patrick Rothfuss', descripcion: 'Una historia épica de fantasía y magia.' },
    { titulo: '1984', autor: 'George Orwell', descripcion: 'Una distopía clásica sobre vigilancia y control.' }
  ],
  dulce: [
    { titulo: 'Orgullo y prejuicio', autor: 'Jane Austen', descripcion: 'Una novela romántica llena de ingenio.' },
    { titulo: 'El Alquimista', autor: 'Paulo Coelho',  descripcion: 'Un viaje espiritual para encontrar tu destino.' }
  ],
  suave: [
    { titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', descripcion: 'Un cuento poético para todas las edades.' },
    { titulo: 'La sombra del viento', autor: 'Carlos Ruiz Zafón', descripcion: 'Un misterio literario en la Barcelona de los 40.' }
  ]
};
const productosPorCategoriaYMomento = {
  intenso: {
    mañana: [
      {
        nombre: 'Espresso',
        descripcion: 'Un café corto e intenso para empezar bien el día.',
        imagen: 'imagenes/productos/1.jpg'
      },
      {
        nombre: 'Café Americano',
        descripcion: 'Espresso con agua caliente, ideal para arrancar la jornada.',
        imagen: 'imagenes/productos/2.jpg'
      }
    ],
    tarde: [
      {
        nombre: 'Café Americano',
        descripcion: 'Sabor fuerte, ideal para la tarde sin pasarse de cafeína.',
        imagen: 'imagenes/productos/2.jpg'
      }
    ],
    noche: [
      {
        nombre: 'Café Americano',
        descripcion: 'Versión descafeinada sugerida. Ideal si te gusta intenso, pero suave para dormir.',
        imagen: 'imagenes/productos/2.jpg'
      }
    ]
  },
  dulce: {
    mañana: [
      {
        nombre: 'Latte',
        descripcion: 'Café con mucha leche vaporizada, suave y dulce para empezar el día.',
        imagen: 'imagenes/productos/3.jpg'
      },
      {
        nombre: 'Capuccino',
        descripcion: 'Café espumoso con un toque dulce, ideal en la mañana.',
        imagen: 'imagenes/productos/6.jpg'
      }
    ],
    tarde: [
      {
        nombre: 'Macchiato',
        descripcion: 'Un espresso con un toque de leche para un descanso dulce.',
        imagen: 'imagenes/productos/5.jpg'
      }
    ],
    noche: [
      {
        nombre: 'Latte',
        descripcion: 'Se recomienda descafeinado si es por la noche. Cremoso y dulce.',
        imagen: 'imagenes/productos/3.jpg'
      }
    ]
  },
  suave: {
    mañana: [
      {
        nombre: 'Flat White',
        descripcion: 'Café equilibrado y suave, perfecto para empezar relajado.',
        imagen: 'imagenes/productos/4.jpg'
      }
    ],
    tarde: [
      {
        nombre: 'Iced Americano',
        descripcion: 'Refrescante, suave y perfecto para la tarde.',
        imagen: 'imagenes/productos/7.jpg'
      }
    ],
    noche: [
      {
        nombre: 'Flat White',
        descripcion: 'Se recomienda descafeinado si es por la noche. Suave y reconfortante.',
        imagen: 'imagenes/productos/4.jpg'
      }
    ]
  }
};



router.post('/', (req, res) => {
  const { sabor, momento } = req.body;

  const productos = productosPorCategoriaYMomento[sabor]?.[momento];
  const libros = librosPorCategoria[sabor];

  if (!productos || !libros) {
    return res.status(400).json({ error: "Preferencias no válidas" });
  }

  const productoAleatorio = productos[Math.floor(Math.random() * productos.length)];
  const libroAleatorio = libros[Math.floor(Math.random() * libros.length)];

  res.json({
    cafe: productoAleatorio,
    libro: libroAleatorio
  });
});


module.exports = router;

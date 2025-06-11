const express = require('express');
const router = express.Router();
const librosPorCategoria = {
  intenso: [
    { titulo: 'El nombre del viento', autor: 'Patrick Rothfuss', imagen: 'imagenes/libros/1.jpg', descripcion: 'Una historia épica de fantasía y magia.' },
    { titulo: '1984', autor: 'George Orwell', imagen: 'imagenes/libros/2.jpg', descripcion: 'Una distopía clásica sobre vigilancia y control.' }
  ],
  dulce: [
    { titulo: 'Orgullo y prejuicio', autor: 'Jane Austen', imagen: 'imagenes/libros/3.jpg', descripcion: 'Una novela romántica llena de ingenio.' },
    { titulo: 'El Alquimista', autor: 'Paulo Coelho', imagen: 'imagenes/libros/4.jpg', descripcion: 'Un viaje espiritual para encontrar tu destino.' }
  ],
  suave: [
    { titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', imagen: 'imagenes/libros/5.jpg', descripcion: 'Un cuento poético para todas las edades.' },
    { titulo: 'La sombra del viento', autor: 'Carlos Ruiz Zafón', imagen: 'imagenes/libros/6.jpg', descripcion: 'Un misterio literario en la Barcelona de los 40.' }
  ]
};

const cafesIntensos = [
  {
    nombre: 'Espresso',
    descripcion: 'Un café corto e intenso, ideal para los amantes del sabor fuerte.',
    imagen: 'imagenes/productos/1.jpg'
  },
  {
    nombre: 'Café Americano',
    descripcion: 'Espresso rebajado con agua caliente, suave pero con carácter.',
    imagen: 'imagenes/productos/2.jpg'
  }
];

const cafesConLeche = [
  {
    nombre: 'Latte',
    descripcion: 'Café suave con mucha leche vaporizada, cremoso y reconfortante.',
    imagen: 'imagenes/productos/3.jpg'
  },
  {
    nombre: 'Flat White',
    descripcion: 'Similar al latte, pero con más café y menos espuma. Más equilibrado.',
    imagen: 'imagenes/productos/4.jpg'
  },
  {
    nombre: 'Macchiato',
    descripcion: 'Espresso manchado con un toque de leche. Pequeño pero potente.',
    imagen: 'imagenes/productos/5.jpg'
  },
  {
    nombre: 'Capuccino',
    descripcion: 'Café espresso con leche y mucha espuma, perfecto para media mañana.',
    imagen: 'imagenes/productos/6.jpg'
  }
];

const cafesFrios = [
  {
    nombre: 'Iced Americano',
    descripcion: 'Americano servido con hielo, ideal para los días calurosos.',
    imagen: 'imagenes/productos/7.jpg'
  }
];

// Mapeo por sabor
const productosPorCategoria = {
  intenso: cafesIntensos,
  dulce: cafesConLeche,
  suave: cafesFrios
};

router.post('/', (req, res) => {
  const { sabor } = req.body;
  const productos = productosPorCategoria[sabor];
  const libros = librosPorCategoria[sabor];

  if (!productos || !libros) {
    return res.status(400).json({ error: "Preferencia no válida" });
  }

  const productoAleatorio = productos[Math.floor(Math.random() * productos.length)];
  const libroAleatorio = libros[Math.floor(Math.random() * libros.length)];

  // Respondemos con ambos datos
  res.json({
    cafe: productoAleatorio,
    libro: libroAleatorio
  });
});

module.exports = router;

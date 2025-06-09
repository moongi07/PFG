const express = require('express');
const router = express.Router();

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

  if (!productos) {
    return res.status(400).json({ error: "Preferencia no válida" });
  }

  const productoAleatorio = productos[Math.floor(Math.random() * productos.length)];

  res.json(productoAleatorio);
});

module.exports = router;

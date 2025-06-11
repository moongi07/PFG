const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
     
  const eventos = [
    {
      title: 'Cata de café latinoamericano',
      start: '2025-06-10',
      details: 'Una experiencia de degustación en la cafetería Central',
      location: 'Cafetería Central',
      color: '#B7A05D'
    },
    {
      title: 'Taller de latte art',
      start: '2025-06-12',
      details: 'Aprende a decorar tu café como un profesional',
      location: 'Cafetería Central',
      color: '#B7A05D'
    },
    {
      title: 'Club de lectura: "1984"',
      start: '2025-06-07',
      details: 'Debate y análisis del clásico de Orwell',
      location: 'Cafetería Central',
      color: '#8998AB'
    },
      {
      title: 'Concierto Wasia Project',
      start: '2025-06-18',
      details: 'Escucha en directo al duo británico Wasia project',
      location: 'Cafetería Central',
      color: '#9726B6'
    }
  ];

  // Agrega el enlace a Google Calendar para cada evento
  const eventosConEnlace = eventos.map(evento => {
    const url = `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(evento.title)}` +
      `&dates=${evento.start.replace(/-/g, '')}/${evento.start.replace(/-/g, '')}` +
      `&details=${encodeURIComponent(evento.details)}` +
      `&location=${encodeURIComponent(evento.location)}` +
      `&sf=true&output=xml`;

    return {
      ...evento,
      urlGoogleCalendar: url
    };
  });

  // devuelve los eventos como JSON
  res.json(eventosConEnlace);
});

module.exports = router;


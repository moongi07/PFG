document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    events: function(fetchInfo, successCallback, failureCallback) {
    fetch('/api/eventos?_=' + new Date().getTime())
    .then(response => response.json())
    .then(data => successCallback(data))
    .catch(error => failureCallback(error));
    },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },

    eventClick: function (info) {
      
      if (info.event.extendedProps.urlGoogleCalendar) {
        window.open(info.event.extendedProps.urlGoogleCalendar, '_blank');
      } else {
        alert('Este evento no tiene enlace para añadir a Google Calendar.');
      }

      //evita que el navegador haga la acción predeterminada asociada al evento, abriria por defecto: https://example.com
      info.jsEvent.preventDefault();
    }
  });

  calendar.render();
  //volver a cargar para actualizar la api con los nuevos eventos
  calendar.refetchEvents();

});

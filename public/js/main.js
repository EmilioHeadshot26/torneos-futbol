// Funciones generales
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Manejar formularios con AJAX
    document.querySelectorAll('.ajax-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: form.method,
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          if (form.dataset.redirect) {
            window.location.href = form.dataset.redirect;
          }
        } else {
          alert(result.message || 'Error al procesar la solicitud');
        }
      });
    });
  });
  
  // Funciones específicas para tablas de posiciones
  function actualizarTablaPosiciones() {
    fetch('/api/tabla-posiciones')
      .then(response => response.json())
      .then(data => {
        const tabla = document.getElementById('tabla-posiciones');
        tabla.innerHTML = '';
        
        data.forEach((equipo, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${equipo.nombre}</td>
            <td>${equipo.pj}</td>
            <td>${equipo.pg}</td>
            <td>${equipo.pe}</td>
            <td>${equipo.pp}</td>
            <td>${equipo.gf}</td>
            <td>${equipo.gc}</td>
            <td>${equipo.dg}</td>
            <td><strong>${equipo.pts}</strong></td>
          `;
          tabla.appendChild(row);
        });
      });
  }
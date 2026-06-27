// Cargar cuentas del localStorage
let cuentas = JSON.parse(localStorage.getItem('cuentas')) || [];

const renderHistorial = () => {
    const container = document.getElementById('historial-container');
    const textoTotal = document.getElementById('total-dia-texto');
    const textoVentas = document.getElementById('cantidad-ventas');
    
    container.innerHTML = '';
    let sumaTotal = 0;

    // Filtrar solo las cuentas con estado 'closed'
    const cerradas = cuentas.filter(c => c.status === 'closed');

    if (cerradas.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay ventas registradas en este turno.</div>';
        textoTotal.innerText = '$0.00';
        textoVentas.innerText = '0 ventas completadas';
        document.getElementById('btn-corte').disabled = true;
        document.getElementById('btn-corte').style.background = '#ccc';
        return;
    }

    // Invertir el arreglo para ver las ventas más recientes primero
    cerradas.slice().reverse().forEach(cuenta => {
        sumaTotal += cuenta.total;

        // Extraer la hora del ID (formato: acc_17145839293)
        let horaTexto = "Hora desconocida";
        if (cuenta.id.startsWith('acc_')) {
            const timestamp = parseInt(cuenta.id.split('_')[1]);
            const fecha = new Date(timestamp);
            horaTexto = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const div = document.createElement('div');
        div.className = 'card-historial';
        div.innerHTML = `
            <div class="card-info">
                <h4>${cuenta.name}</h4>
                <p>Abierta a las: ${horaTexto} • ${cuenta.items.length} productos</p>
            </div>
            <div class="card-total">
                $${cuenta.total.toFixed(2)}
            </div>
        `;
        container.appendChild(div);
    });

    // Actualizar los textos de arriba
    textoTotal.innerText = `$${sumaTotal.toFixed(2)}`;
    textoVentas.innerText = `${cerradas.length} ventas completadas`;
};

// Lógica del botón "Hacer Corte de Caja"
document.getElementById('btn-corte').addEventListener('click', () => {
    if (confirm('¿Estás seguro de hacer el corte de caja? Esto limpiará el historial de ventas para empezar un nuevo turno.')) {
        
        // Conservar solo las cuentas que aún están 'open' (mesas activas que aún no pagan)
        cuentas = cuentas.filter(c => c.status !== 'closed');
        
        // Guardar el nuevo estado en localStorage
        localStorage.setItem('cuentas', JSON.stringify(cuentas));
        
        // Refrescar la vista (se pondrá en ceros)
        renderHistorial();
        alert('Corte de caja realizado con éxito. ¡Buen trabajo hoy!');
    }
});

// Iniciar al cargar la pantalla
renderHistorial();
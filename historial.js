// Cargar cuentas del localStorage
let cuentas = JSON.parse(localStorage.getItem('cuentas')) || [];

const renderHistorial = () => {
    const container = document.getElementById('historial-container');
    const textoVentas = document.getElementById('cantidad-ventas');
    
    // CONEXIONES HTML: Vinculamos todos los IDs que tienes en tu historial.html
    const textoTotalGigante = document.getElementById('total-dia-texto');   // El monto de arriba
    const textoTotalCaja = document.getElementById('total-vendido');       // El "Total en Caja" de la caja blanca
    const textoGananciaNeta = document.getElementById('ganancia-neta');     // La "Ganancia Neta" verde de la caja blanca
    const textoGananciaDia = document.getElementById('ganancia-dia-texto');   // El texto de abajo
    
    container.innerHTML = '';
    let sumaTotal = 0;
    let sumaGanancia = 0; 

    // Filtrar solo las cuentas con estado 'closed'
    const cerradas = cuentas.filter(c => c.status === 'closed');

    if (cerradas.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay ventas registradas en este turno.</div>';
        
        // Si no hay ventas, ponemos absolutamente todo en $0.00
        if (textoTotalGigante) textoTotalGigante.innerText = '$0.00';
        if (textoTotalCaja) textoTotalCaja.innerText = '$0.00';
        if (textoGananciaNeta) textoGananciaNeta.innerText = '$0.00';
        if (textoGananciaDia) textoGananciaDia.innerText = '$0.00';
        
        textoVentas.innerText = '0 ventas completadas';
        document.getElementById('btn-corte').disabled = true;
        document.getElementById('btn-corte').style.background = '#ccc';
        return;
    }

    // Invertir el arreglo para ver las ventas más recientes primero
    cerradas.slice().reverse().forEach(cuenta => {
        sumaTotal += cuenta.total;

        // Entramos a los productos de esta cuenta para calcular la ganancia
        if (cuenta.items) {
            cuenta.items.forEach(item => {
                const venta = item.priceAtTime || 0;
                const costo = item.costAtTime || 0; // Viene desde pos.js
                const cantidad = item.quantity || 1;
                
                // (Precio Venta - Precio Costo) * Cantidad
                sumaGanancia += (venta - costo) * cantidad;
            });
        }

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

    // IMPRESIÓN DE RESULTADOS: Actualizamos cada rincón de la pantalla
    if (textoTotalGigante) textoTotalGigante.innerText = `$${sumaTotal.toFixed(2)}`;
    if (textoTotalCaja) textoTotalCaja.innerText = `$${sumaTotal.toFixed(2)}`;
    if (textoGananciaNeta) textoGananciaNeta.innerText = `$${sumaGanancia.toFixed(2)}`;
    if (textoGananciaDia) textoGananciaDia.innerText = `$${sumaGanancia.toFixed(2)}`;
    
    textoVentas.innerText = `${cerradas.length} ventas completadas`;
};

// Lógica del botón "Hacer Corte de Caja"
document.getElementById('btn-corte').addEventListener('click', () => {
    if (confirm('¿Estás seguro de hacer el corte de caja? Esto limpiará el historial de ventas para empezar un nuevo turno.')) {
        
        // Conservar solo las cuentas que aún están 'open'
        cuentas = cuentas.filter(c => c.status !== 'closed');
        
        // Guardar el nuevo estado en localStorage
        localStorage.setItem('cuentas', JSON.stringify(cuentas));
        
        // Refrescar la vista
        renderHistorial();
        alert('Corte de caja realizado con éxito. ¡Buen trabajo hoy!');
    }
});

// Iniciar al cargar la pantalla
renderHistorial();
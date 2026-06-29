// Ejecutar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', cargarHistorial);

function cargarHistorial() {
    // 1. Obtener el historial de la memoria (Si no hay, usamos un arreglo vacío)
    const historialVentas = JSON.parse(localStorage.getItem('historial_ventas')) || [];
    const contenedorLista = document.getElementById('lista-historial');
    
    let totalAcumulado = 0;
    contenedorLista.innerHTML = ""; // Limpiar antes de pintar

    // 2. Verificar si está vacío
    if (historialVentas.length === 0) {
        contenedorLista.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #888;">
                No hay cobros registrados aún.
            </div>`;
        actualizarTotales(0, 0);
        return;
    }

    // 3. Recorrer cada transacción (incluso las divididas) para pintarlas y sumarlas
    historialVentas.forEach(transaccion => {
        totalAcumulado += transaccion.monto;

        // Crear el elemento visual para la lista
        let fila = document.createElement('div');
        fila.className = "item-transaccion";
        
        fila.innerHTML = `
            <div>
                <strong style="font-size: 1.1em; color: #333;">${transaccion.mesa}</strong>
                <div style="color: #888; font-size: 0.9em; margin-top: 4px;">
                    Hora: ${transaccion.fecha} | Tipo: ${transaccion.tipo}
                </div>
            </div>
            <div class="monto-transaccion">
                $${transaccion.monto.toFixed(2)}
            </div>
        `;
        
        contenedorLista.appendChild(fila);
    });

    // 4. Actualizar los números grandotes de arriba
    actualizarTotales(totalAcumulado, historialVentas.length);
}

function actualizarTotales(total, cantidad) {
    document.getElementById('gran-total-corte').innerText = `$${total.toFixed(2)}`;
    document.getElementById('total-operaciones').innerText = cantidad;
}

// Lógica para el botón de Cerrar Caja / Limpiar
document.getElementById('btn-limpiar-historial').addEventListener('click', function() {
    const historialVentas = JSON.parse(localStorage.getItem('historial_ventas')) || [];
    
    if (historialVentas.length === 0) {
        alert("La caja ya está vacía.");
        return;
    }

    const confirmar = confirm("¿Estás seguro de cerrar la caja? Esto borrará el historial de cobros actual de la pantalla para empezar uno nuevo.");
    
    if (confirmar) {
        // Borramos el registro específico de ventas
        localStorage.removeItem('historial_ventas');
        
        // Recargamos la interfaz para que quede en ceros
        cargarHistorial();
        alert("Caja cerrada exitosamente. El historial ha sido limpiado.");
    }
});
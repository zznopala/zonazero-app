// Recuperamos datos de localStorage
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let cuentas = JSON.parse(localStorage.getItem('cuentas')) || [];

// Simulamos que el usuario seleccionó una cuenta desde la pantalla principal
// (En la práctica, pasarías este ID por URL o mediante el estado de la app)
let cuentaActivaId = localStorage.getItem('cuentaActivaId'); 
let cuentaActiva = cuentas.find(c => c.id === cuentaActivaId);

// ==========================================
// 1. INICIALIZACIÓN
// ==========================================
const iniciarPOS = () => {
    if (!cuentaActiva) {
        alert("Error: No hay cuenta seleccionada.");
        // window.location.href = 'index.html'; // Descomentar para producción
        return;
    }

    document.getElementById('nombre-mesa-activa').innerText = cuentaActiva.name;
    document.getElementById('desc-mesa-activa').innerText = cuentaActiva.description || '';

    // Filtrar solo productos activos
    const productosActivos = productos.filter(p => p.activo);
    renderizarCatalogo(productosActivos);
    renderizarTicket();
};

// ==========================================
// 2. RENDERIZAR CATÁLOGO DE PRODUCTOS
// ==========================================
const renderizarCatalogo = (listaProductos) => {
    const grid = document.getElementById('grid-productos');
    grid.innerHTML = '';

    listaProductos.forEach(prod => {
        const btn = document.createElement('button');
        btn.className = 'btn-producto';
        btn.onclick = () => agregarProducto(prod);
        
        btn.innerHTML = `
            <span class="nombre">${prod.nombre}</span>
            <span class="precio">$${prod.precio.toFixed(2)}</span>
        `;
        grid.appendChild(btn);
    });
};

window.filtrarCat = (categoria) => {
    // Actualizar botones visualmente
    document.querySelectorAll('.btn-cat').forEach(b => b.classList.remove('activo'));
    event.target.classList.add('activo');

    // Filtrar productos
    let activos = productos.filter(p => p.activo);
    if (categoria !== 'Todas') {
        activos = activos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }
    renderizarCatalogo(activos);
};

// ==========================================
// 3. LÓGICA DEL TICKET (Agregar, Sumar, Restar)
// ==========================================

let productoSeleccionado = null;
let seleccionVariantes = [];

const agregarProducto = (prod) => {
    // Verificamos si el producto tiene variantes configuradas
    if (prod.variantes && prod.variantes.length > 0) {
        productoSeleccionado = prod;
        seleccionVariantes = []; // Reseteamos selecciones anteriores
        abrirModalModificadores(prod);
    } else {
        // Si es un producto normal (sin variantes), se agrega directamente
        cuentaActiva.items.push({
            productId: prod.id,
            nombre: prod.nombre,
            priceAtTime: parseFloat(prod.precio) || parseFloat(prod.precioVenta), 
            costAtTime: parseFloat(prod.costo) || 0, // Guardamos el costo para calcular ganancias
            quantity: 1
        });
        
        // Guardamos en memoria y refrescamos la pantalla
        guardarYActualizar();
    }
};

window.modificarCantidad = (productId, delta) => {
    const index = cuentaActiva.items.findIndex(i => i.productId === productId);
    if (index !== -1) {
        cuentaActiva.items[index].quantity += delta;
        
        // Si llega a 0, lo eliminamos de la cuenta
        if (cuentaActiva.items[index].quantity <= 0) {
            cuentaActiva.items.splice(index, 1);
        }
    }
    guardarYActualizar();
};

const guardarYActualizar = () => {
    // Calcular nuevo total
    cuentaActiva.total = cuentaActiva.items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
    
    // Guardar en localStorage
    const cuentaIndex = cuentas.findIndex(c => c.id === cuentaActivaId);
    cuentas[cuentaIndex] = cuentaActiva;
    localStorage.setItem('cuentas', JSON.stringify(cuentas));

    // Refrescar UI
    renderizarTicket();
};

const renderizarTicket = () => {
    const lista = document.getElementById('lista-orden');
    const btnCobrar = document.getElementById('btn-cobrar');
    lista.innerHTML = '';

    if (cuentaActiva.items.length === 0) {
        lista.innerHTML = '<div class="empty-state">Agrega productos tocando los botones de arriba.</div>';
        btnCobrar.disabled = true;
    } else {
        btnCobrar.disabled = false;
        
        cuentaActiva.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-orden';
            const subtotal = item.priceAtTime * item.quantity;

            div.innerHTML = `
                <div class="item-info">
                    <span class="item-nombre">${item.nombre}</span>
                    <span class="item-precio">$${item.priceAtTime.toFixed(2)} c/u (Sub: $${subtotal.toFixed(2)})</span>
                </div>
                <div class="controles-cant">
                    <button class="btn-cant" onclick="modificarCantidad('${item.productId}', -1)">-</button>
                    <span class="cant-numero">${item.quantity}</span>
                    <button class="btn-cant" onclick="modificarCantidad('${item.productId}', 1)">+</button>
                </div>
            `;
            lista.appendChild(div);
        });
    }

    document.getElementById('gran-total').innerText = `$${cuentaActiva.total.toFixed(2)}`;
};

// Test Rápido: Si no hay cuenta activa en localStorage, creamos una de prueba
if (!cuentaActivaId) {
    const cuentaPrueba = { id: 'test_1', name: 'Mesa Prueba', description: 'Test', status: 'open', items: [], total: 0 };
    cuentas.push(cuentaPrueba);
    localStorage.setItem('cuentas', JSON.stringify(cuentas));
    localStorage.setItem('cuentaActivaId', 'test_1');
    cuentaActivaId = 'test_1';
    cuentaActiva = cuentaPrueba;
}

// ==========================================
// 4. LÓGICA DE COBRO, DIVISIÓN Y CAMBIO
// ==========================================

const modalCobrar = document.getElementById('modal-cobrar');
const inputDividir = document.getElementById('input-dividir');
const inputPago = document.getElementById('input-pago');
const btnCobrar = document.getElementById('btn-cobrar'); // El botón rojo del ticket

// Variables de estado temporal para el cobro
let montoAPagarActual = 0; 

// Abrir el modal al tocar "Cobrar / Cerrar Mesa"
btnCobrar.addEventListener('click', () => {
    document.getElementById('cobro-nombre-mesa').innerText = cuentaActiva.name;
    document.getElementById('cobro-total-texto').innerText = `$${cuentaActiva.total.toFixed(2)}`;
    
    // Reiniciar inputs
    inputDividir.value = 1;
    inputPago.value = '';
    montoAPagarActual = cuentaActiva.total;
    
    document.getElementById('cobro-dividido-texto').classList.add('hidden');
    calcularCambio(); // Resetea la vista del cambio

    document.getElementById('input-whatsapp').value = '';
    
    modalCobrar.classList.remove('hidden');
});

window.cerrarModalCobro = () => {
    modalCobrar.classList.add('hidden');
};

// --- EL MOTOR MATEMÁTICO ---

// 1. Escuchar cambios en la división de cuenta
inputDividir.addEventListener('input', () => {
    let divisor = parseInt(inputDividir.value);
    const textoDividido = document.getElementById('cobro-dividido-texto');
    const montoDivididoSpan = document.getElementById('monto-dividido');

    // Validar que no dividan entre 0 o negativo
    if (isNaN(divisor) || divisor < 1) {
        divisor = 1;
    }

    if (divisor > 1) {
        // Lógica: Total / Número de personas
        montoAPagarActual = cuentaActiva.total / divisor;
        montoDivididoSpan.innerText = `$${montoAPagarActual.toFixed(2)}`;
        textoDividido.classList.remove('hidden');
    } else {
        // Lógica: 1 sola persona paga todo
        montoAPagarActual = cuentaActiva.total;
        textoDividido.classList.add('hidden');
    }

    // Recalcular el cambio automáticamente si ya habían puesto un billete
    calcularCambio();
});

// 2. Escuchar cambios en el billete con el que pagan
inputPago.addEventListener('input', calcularCambio);

function calcularCambio() {
    const textoCambio = document.getElementById('cobro-cambio-texto');
    let montoRecibido = parseFloat(inputPago.value);

    // Si el input está vacío, no mostrar cambio aún
    if (isNaN(montoRecibido)) {
        textoCambio.innerText = 'Cambio: $0.00';
        textoCambio.classList.remove('deuda');
        return;
    }

    // Lógica: Cambio = Recibido - A Pagar
    let cambio = montoRecibido - montoAPagarActual;

    if (cambio < 0) {
        // Falta dinero (Rojo)
        textoCambio.innerText = `Faltan: $${Math.abs(cambio).toFixed(2)}`;
        textoCambio.classList.add('deuda');
    } else {
        // Sobra dinero (Cambio normal - Verde)
        textoCambio.innerText = `Cambio: $${cambio.toFixed(2)}`;
        textoCambio.classList.remove('deuda');
    }
}

// 3. Botón Final: Cerrar la cuenta y generar WhatsApp
// 3. Botón Final: Cerrar la cuenta y generar WhatsApp
document.getElementById('btn-cerrar-cuenta').addEventListener('click', () => {
    // 1. Buscar la cuenta y cambiar estado a cerrada
    const cuentaIndex = cuentas.findIndex(c => c.id === cuentaActivaId);
    if (cuentaIndex !== -1) {
        cuentas[cuentaIndex].status = 'closed';
        localStorage.setItem('cuentas', JSON.stringify(cuentas));
    }

    // 2. Construir el Ticket
    let ticket = `*Ticket - Z🎱NAZER🧊*\n`;
    ticket += `Mesa/Cliente: ${cuentaActiva.name}\n`;
    ticket += `------------------------\n`;
    
    cuentaActiva.items.forEach(item => {
        const subtotal = item.priceAtTime * item.quantity;
        ticket += `${item.quantity}x ${item.nombre} - $${subtotal.toFixed(2)}\n`;
    });
    
    ticket += `------------------------\n`;
    ticket += `*Total: $${cuentaActiva.total.toFixed(2)}*\n`;

    const divisor = parseInt(document.getElementById('input-dividir').value) || 1;
    if (divisor > 1) {
        ticket += `(Dividido entre ${divisor} personas: $${(cuentaActiva.total / divisor).toFixed(2)} c/u)\n`;
    }

    const montoRecibido = parseFloat(document.getElementById('input-pago').value);
    if (!isNaN(montoRecibido)) {
        ticket += `Pago con: $${montoRecibido.toFixed(2)}\n`;
        const cambioTotal = montoRecibido - (cuentaActiva.total / divisor);
        ticket += `Cambio: $${cambioTotal.toFixed(2)}\n`;
    }
    
    ticket += `\n¡Gracias por tu preferencia! 🎱🧊`;

    // 3. Lógica directa de WhatsApp
    // Obtenemos el número del input y le quitamos los espacios vacíos
    let numeroCliente = document.getElementById('input-whatsapp').value.replace(/\s+/g, '');
    
    // Si escribiste un número, abrimos WhatsApp directo a ese número
    if (numeroCliente !== "") {
        // Agregamos el 52 (Código de México) directamente al enlace
        const url = `https://wa.me/52${numeroCliente}?text=${encodeURIComponent(ticket)}`;
        window.open(url, '_blank');
    }

    // 4. Limpiar la mesa activa y regresar al inicio
    localStorage.removeItem('cuentaActivaId');
    window.location.href = 'index.html'; 

    
});

iniciarPOS();


// ==========================================
// CONFIGURACIÓN E INICIALIZACIÓN DE DATOS
// ==========================================
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let cuentas = JSON.parse(localStorage.getItem('cuentas')) || [];

let cuentaActivaId = localStorage.getItem('cuentaActivaId'); 
let cuentaActiva = cuentas.find(c => c.id === cuentaActivaId);

const iniciarPOS = () => {
    if (!cuentaActiva) {
        alert("Error: No hay cuenta seleccionada.");
        return;
    }

    document.getElementById('nombre-mesa-activa').innerText = cuentaActiva.name;
    document.getElementById('desc-mesa-activa').innerText = cuentaActiva.description || '';

    const productosActivos = productos.filter(p => p.activo);
    renderizarCatalogo(productosActivos);
    renderizarTicket();
};

// ==========================================
// RENDERIZAR CATÁLOGO DE PRODUCTOS
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
    document.querySelectorAll('.btn-cat').forEach(b => b.classList.remove('activo'));
    if (event && event.target) event.target.classList.add('activo');

    let activos = productos.filter(p => p.activo);
    if (categoria !== 'Todas') {
        activos = activos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }
    renderizarCatalogo(activos);
};

// ==========================================
// LÓGICA DEL TICKET (Agregar, Sumar, Restar)
// ==========================================
let productoSeleccionado = null;
let seleccionVariantes = [];

const agregarProducto = (prod) => {
    if (prod.variantes && prod.variantes.length > 0) {
        productoSeleccionado = prod;
        seleccionVariantes = []; 
        if (typeof abrirModalModificadores === 'function') {
            abrirModalModificadores(prod);
        }
    } else {
        cuentaActiva.items.push({
            productId: prod.id || 'prod_' + Date.now() + Math.random().toString(36).substr(2, 5),
            nombre: prod.nombre,
            priceAtTime: parseFloat(prod.precio) || parseFloat(prod.precioVenta) || 0, 
            costAtTime: parseFloat(prod.costo) || 0, 
            quantity: 1
        });
        guardarYActualizar();
    }
};

window.modificarCantidad = (productId, delta) => {
    const index = cuentaActiva.items.findIndex(i => i.productId === productId);
    if (index !== -1) {
        cuentaActiva.items[index].quantity += delta;
        if (cuentaActiva.items[index].quantity <= 0) {
            cuentaActiva.items.splice(index, 1);
        }
    }
    guardarYActualizar();
};

const guardarYActualizar = () => {
    cuentaActiva.total = cuentaActiva.items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
    
    const cuentaIndex = cuentas.findIndex(c => c.id === cuentaActivaId);
    if (cuentaIndex !== -1) {
        cuentas[cuentaIndex] = cuentaActiva;
    }
    localStorage.setItem('cuentas', JSON.stringify(cuentas));
    renderizarTicket();
};

const renderizarTicket = () => {
    const lista = document.getElementById('lista-orden');
    const btnCobrar = document.getElementById('btn-cobrar');
    lista.innerHTML = '';

    if (!cuentaActiva || cuentaActiva.items.length === 0) {
        lista.innerHTML = '<div class="empty-state">Agrega productos tocando los botones de arriba.</div>';
        if (btnCobrar) btnCobrar.disabled = true;
    } else {
        if (btnCobrar) btnCobrar.disabled = false;
        
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

    const totalElement = document.getElementById('gran-total');
    if (totalElement) {
        totalElement.innerText = `$${(cuentaActiva?.total || 0).toFixed(2)}`;
    }
};

if (!cuentaActivaId) {
    const cuentaPrueba = { id: 'test_1', name: 'Mesa Prueba', description: 'Test', status: 'open', items: [], total: 0 };
    cuentas.push(cuentaPrueba);
    localStorage.setItem('cuentas', JSON.stringify(cuentas));
    localStorage.setItem('cuentaActivaId', 'test_1');
    cuentaActivaId = 'test_1';
    cuentaActiva = cuentaPrueba;
}

// ==========================================
// NUEVO MOTOR DE COBRO SELECCIONABLE Y PARCIAL
// ==========================================
const btnCobrarOriginal = document.getElementById('btn-cobrar');
let totalCobrarPersonaActual = 0;

if (btnCobrarOriginal) {
    btnCobrarOriginal.addEventListener('click', () => {
        const modalNuevo = document.getElementById('modal-cobro');
        if (!modalNuevo) return;

        document.getElementById('nombre-mesa-cobro').innerText = cuentaActiva.name;
        
        // Mostrar Gran Total de la mesa bien grande
        const granTotalMesa = cuentaActiva.items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
        document.getElementById('gran-total-mesa').innerText = `$${granTotalMesa.toFixed(2)}`;

        // Limpiar campos de control
        document.getElementById('monto-pago').value = '';
        document.getElementById('mensaje-cambio').innerHTML = '';

        // Construir lista con checkboxes para seleccionar artículos
        const listaDiv = document.getElementById('lista-productos-dividir');
        listaDiv.innerHTML = ''; 

        cuentaActiva.items.forEach((item, index) => {
            const subtotalItem = item.priceAtTime * item.quantity;
            const div = document.createElement('div');
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `
                <label style="cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 1.1em; width: 100%;">
                    <input type="checkbox" class="chk-item-cobro" data-index="${index}" data-precio="${subtotalItem}" checked style="width: 22px; height: 22px; cursor: pointer;">
                    <span style="flex-grow: 1;">${item.quantity}x ${item.nombre}</span>
                    <strong style="color: #333;">$${subtotalItem.toFixed(2)}</strong>
                </label>
            `;
            listaDiv.appendChild(div);
        });

        // Vincular cálculos automáticos en tiempo real
        document.querySelectorAll('.chk-item-cobro').forEach(chk => {
            chk.addEventListener('change', recalcularTotalCobro);
        });
        document.getElementById('monto-pago').addEventListener('input', recalcularTotalCobro);

        recalcularTotalCobro();
        modalNuevo.style.display = 'block';
    });
}

const recalcularTotalCobro = () => {
    totalCobrarPersonaActual = 0;
    
    document.querySelectorAll('.chk-item-cobro:checked').forEach(chk => {
        totalCobrarPersonaActual += parseFloat(chk.getAttribute('data-precio'));
    });

    document.getElementById('total-a-cobrar-ahora').innerText = `$${totalCobrarPersonaActual.toFixed(2)}`;

    const pago = parseFloat(document.getElementById('monto-pago').value) || 0;
    const mensajeDiv = document.getElementById('mensaje-cambio');

    if (pago > 0) {
        if (pago >= totalCobrarPersonaActual) {
            mensajeDiv.innerHTML = `<span style="color: #28a745;">Cambio: $${(pago - totalCobrarPersonaActual).toFixed(2)}</span>`;
        } else {
            mensajeDiv.innerHTML = `<span style="color: #dc3545;">Faltan: $${(totalCobrarPersonaActual - pago).toFixed(2)}</span>`;
        }
    } else {
        mensajeDiv.innerHTML = ''; 
    }
};

function toggleSeleccionarTodos(marcar) {
    // 1. Buscamos todos los checkboxes individuales dentro de la lista
    const checkboxes = document.querySelectorAll('#lista-productos-dividir input[type="checkbox"]');
    
    // 2. Recorremos cada uno y le asignamos el mismo estado que la casilla maestra
    checkboxes.forEach(chk => {
        chk.checked = marcar;
        
        // 3. ¡Súper importante! Simulamos un clic en cada uno para que 
        // tu sistema recalcule el "Total a Cobrar Ahora" automáticamente.
        chk.dispatchEvent(new Event('change'));
    });
}

// Confirmar cobro y despacho a base de datos / WhatsApp
const btnConfirmarCobro = document.getElementById('btn-confirmar-cobro');
if (btnConfirmarCobro) {
    btnConfirmarCobro.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.chk-item-cobro');
        const indicesPagados = [];
        const indicesRestantes = [];

        checkboxes.forEach(chk => {
            const idx = parseInt(chk.getAttribute('data-index'));
            if (chk.checked) indicesPagados.push(idx);
            else indicesRestantes.push(idx);
        });

        if (indicesPagados.length === 0) {
            alert("Selecciona al menos un producto.");
            return;
        }

        const itemsPagados = indicesPagados.map(i => cuentaActiva.items[i]);
        const itemsPendientes = indicesRestantes.map(i => cuentaActiva.items[i]);
        const montoCobrado = totalCobrarPersonaActual;

        // --- 1. GUARDAR EN HISTÓRICO (Para que el corte de caja sume todo) ---
        let historialVentas = JSON.parse(localStorage.getItem('historial_ventas')) || [];
        historialVentas.push({
            id: 'trans_' + Date.now(),
            mesa: cuentaActiva.name,
            monto: montoCobrado,
            fecha: new Date().toLocaleTimeString(),
            tipo: "Cobro Parcial/Total"
        });
        localStorage.setItem('historial_ventas', JSON.stringify(historialVentas));

        // --- 2. GENERAR MENSAJE Y ENVIAR WHATSAPP ---
        let ticket = `*Ticket - Z🎱NAZER🧊*\n*Mesa: ${cuentaActiva.name}*\n------------------------\n`;
        itemsPagados.forEach(item => {
            ticket += `${item.quantity}x ${item.nombre} - $${(item.priceAtTime * item.quantity).toFixed(2)}\n`;
        });
        ticket += `------------------------\n*Total Pagado: $${montoCobrado.toFixed(2)}*\n\n¡Gracias! 🎱🧊`;

        // Busca el input donde el usuario pone el teléfono en el modal
        const inputWS = document.getElementById('telefono-whatsapp'); 
        if (inputWS && inputWS.value.trim() !== "") {
            let numero = inputWS.value.replace(/\D/g, '');
            window.open(`https://wa.me/52${numero}?text=${encodeURIComponent(ticket)}`, '_blank');
        }

        // --- 3. ACTUALIZAR CUENTA Y CERRAR ---
        const cuentaIndex = cuentas.findIndex(c => c.id === cuentaActivaId);
        
        if (itemsPendientes.length === 0) {
            cuentas[cuentaIndex].status = 'closed';
            localStorage.removeItem('cuentaActivaId');
            localStorage.setItem('cuentas', JSON.stringify(cuentas));
            alert(`Mesa liquidada: $${montoCobrado.toFixed(2)}`);
            window.location.href = 'index.html';
        } else {
            cuentaActiva.items = itemsPendientes;
            cuentaActiva.total = itemsPendientes.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
            cuentas[cuentaIndex] = cuentaActiva;
            localStorage.setItem('cuentas', JSON.stringify(cuentas));
            
            document.getElementById('modal-cobro').style.display = 'none';
            renderizarTicket(); // Corregido: antes tenías un error de dedo "renderizerTicket"
            iniciarPOS();
        }
    });
}

/*const btnConfirmarCobro = document.getElementById('btn-confirmar-cobro');
if (btnConfirmarCobro) {
    btnConfirmarCobro.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.chk-item-cobro');
        const indicesPagados = [];
        const indicesRestantes = [];

        checkboxes.forEach(chk => {
            const idx = parseInt(chk.getAttribute('data-index'));
            if (chk.checked) indicesPagados.push(idx);
            else indicesRestantes.push(idx);
        });

        if (indicesPagados.length === 0) {
            alert("Selecciona al menos un producto.");
            return;
        }

        const itemsPagados = indicesPagados.map(i => cuentaActiva.items[i]);
        const itemsPendientes = indicesRestantes.map(i => cuentaActiva.items[i]);
        const montoCobrado = totalCobrarPersonaActual;

        // --- 1. GUARDAR EN HISTÓRICO (Para que el corte de caja sume todo) ---
        let historialVentas = JSON.parse(localStorage.getItem('historial_ventas')) || [];
        historialVentas.push({
            id: 'trans_' + Date.now(),
            mesa: cuentaActiva.name,
            monto: montoCobrado,
            fecha: new Date().toLocaleTimeString(),
            tipo: "Cobro Parcial/Total"
        });
        localStorage.setItem('historial_ventas', JSON.stringify(historialVentas));

        // --- 2. GENERAR MENSAJE Y ENVIAR WHATSAPP ---
        let ticket = `*Ticket - Z🎱NAZER🧊*\n*Mesa: ${cuentaActiva.name}*\n------------------------\n`;
        itemsPagados.forEach(item => {
            ticket += `${item.quantity}x ${item.nombre} - $${(item.priceAtTime * item.quantity).toFixed(2)}\n`;
        });
        ticket += `------------------------\n*Total Pagado: $${montoCobrado.toFixed(2)}*\n\n¡Gracias! 🎱🧊`;

        // Busca el input donde el usuario pone el teléfono en el modal
        const inputWS = document.getElementById('telefono-whatsapp'); 
        if (inputWS && inputWS.value.trim() !== "") {
            let numero = inputWS.value.replace(/\D/g, '');
            window.open(`https://wa.me/52${numero}?text=${encodeURIComponent(ticket)}`, '_blank');
        }

        // --- 3. ACTUALIZAR CUENTA Y CERRAR ---
        const cuentaIndex = cuentas.findIndex(c => c.id === cuentaActivaId);
        
        if (itemsPendientes.length === 0) {
            cuentas[cuentaIndex].status = 'closed';
            localStorage.removeItem('cuentaActivaId');
            alert(`Mesa liquidada: $${montoCobrado.toFixed(2)}`);
            window.location.href = 'index.html';
        } else {
            cuentaActiva.items = itemsPendientes;
            cuentaActiva.total = itemsPendientes.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
            cuentas[cuentaIndex] = cuentaActiva;
            localStorage.setItem('cuentas', JSON.stringify(cuentas));
            
            document.getElementById('modal-cobro').style.display = 'none';
            renderizarTicket(); // Corregido: antes tenías un error de dedo "renderizerTicket"
            iniciarPOS();
        }
    });
}

const btnConfirmarCobro = document.getElementById('btn-confirmar-cobro');

if (btnConfirmarCobro) {
    btnConfirmarCobro.addEventListener('click', () => {
       
        const checkboxes = document.querySelectorAll('.chk-item-cobro');
        const indicesPagados = [];
        const indicesRestantes = [];

        checkboxes.forEach(chk => {
            const idx = parseInt(chk.getAttribute('data-index'));
            if (chk.checked) {
                indicesPagados.push(idx);
            } else {
                indicesRestantes.push(idx);
            }
        });

        if (indicesPagados.length === 0) {
            alert("Por favor, selecciona al menos un producto para proceder con el cobro.");
            return;
        }

        const itemsPagados = indicesPagados.map(i => cuentaActiva.items[i]);
        const itemsPendientes = indicesRestantes.map(i => cuentaActiva.items[i]);

        // ==========================================
        // GENERACIÓN DINÁMICA DEL TICKET DE WHATSAPP
        // ==========================================
        let ticket = `*Ticket - Z🎱NAZER🧊*\n`;
        if (itemsPendientes.length > 0) {
            ticket += `Mesa/Cliente: ${cuentaActiva.name} (Pago Parcial)\n`;
        } else {
            ticket += `Mesa/Cliente: ${cuentaActiva.name}\n`;
        }
        ticket += `------------------------\n`;
        
        itemsPagados.forEach(item => {
            const sub = item.priceAtTime * item.quantity;
            ticket += `${item.quantity}x ${item.nombre} - $${sub.toFixed(2)}\n`;
        });
        
        ticket += `------------------------\n`;
        ticket += `*Total Pagado: $${totalCobrarPersonaActual.toFixed(2)}*\n`;

        const pagoRecibido = parseFloat(document.getElementById('monto-pago').value);
        if (!isNaN(pagoRecibido)) {
            ticket += `Pago con: $${pagoRecibido.toFixed(2)}\n`;
            if (pagoRecibido >= totalCobrarPersonaActual) {
                ticket += `Cambio: $${(pagoRecibido - totalCobrarPersonaActual).toFixed(2)}\n`;
            }
        }
        ticket += `\n¡Gracias por tu preferencia! 🎱🧊`;

        // Lanzar WhatsApp si hay un campo de número disponible
        const inputWS = document.getElementById('input-whatsapp');
        if (inputWS && inputWS.value.trim() !== "") {
            let numeroCliente = inputWS.value.replace(/\s+/g, '');
            const url = `https://wa.me/52${numeroCliente}?text=${encodeURIComponent(ticket)}`;
            window.open(url, '_blank');
        }

        // ==========================================
        // ACTUALIZACIÓN DE ESTADO EN MEMORIA LOCAL
        // ==========================================
        const cuentaIndex = cuentas.findIndex(c => c.id === cuentaActivaId);

        if (itemsPendientes.length === 0) {
            // Caso A: Se liquidó toda la mesa
            if (cuentaIndex !== -1) {
                cuentas[cuentaIndex].status = 'closed';
                cuentas[cuentaIndex].items = itemsPagados; // Guardamos lo cobrado para historial
                cuentas[cuentaIndex].total = totalCobrarPersonaActual;
            }
            localStorage.removeItem('cuentaActivaId');
            localStorage.setItem('cuentas', JSON.stringify(cuentas));
            alert(`¡Mesa liquidada por completo! Total: $${totalCobrarPersonaActual.toFixed(2)}`);
            window.location.href = 'index.html';
        } else {
            // Caso B: Cobro parcial, la mesa continúa abierta con lo que sobró
            cuentaActiva.items = itemsPendientes;
            cuentaActiva.total = itemsPendientes.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
            
            if (cuentaIndex !== -1) {
                cuentas[cuentaIndex] = cuentaActiva;
            }
            localStorage.setItem('cuentas', JSON.stringify(cuentas));
            
            alert(`Cobro parcial exitoso por $${totalCobrarPersonaActual.toFixed(2)}. La mesa sigue abierta con los productos restantes.`);
            
            // Ocultar modal y re-renderizar la pantalla de cobro para la siguiente persona
            document.getElementById('modal-cobro').style.display = 'none';
            renderizerTicket();
            iniciarPOS();
        }
    });
}*/



// Inicializar la ejecución general al cargar el script
iniciarPOS();
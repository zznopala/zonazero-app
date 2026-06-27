// Estado inicial simulando datos que ya podrías tener
const defaultProducts = [
    { id: 'p1', nombre: 'Café de Olla', costo: 15.00, precio: 35.00, categoria: 'Cafetería', usaStock: false, stock: 0, activo: true },
    { id: 'p2', nombre: 'Crepa Dulce', costo: 20.00, precio: 50.00, categoria: 'Snacks', usaStock: true, stock: 15, activo: true },
    { id: 'p3', nombre: 'Soda Italiana', costo: 18.00, precio: 45.00, categoria: 'Bebidas', usaStock: false, stock: 0, activo: true }
];

let productos = JSON.parse(localStorage.getItem('productos')) || defaultProducts;

// ==========================================
// 1. RENDERIZADO (Read)
// ==========================================
const renderProductos = (filtro = '') => {
    const container = document.getElementById('productos-container');
    container.innerHTML = '';
    
    const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(filtro.toLowerCase()));

    filtrados.forEach(prod => {
        const div = document.createElement('div');
        div.className = `card-producto ${!prod.activo ? 'inactivo' : ''}`;
        
        div.innerHTML = `
            <div class="card-header">
                <h3>${prod.nombre}</h3>
                <span class="badge">${prod.categoria}</span>
            </div>
            <div class="precios">
                <span>Costo: $${Number(prod.costo).toFixed(2)}</span>
                <span class="venta">Venta: $${Number(prod.precio).toFixed(2)}</span>
            </div>
            ${prod.usaStock ? `<p style="font-size:0.85em; color: ${prod.stock > 5 ? 'green' : 'red'};">Stock: ${prod.stock}</p>` : ''}
            
            <div class="card-actions">
                <button class="btn-edit" onclick="editarProducto('${prod.id}')">Editar</button>
                <button class="btn-delete" onclick="eliminarProducto('${prod.id}')">Eliminar</button>
            </div>
        `;
        container.appendChild(div);
    });
};

// ==========================================
// 2. FORMULARIO Y MODAL (Create & Update)
// ==========================================
const modal = document.getElementById('modal-producto');
const form = document.getElementById('form-producto');
const stockCheckbox = document.getElementById('prod-usa-stock');
const stockContainer = document.getElementById('stock-container');

// Mostrar/Ocultar campo de stock según el checkbox
stockCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) stockContainer.classList.remove('hidden');
    else stockContainer.classList.add('hidden');
});

// Abrir modal vacío para Nuevo
document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
    form.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-titulo').innerText = 'Nuevo Producto';
    stockContainer.classList.add('hidden');
    modal.classList.remove('hidden');
});

// Cargar datos al modal para Editar
window.editarProducto = (id) => {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('prod-id').value = prod.id;
    document.getElementById('prod-nombre').value = prod.nombre;
    document.getElementById('prod-costo').value = prod.costo;
    document.getElementById('prod-precio').value = prod.precio;
    document.getElementById('prod-categoria').value = prod.categoria;
    
    document.getElementById('prod-usa-stock').checked = prod.usaStock;
    document.getElementById('prod-stock').value = prod.stock;
    if (prod.usaStock) stockContainer.classList.remove('hidden');
    else stockContainer.classList.add('hidden');

    document.getElementById('prod-activo').checked = prod.activo;
    
    document.getElementById('modal-titulo').innerText = 'Editar Producto';
    modal.classList.remove('hidden');
};

// Guardar (Inserta o Actualiza)
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prod-id').value;
    const nuevoProducto = {
        id: id ? id : 'prod_' + Date.now(), // Genera ID si es nuevo
        nombre: document.getElementById('prod-nombre').value,
        costo: parseFloat(document.getElementById('prod-costo').value),
        precio: parseFloat(document.getElementById('prod-precio').value),
        categoria: document.getElementById('prod-categoria').value,
        usaStock: document.getElementById('prod-usa-stock').checked,
        stock: parseInt(document.getElementById('prod-stock').value) || 0,
        activo: document.getElementById('prod-activo').checked
    };

    if (id) {
        // Actualizar existente
        productos = productos.map(p => p.id === id ? nuevoProducto : p);
    } else {
        // Agregar nuevo
        productos.push(nuevoProducto);
    }

    localStorage.setItem('productos', JSON.stringify(productos));
    modal.classList.add('hidden');
    renderProductos(document.getElementById('input-buscar').value);
});

// ==========================================
// 3. ELIMINAR (Delete)
// ==========================================
window.eliminarProducto = (id) => {
    if (confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('productos', JSON.stringify(productos));
        renderProductos(document.getElementById('input-buscar').value);
    }
};

// ==========================================
// 4. UTILIDADES
// ==========================================
// Cerrar modal
document.getElementById('btn-cancelar').addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Buscador en tiempo real
document.getElementById('input-buscar').addEventListener('input', (e) => {
    renderProductos(e.target.value);
});

// Inicializar
renderProductos();
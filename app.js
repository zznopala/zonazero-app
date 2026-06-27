// Recuperar las cuentas del almacenamiento local
let cuentas = JSON.parse(localStorage.getItem('cuentas')) || [];

const saveState = () => {
    localStorage.setItem('cuentas', JSON.stringify(cuentas));
    renderAccounts();
};

// ==========================================
// 1. RENDERIZAR MESAS ABIERTAS
// ==========================================
const renderAccounts = () => {
    const container = document.getElementById('cuentas-container');
    container.innerHTML = ''; 
    
    // Solo mostrar las mesas que no han sido cobradas
    const openAccounts = cuentas.filter(acc => acc.status === 'open');
    
    if (openAccounts.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; margin-top: 20px; font-style: italic;">No hay cuentas abiertas. Toca "+ Nueva Cuenta" para empezar.</div>';
        return;
    }
    
    openAccounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>${acc.name}</h3>
            <p>${acc.description || 'Sin descripción'}</p>
            <div class="total">Total: $${acc.total.toFixed(2)}</div>
            <!-- Este botón es la clave: Llama a abrirPOS pasándole el ID -->
            <button onclick="abrirPOS('${acc.id}')" style="margin-top: 10px; width: 100%; background: #007bff; color: white;">Ver / Agregar Pedido</button>
        `;
        container.appendChild(div);
    });
};

// ==========================================
// 2. NAVEGACIÓN AL PUNTO DE VENTA (POS)
// ==========================================
window.abrirPOS = (id) => {
    // Guardamos qué mesa se seleccionó
    localStorage.setItem('cuentaActivaId', id);
    // Redirigimos a la pantalla de toma de pedidos
    window.location.href = 'pos.html';
};

// ==========================================
// 3. LÓGICA DEL MODAL (NUEVA CUENTA)
// ==========================================
document.getElementById('btn-nueva-cuenta').addEventListener('click', () => {
    document.getElementById('modal-cuenta').classList.remove('hidden');
});

document.getElementById('btn-guardar-cuenta').addEventListener('click', () => {
    const name = document.getElementById('input-nombre-mesa').value;
    const desc = document.getElementById('input-descripcion').value;
    
    const newAccount = {
        id: 'acc_' + Date.now(),
        name: name || 'Mesa/Cliente ' + (cuentas.length + 1),
        description: desc,
        status: 'open',
        items: [],
        total: 0 
    };
    
    cuentas.push(newAccount);
    saveState();
    
    // Limpiar campos
    document.getElementById('input-nombre-mesa').value = '';
    document.getElementById('input-descripcion').value = '';
    
    // Opcional pero recomendado: Al crearla, te lleva directo a tomarle el pedido
    abrirPOS(newAccount.id);
});

// Cancelar Modal
document.getElementById('btn-cancelar-cuenta').addEventListener('click', () => {
    document.getElementById('modal-cuenta').classList.add('hidden');
});

// Inicializar la vista
renderAccounts();
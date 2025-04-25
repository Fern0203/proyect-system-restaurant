// Configuración inicial
document.addEventListener('DOMContentLoaded', function() {
    // Navegación entre secciones
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');

            // Remover clase active de todos los enlaces y secciones
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            // Agregar clase active al enlace y sección seleccionados
            this.classList.add('active');
            document.getElementById(sectionId).classList.add('active');

            // Cargar datos según la sección
            //loadSectionData(sectionId);
            // setTimeout(() => loadSectionData(sectionId), 0);
            setTimeout(() => {
                if (typeof window[`load${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}Data`] === 'function') {
                    loadSectionData(sectionId);
                } else {
                    loadScript(`js/${sectionId}.js`, () => loadSectionData(sectionId));
                }
            }, 0);
        });
    });

    // Cargar datos iniciales del dashboard
    loadSectionData('dashboard');

    // Configurar modales
    // setupModals();
});

// Función para cargar datos según la sección
/*function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
            break;
        case 'ventas':
            if (typeof loadVentasData === 'function') {
                loadVentasData();
            }
            break;
        case 'inventario':
            if (typeof loadInventarioData === 'function') {
                loadInventarioData();
            }
            break;
        case 'platillos':
            if (typeof loadPlatillosData === 'function') {
                loadPlatillosData();
            } else {
                console.error('Error: loadPlatillosData no está disponible');
                // Recargar el script si falla
                loadScript('js/platillos.js', () => {
                    if (typeof loadPlatillosData === 'function') {
                        loadPlatillosData();
                    }
                });
            }
            break;
        case 'clientes':
            if (typeof loadClientesData === 'function') {
                loadClientesData();
            }
            break;
        case 'finanzas':
            if (typeof loadFinanzasData === 'function') {
                loadFinanzasData();
            }
            break;
    }
}*/

/*function loadSectionData(sectionId) {
    const functionName = `load${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}Data`;

    if (typeof window[functionName] === 'function') {
        window[functionName]();
    } else {
        loadScript(`js/${sectionId}.js`, () => {
            if (typeof window[functionName] === 'function') {
                window[functionName]();
            } else {
                console.error(`Error: La función ${functionName} no se cargó correctamente`);
            }
        });
    }
}*/

async function loadSectionData(sectionId) {
    const functionName = `load${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}Data`;

    // Espera breve para asegurar que los scripts están cargados
    await new Promise(resolve => setTimeout(resolve, 50));

    if (typeof window[functionName] === 'function') {
        try {
            await window[functionName]();
        } catch (e) {
            console.error(`Error ejecutando ${functionName}:`, e);
        }
    } else {
        console.error(`Función ${functionName} no encontrada`);
    }
}

// Función para cargar scripts dinámicamente
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.body.appendChild(script);
}

// Función para configurar modales
function setupModals() {
    // Modal de cliente
    const clienteModal = document.getElementById('cliente-modal');
    const clienteModalBtn = document.getElementById('nuevo-cliente-btn');
    const clienteModalClose = clienteModal.querySelector('.close');

    clienteModalBtn.addEventListener('click', () => {
        clienteModal.style.display = 'block';
        // Limpiar formulario
        document.getElementById('modal-cliente-nombre').value = '';
        document.getElementById('modal-cliente-telefono').value = '';
        document.getElementById('modal-cliente-email').value = '';
    });

    clienteModalClose.addEventListener('click', () => {
        console.log('Botón cerrar clickeado'); // Debe aparecer en consola al hacer clic
        clienteModal.style.display = 'none';
        console.log('Display del modal:', clienteModal.style.display); // Debe mostrar "none"
    });

    window.addEventListener('click', (e) => {
        if (e.target === clienteModal) {
            clienteModal.style.display = 'none';
        }
    });

    // Modal de detalle de venta
    const detalleVentaModal = document.getElementById('detalle-venta-modal');
    const detalleVentaModalClose = detalleVentaModal.querySelector('.close');

    detalleVentaModalClose.addEventListener('click', () => {
        detalleVentaModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === detalleVentaModal) {
            detalleVentaModal.style.display = 'none';
        }
    });
}

// Función para hacer llamadas a la API
/*async function fetchData(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`php/${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener datos:', error);
        showAlert('error', 'Error al obtener datos del servidor');
        return null;
    }
}*/

async function fetchData(endpoint, method = 'GET', data = null) {
    try {
        const response = await fetch(`php/${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: data ? JSON.stringify(data) : null
        });

        const text = await response.text(); // Primero obtenemos el texto

        try {
            return JSON.parse(text); // Intentamos parsear como JSON
        } catch (e) {
            console.error('La respuesta no es JSON válido:', text);
            throw new Error(`Respuesta no válida: ${text.substring(0, 100)}...`);
        }

    } catch (error) {
        console.error('Error en fetchData:', error);
        showAlert('error', 'Error al comunicarse con el servidor');
        return null;
    }
}

// Función para mostrar alertas
function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Cargar datos del dashboard
async function loadDashboardData() {
    // Simular carga de datos (en un sistema real, harías llamadas a la API)
    document.getElementById('ventas-hoy').textContent = 'Q1,185.00';
    document.getElementById('inventario-bajo').textContent = '3';
    document.getElementById('total-clientes').textContent = '4';
    document.getElementById('balance-mensual').textContent = 'Q5,430.00';

    // Configurar gráfico de ventas
    const ctx = document.getElementById('ventasChart').getContext('2d');
    const ventasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Ventas diarias',
                data: [1200, 1900, 1500, 2000, 2500, 3000, 2800],
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
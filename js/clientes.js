// Variables globales
let clientes = [];
let modoEdicion = false;
let clienteEditando = null;

// Cargar datos del módulo de clientes
async function loadClientesData() {
    try {
        // Cargar lista de clientes
        await cargarClientes();

        // Configurar eventos
        configurarEventosClientes();

        // Limpiar formulario
        limpiarFormularioCliente();
    } catch (error) {
        console.error('Error al cargar datos de clientes:', error);
        showAlert('error', 'Error al cargar datos de clientes');
    }
}

// Configurar eventos del módulo de clientes
function configurarEventosClientes() {
    // Guardar cliente
    document.getElementById('guardar-cliente-btn').addEventListener('click', guardarCliente);

    // Nuevo cliente
    document.getElementById('nuevo-cliente-btn').addEventListener('click', limpiarFormularioCliente);

    // Generar reporte
    document.getElementById('generar-reporte-clientes').addEventListener('click', generarReporteClientes);

    // Búsqueda de clientes
    document.getElementById('buscar-cliente').addEventListener('input', filtrarClientes);
}

// Cargar lista de clientes
async function cargarClientes() {
    try {
        clientes = await fetchData('clientes.php');
        actualizarTablaClientes(clientes);
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showAlert('error', 'Error al cargar la lista de clientes');
    }
}

// Actualizar tabla de clientes
function actualizarTablaClientes(data) {
    const tbody = document.querySelector('#tabla-clientes tbody');
    tbody.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(cliente => {
            const tr = document.createElement('tr');

            // Formatear fecha de registro
            const fechaRegistro = new Date(cliente.fecha_registro);
            const fechaFormateada = fechaRegistro.toLocaleDateString();

            tr.innerHTML = `
                <td>${cliente.id_cliente}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono || 'N/A'}</td>
                <td>${cliente.email || 'N/A'}</td>
                <td>${fechaFormateada}</td>
                <td class="actions">
                    <button class="btn btn-primary btn-sm btn-editar" data-id="${cliente.id_cliente}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm btn-eliminar" data-id="${cliente.id_cliente}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-info btn-sm btn-historial" data-id="${cliente.id_cliente}">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Configurar eventos de botones editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarCliente(id);
            });
        });

        // Configurar eventos de botones eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                eliminarCliente(id);
            });
        });

        // Configurar eventos de botones historial
        document.querySelectorAll('.btn-historial').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                mostrarHistorialCliente(id);
            });
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay clientes registrados</td></tr>';
    }
}

// Filtrar clientes por búsqueda
function filtrarClientes() {
    const busqueda = document.getElementById('buscar-cliente').value.toLowerCase();
    const resultados = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(busqueda) ||
        (cliente.telefono && cliente.telefono.includes(busqueda)) ||
        (cliente.email && cliente.email.toLowerCase().includes(busqueda)) ||
        cliente.id_cliente.toString().includes(busqueda)
    );
    actualizarTablaClientes(resultados);
}

// Editar cliente
async function editarCliente(id) {
    try {
        const cliente = clientes.find(c => c.id_cliente == id);

        if (cliente) {
            modoEdicion = true;
            clienteEditando = cliente;

            // Llenar formulario
            document.getElementById('cliente-nombre').value = cliente.nombre;
            document.getElementById('cliente-telefono').value = cliente.telefono || '';
            document.getElementById('cliente-email').value = cliente.email || '';
            document.getElementById('cliente-direccion').value = cliente.direccion || '';
            document.getElementById('cliente-id').value = cliente.id_cliente;

            // Scroll al formulario
            document.querySelector('.clientes-form').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al preparar edición de cliente:', error);
        showAlert('error', 'Error al preparar edición de cliente');
    }
}

// Mostrar historial del cliente
async function mostrarHistorialCliente(id) {
    try {
        const cliente = clientes.find(c => c.id_cliente == id);

        if (!cliente) {
            showAlert('error', 'Cliente no encontrado');
            return;
        }

        // Obtener historial de ventas del cliente
        const ventas = await fetchData(`ventas.php?cliente=${id}`);

        // Crear contenido del modal
        let html = `
            <h3>Historial de compras: ${cliente.nombre}</h3>
            <p>Total de compras: ${ventas?.length || 0}</p>
        `;

        if (ventas && ventas.length > 0) {
            // Calcular total gastado
            const totalGastado = ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
            html += `<p>Total gastado: $${totalGastado.toFixed(2)}</p>`;

            html += `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Venta #</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            ventas.forEach(venta => {
                html += `
                    <tr>
                        <td>${venta.id_venta}</td>
                        <td>${new Date(venta.fecha).toLocaleDateString()}</td>
                        <td>$${parseFloat(venta.total).toFixed(2)}</td>
                        <td>
                            <span class="badge ${venta.estado === 'completada' ? 'badge-success' : venta.estado === 'cancelada' ? 'badge-danger' : 'badge-warning'}">
                                ${venta.estado}
                            </span>
                        </td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;
        } else {
            html += '<p>El cliente no tiene historial de compras.</p>';
        }

        // Mostrar modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close">&times;</span>
                ${html}
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Configurar cierre del modal
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error al mostrar historial:', error);
        showAlert('error', 'Error al mostrar historial del cliente');
    }
}

// Eliminar cliente
async function eliminarCliente(id) {
    try {
        if (confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
            // Verificar si el cliente tiene ventas asociadas
            const tieneVentas = await verificarClienteEnVentas(id);

            if (tieneVentas) {
                showAlert('error', 'No se puede eliminar el cliente porque tiene ventas asociadas');
                return;
            }

            const response = await fetchData(`clientes.php?id=${id}`, 'DELETE');

            if (response && response.success) {
                showAlert('success', 'Cliente eliminado correctamente');
                await cargarClientes();
                limpiarFormularioCliente();
            } else {
                showAlert('error', 'Error al eliminar cliente');
            }
        }
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        showAlert('error', 'Error al eliminar cliente');
    }
}

// Verificar si un cliente tiene ventas asociadas
async function verificarClienteEnVentas(id) {
    try {
        const response = await fetchData(`clientes.php?en_uso=${id}`);
        return response && response.en_uso;
    } catch (error) {
        console.error('Error al verificar uso de cliente:', error);
        return true; // Por precaución, asumir que está en uso si hay error
    }
}

// Guardar cliente (crear o actualizar)
async function guardarCliente() {
    try {
        const nombre = document.getElementById('cliente-nombre').value.trim();
        const telefono = document.getElementById('cliente-telefono').value.trim();
        const email = document.getElementById('cliente-email').value.trim();
        const direccion = document.getElementById('cliente-direccion').value.trim();
        const id = document.getElementById('cliente-id').value;

        // Validaciones
        if (!nombre) {
            showAlert('error', 'El nombre es requerido');
            return;
        }

        if (email && !validarEmail(email)) {
            showAlert('error', 'El email no tiene un formato válido');
            return;
        }

        const data = {
            nombre: nombre,
            telefono: telefono || null,
            email: email || null,
            direccion: direccion || null
        };

        let response;

        if (modoEdicion && id) {
            // Actualizar cliente existente
            data.id_cliente = id;
            response = await fetchData('clientes.php', 'PUT', data);
        } else {
            // Crear nuevo cliente
            response = await fetchData('clientes.php', 'POST', data);
        }

        if (response && (response.success || response.id_cliente)) {
            showAlert('success', modoEdicion ? 'Cliente actualizado' : 'Cliente creado');
            await cargarClientes();
            limpiarFormularioCliente();
        } else {
            showAlert('error', 'Error al guardar cliente');
        }
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        showAlert('error', 'Error al guardar cliente');
    }
}

// Validar formato de email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Limpiar formulario de cliente
function limpiarFormularioCliente() {
    modoEdicion = false;
    clienteEditando = null;

    document.getElementById('cliente-nombre').value = '';
    document.getElementById('cliente-telefono').value = '';
    document.getElementById('cliente-email').value = '';
    document.getElementById('cliente-direccion').value = '';
    document.getElementById('cliente-id').value = '';

    // Enfocar en el primer campo
    document.getElementById('cliente-nombre').focus();
}

// Generar reporte de clientes
async function generarReporteClientes() {
    try {
        // Obtener datos actualizados
        const datos = await fetchData('clientes.php');

        if (!datos || datos.length === 0) {
            showAlert('info', 'No hay datos para generar el reporte');
            return;
        }

        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('Reporte de Clientes', 105, 15, { align: 'center' });

        // Fecha
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

        // Estadísticas
        doc.setFontSize(12);
        doc.text(`Total de clientes: ${datos.length}`, 14, 30);

        // Tabla de datos
        const headers = [
            'ID',
            'Nombre',
            'Teléfono',
            'Email',
            'Dirección',
            'Fecha Registro'
        ];

        const rows = datos.map(cliente => [
            cliente.id_cliente,
            cliente.nombre,
            cliente.telefono || 'N/A',
            cliente.email || 'N/A',
            cliente.direccion || 'N/A',
            new Date(cliente.fecha_registro).toLocaleDateString()
        ]);

        // Configuración de la tabla
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 40,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 40 },
                2: { cellWidth: 30 },
                3: { cellWidth: 50 },
                4: { cellWidth: 40 },
                5: { cellWidth: 30 }
            }
        });

        // Pie de página
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Página ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        // Guardar PDF
        doc.save(`Reporte_Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
        showAlert('success', 'Reporte generado con éxito');
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showAlert('error', 'Error al generar reporte');
    }
}
// Variables globales
let ventaActual = {
    id: null,
    id_cliente: null,
    detalle: [],
    total: 0
};

// Cargar datos del módulo de ventas
async function loadVentasData() {
    try {
        // Cargar clientes para el select
        const clientes = await fetchData('clientes.php');
        const selectCliente = document.getElementById('cliente-venta');
        selectCliente.innerHTML = '<option value="">Seleccionar cliente...</option>';

        if (clientes) {
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id_cliente;
                option.textContent = cliente.nombre;
                selectCliente.appendChild(option);
            });
        }

        // Cargar platillos para el select
        const platillos = await fetchData('platillos.php?activos=true');
        const selectPlatillo = document.getElementById('platillo-venta');
        selectPlatillo.innerHTML = '<option value="">Seleccionar platillo...</option>';

        if (platillos) {
            platillos.forEach(platillo => {
                const option = document.createElement('option');
                option.value = platillo.id_platillo;
                // Asegúrate de convertir el precio a número
                const precio = parseFloat(platillo.precio);
                option.textContent = `${platillo.nombre} - Q${precio.toFixed(2)}`;
                option.dataset.precio = precio; // Guardar como número
                selectPlatillo.appendChild(option);
            });
        }

        // Cargar historial de ventas
        await cargarHistorialVentas();

        // Configurar eventos
        configurarEventosVentas();

        // Limpiar venta actual
        limpiarVenta();
    } catch (error) {
        console.error('Error al cargar datos de ventas:', error);
        showAlert('error', 'Error al cargar datos de ventas');
    }
}

// Configurar eventos del módulo de ventas
function configurarEventosVentas() {
    // Agregar platillo a la venta
    document.getElementById('agregar-platillo-btn').addEventListener('click', agregarPlatilloAVenta);

    // Finalizar venta
    document.getElementById('finalizar-venta-btn').addEventListener('click', finalizarVenta);

    // Cancelar venta
    document.getElementById('cancelar-venta-btn').addEventListener('click', limpiarVenta);

    // Generar reporte
    document.getElementById('generar-reporte-ventas').addEventListener('click', generarReporteVentas);

    // Filtrar historial por fecha
    document.getElementById('filtro-fecha').addEventListener('change', cargarHistorialVentas);

    // Guardar cliente desde modal
    document.getElementById('guardar-modal-cliente-btn').addEventListener('click', guardarClienteDesdeModal);
}

// Agregar platillo a la venta actual
function agregarPlatilloAVenta() {
    const selectPlatillo = document.getElementById('platillo-venta');
    const cantidadInput = document.getElementById('cantidad-venta');

    if (!selectPlatillo.value) {
        showAlert('error', 'Selecciona un platillo');
        return;
    }

    const cantidad = parseInt(cantidadInput.value);
    if (isNaN(cantidad) || cantidad <= 0) {
        showAlert('error', 'Ingresa una cantidad válida');
        return;
    }

    const platilloId = selectPlatillo.value;
    const platilloNombre = selectPlatillo.options[selectPlatillo.selectedIndex].text.split(' - ')[0];
    const precio = parseFloat(selectPlatillo.options[selectPlatillo.selectedIndex].dataset.precio);
    const subtotal = precio * cantidad;

    // Verificar si el platillo ya está en la venta
    const platilloExistente = ventaActual.detalle.find(item => item.id_platillo == platilloId);

    if (platilloExistente) {
        // Actualizar cantidad y subtotal
        platilloExistente.cantidad += cantidad;
        platilloExistente.subtotal = platilloExistente.cantidad * precio;
    } else {
        // Agregar nuevo platillo
        ventaActual.detalle.push({
            id_platillo: platilloId,
            nombre: platilloNombre,
            cantidad: cantidad,
            precio_unitario: precio,
            subtotal: subtotal
        });
    }

    // Actualizar total
    ventaActual.total = ventaActual.detalle.reduce((sum, item) => sum + item.subtotal, 0);

    // Actualizar tabla de detalle
    actualizarDetalleVenta();

    // Limpiar selección
    selectPlatillo.value = '';
    cantidadInput.value = 1;
}

// Actualizar la tabla de detalle de venta
function actualizarDetalleVenta() {
    const tbody = document.querySelector('#detalle-venta tbody');
    tbody.innerHTML = '';

    ventaActual.detalle.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>Q${item.precio_unitario.toFixed(2)}</td>
            <td>Q${item.subtotal.toFixed(2)}</td>
            <td class="actions">
                <button class="btn btn-danger btn-sm" data-id="${item.id_platillo}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Actualizar total
    document.getElementById('total-venta').textContent = `Q${ventaActual.total.toFixed(2)}`;

    // Configurar eventos de botones eliminar
    document.querySelectorAll('#detalle-venta .btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            const platilloId = this.getAttribute('data-id');
            eliminarPlatilloDeVenta(platilloId);
        });
    });
}

// Eliminar platillo de la venta
function eliminarPlatilloDeVenta(platilloId) {
    ventaActual.detalle = ventaActual.detalle.filter(item => item.id_platillo != platilloId);
    ventaActual.total = ventaActual.detalle.reduce((sum, item) => sum + item.subtotal, 0);
    actualizarDetalleVenta();
}

// Finalizar la venta
async function finalizarVenta() {
    if (ventaActual.detalle.length === 0) {
        showAlert('error', 'Agrega al menos un platillo a la venta');
        return;
    }

    const selectCliente = document.getElementById('cliente-venta');
    ventaActual.id_cliente = selectCliente.value || null;

    try {
        const data = {
            id_cliente: ventaActual.id_cliente,
            total: ventaActual.total,
            detalle: ventaActual.detalle.map(item => ({
                id_platillo: item.id_platillo,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal
            }))
        };

        const response = await fetchData('ventas.php', 'POST', data);

        if (response && response.id_venta) {
            showAlert('success', `Venta #${response.id_venta} registrada con éxito`);
            limpiarVenta();
            await cargarHistorialVentas();

            // Mostrar detalle de venta en modal
            const venta = await fetchData(`ventas.php?id=${response.id_venta}`);
            mostrarDetalleVentaModal(venta);
        } else {
            showAlert('error', 'Error al registrar la venta');
        }
    } catch (error) {
        console.error('Error al finalizar venta:', error);
        showAlert('error', 'Error al finalizar la venta');
    }
}

// Limpiar venta actual
function limpiarVenta() {
    ventaActual = {
        id: null,
        id_cliente: null,
        detalle: [],
        total: 0
    };

    document.getElementById('cliente-venta').value = '';
    document.getElementById('platillo-venta').value = '';
    document.getElementById('cantidad-venta').value = 1;
    document.querySelector('#detalle-venta tbody').innerHTML = '';
    document.getElementById('total-venta').textContent = 'Q0.00';
}

// Cargar historial de ventas
async function cargarHistorialVentas() {
    try {
        const fecha = document.getElementById('filtro-fecha').value;
        let url = 'ventas.php';

        if (fecha) {
            url += `?fecha=${fecha}`;
        }

        const ventas = await fetchData(url);
        const tbody = document.querySelector('#historial-ventas tbody');
        tbody.innerHTML = '';

        if (ventas && ventas.length > 0) {
            ventas.forEach(venta => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${venta.id_venta}</td>
                    <td>${new Date(venta.fecha).toLocaleString()}</td>
                    <td>${venta.cliente || 'Sin cliente'}</td>
                    <td>Q${parseFloat(venta.total).toFixed(2)}</td>
                    <td>
                        <span class="badge ${venta.estado === 'completada' ? 'badge-success' : venta.estado === 'cancelada' ? 'badge-danger' : 'badge-warning'}">
                            ${venta.estado}
                        </span>
                    </td>
                    <td class="actions">
                        <button class="btn btn-info btn-sm" data-id="${venta.id_venta}">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${venta.estado === 'pendiente' ? `
                        <button class="btn btn-danger btn-sm" data-id="${venta.id_venta}">
                            <i class="fas fa-times"></i>
                        </button>
                        ` : ''}
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Configurar eventos de botones
            document.querySelectorAll('#historial-ventas .btn-info').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const ventaId = this.getAttribute('data-id');
                    const venta = await fetchData(`ventas.php?id=${ventaId}`);
                    mostrarDetalleVentaModal(venta);
                });
            });

            document.querySelectorAll('#historial-ventas .btn-danger').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const ventaId = this.getAttribute('data-id');
                    if (confirm('¿Cancelar esta venta?')) {
                        const response = await fetchData('ventas.php', 'PUT', {
                            id_venta: ventaId,
                            estado: 'cancelada'
                        });

                        if (response && response.success) {
                            showAlert('success', 'Venta cancelada');
                            await cargarHistorialVentas();
                        } else {
                            showAlert('error', 'Error al cancelar venta');
                        }
                    }
                });
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay ventas registradas</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar historial de ventas:', error);
        showAlert('error', 'Error al cargar historial de ventas');
    }
}

// Mostrar detalle de venta en modal
function mostrarDetalleVentaModal(venta) {
    const modal = document.getElementById('detalle-venta-modal');
    const detalleDiv = document.getElementById('detalle-venta-info');

    let html = `
        <p><strong>Venta #${venta.id_venta}</strong></p>
        <p>Fecha: ${new Date(venta.fecha).toLocaleString()}</p>
        <p>Cliente: ${venta.cliente_nombre || 'Sin cliente'}</p>
        <p>Estado: <span class="badge ${venta.estado === 'completada' ? 'badge-success' : venta.estado === 'cancelada' ? 'badge-danger' : 'badge-warning'}">
            ${venta.estado}
        </span></p>

        <h4>Detalle:</h4>
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Platillo</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
    `;

    venta.detalle.forEach(item => {
        html += `
            <tr>
                <td>${item.platillo_nombre}</td>
                <td>${item.cantidad}</td>
                <td>Q${parseFloat(item.precio_unitario).toFixed(2)}</td>
                <td>Q${parseFloat(item.subtotal).toFixed(2)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="text-right"><strong>Total:</strong></td>
                    <td><strong>Q${parseFloat(venta.total).toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    detalleDiv.innerHTML = html;
    modal.style.display = 'block';

    // Configurar botón de imprimir
    document.getElementById('imprimir-venta-btn').addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Ticket de Venta #${venta.id_venta}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        h1, h2, h3 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .total-row { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>Restaurante</h2>
                    <h3>Ticket de Venta</h3>
                    <p><strong>Venta #${venta.id_venta}</strong></p>
                    <p>Fecha: ${new Date(venta.fecha).toLocaleString()}</p>
                    <p>Cliente: ${venta.cliente_nombre || 'Sin cliente'}</p>

                    <table>
                        <thead>
                            <tr>
                                <th>Platillo</th>
                                <th>Cant.</th>
                                <th>P. Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
        `);

        venta.detalle.forEach(item => {
            printWindow.document.write(`
                <tr>
                    <td>${item.platillo_nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>Q${parseFloat(item.precio_unitario).toFixed(2)}</td>
                    <td>Q${parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
            `);
        });

        printWindow.document.write(`
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="3" class="text-right">Total:</td>
                                <td>Q${parseFloat(venta.total).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <p style="margin-top: 30px; text-align: center;">¡Gracias por su preferencia!</p>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    });
}

// Guardar cliente desde modal
async function guardarClienteDesdeModal() {
    const nombre = document.getElementById('modal-cliente-nombre').value.trim();
    const telefono = document.getElementById('modal-cliente-telefono').value.trim();
    const email = document.getElementById('modal-cliente-email').value.trim();

    if (!nombre) {
        showAlert('error', 'El nombre es requerido');
        return;
    }

    try {
        const data = {
            nombre: nombre,
            telefono: telefono || null,
            email: email || null
        };

        const response = await fetchData('clientes.php', 'POST', data);

        if (response && response.id_cliente) {
            showAlert('success', 'Cliente registrado con éxito');

            // Agregar al select de clientes
            const selectCliente = document.getElementById('cliente-venta');
            const option = document.createElement('option');
            option.value = response.id_cliente;
            option.textContent = nombre;
            selectCliente.appendChild(option);
            selectCliente.value = response.id_cliente;

            // Cerrar modal
            document.getElementById('cliente-modal').style.display = 'none';
        } else {
            showAlert('error', 'Error al registrar cliente');
        }
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        showAlert('error', 'Error al guardar cliente');
    }
}

// Generar reporte de ventas
async function generarReporteVentas() {
    try {
        const fecha = document.getElementById('filtro-fecha').value;
        let url = 'ventas.php';

        if (fecha) {
            url += `?fecha=${fecha}`;
        }

        const ventas = await fetchData(url);

        if (!ventas || ventas.length === 0) {
            showAlert('info', 'No hay datos para generar el reporte');
            return;
        }

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();

        // Preparar datos
        const datos = ventas.map(venta => ({
            'ID': venta.id_venta,
            'Fecha': new Date(venta.fecha).toLocaleString(),
            'Cliente': venta.cliente || 'Sin cliente',
            'Total': parseFloat(venta.total),
            'Estado': venta.estado
        }));

        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

        // Generar nombre de archivo
        let nombreArchivo = 'Reporte_Ventas';
        if (fecha) {
            nombreArchivo += `_${fecha}`;
        }
        nombreArchivo += '.xlsx';

        // Descargar archivo
        XLSX.writeFile(wb, nombreArchivo);
        showAlert('success', 'Reporte generado con éxito');
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showAlert('error', 'Error al generar reporte');
    }
}
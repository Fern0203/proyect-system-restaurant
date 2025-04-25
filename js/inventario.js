const InventarioModule = (() => {
// Variables globales
let ingredientes = [];
let modoEdicion = false;
let ingredienteEditando = null;

// Cargar datos del módulo de inventario
async function loadInventarioData() {
    try {
        // Cargar lista de ingredientes
        await cargarIngredientes();

        // Configurar eventos
        configurarEventosInventario();

        // Limpiar formulario
        limpiarFormularioIngrediente();
    } catch (error) {
        console.error('Error al cargar datos de inventario:', error);
        showAlert('error', 'Error al cargar datos de inventario');
    }
}

// Configurar eventos del módulo de inventario
function configurarEventosInventario() {
    // Guardar ingrediente
    document.getElementById('guardar-ingrediente-btn').addEventListener('click', guardarIngrediente);

    // Nuevo ingrediente
    document.getElementById('nuevo-ingrediente-btn').addEventListener('click', limpiarFormularioIngrediente);

    // Generar reporte
    document.getElementById('generar-reporte-inventario').addEventListener('click', generarReporteInventario);

    // Búsqueda de ingredientes
    document.getElementById('buscar-ingrediente').addEventListener('input', filtrarIngredientes);
}

// Cargar lista de ingredientes
async function cargarIngredientes() {
    try {
        ingredientes = await fetchData('inventario.php');
        actualizarTablaIngredientes(ingredientes);
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
        showAlert('error', 'Error al cargar la lista de ingredientes');
    }
}

// Actualizar tabla de ingredientes
function actualizarTablaIngredientes(data) {
    const tbody = document.querySelector('#tabla-ingredientes tbody');
    tbody.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(ingrediente => {
            const tr = document.createElement('tr');

            // Determinar clase de stock bajo
            const stockClass = ingrediente.stock < ingrediente.stock_minimo ? 'text-danger' : '';

            tr.innerHTML = `
                <td>${ingrediente.id_ingrediente}</td>
                <td>${ingrediente.nombre}</td>
                <td class="${stockClass}">${ingrediente.stock} ${ingrediente.unidad_medida}</td>
                <td>${ingrediente.stock_minimo} ${ingrediente.unidad_medida}</td>
                <td>Q${parseFloat(ingrediente.precio_compra).toFixed(2)}</td>
                <td class="actions">
                    <button class="btn btn-primary btn-sm btn-editar" data-id="${ingrediente.id_ingrediente}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm btn-eliminar" data-id="${ingrediente.id_ingrediente}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Configurar eventos de botones editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarIngrediente(id);
            });
        });

        // Configurar eventos de botones eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                eliminarIngrediente(id);
            });
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay ingredientes registrados</td></tr>';
    }
}

// Filtrar ingredientes por búsqueda
function filtrarIngredientes() {
    const busqueda = document.getElementById('buscar-ingrediente').value.toLowerCase();
    const resultados = ingredientes.filter(ingrediente =>
        ingrediente.nombre.toLowerCase().includes(busqueda) ||
        ingrediente.id_ingrediente.toString().includes(busqueda)
    );
    actualizarTablaIngredientes(resultados);
}

// Editar ingrediente
async function editarIngrediente(id) {
    try {
        const ingrediente = ingredientes.find(i => i.id_ingrediente == id);

        if (ingrediente) {
            modoEdicion = true;
            ingredienteEditando = ingrediente;

            // Llenar formulario
            document.getElementById('ingrediente-nombre').value = ingrediente.nombre;
            document.getElementById('ingrediente-unidad').value = ingrediente.unidad_medida;
            document.getElementById('ingrediente-stock').value = ingrediente.stock;
            document.getElementById('ingrediente-minimo').value = ingrediente.stock_minimo;
            document.getElementById('ingrediente-precio').value = ingrediente.precio_compra;
            document.getElementById('ingrediente-id').value = ingrediente.id_ingrediente;

            // Scroll al formulario
            document.querySelector('.inventario-form').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al preparar edición de ingrediente:', error);
        showAlert('error', 'Error al preparar edición de ingrediente');
    }
}

// Eliminar ingrediente
async function eliminarIngrediente(id) {
    try {
        if (confirm('¿Estás seguro de eliminar este ingrediente? Esta acción no se puede deshacer.')) {
            // Verificar si el ingrediente está en uso en algún platillo
            const enUso = await verificarIngredienteEnUso(id);

            if (enUso) {
                showAlert('error', 'No se puede eliminar el ingrediente porque está en uso en uno o más platillos');
                return;
            }

            const response = await fetchData(`inventario.php?id=${id}`, 'DELETE');

            if (response && response.success) {
                showAlert('success', 'Ingrediente eliminado correctamente');
                await cargarIngredientes();
                limpiarFormularioIngrediente();
            } else {
                showAlert('error', 'Error al eliminar ingrediente');
            }
        }
    } catch (error) {
        console.error('Error al eliminar ingrediente:', error);
        showAlert('error', 'Error al eliminar ingrediente');
    }
}

// Verificar si un ingrediente está en uso en platillos
async function verificarIngredienteEnUso(id) {
    try {
        const response = await fetchData(`inventario.php?en_uso=${id}`);
        return response && response.en_uso;
    } catch (error) {
        console.error('Error al verificar uso de ingrediente:', error);
        return true; // Por precaución, asumir que está en uso si hay error
    }
}

// Guardar ingrediente (crear o actualizar)
async function guardarIngrediente() {
    try {
        const nombre = document.getElementById('ingrediente-nombre').value.trim();
        const unidad = document.getElementById('ingrediente-unidad').value.trim();
        const stock = parseFloat(document.getElementById('ingrediente-stock').value);
        const minimo = parseFloat(document.getElementById('ingrediente-minimo').value);
        const precio = parseFloat(document.getElementById('ingrediente-precio').value);
        const id = document.getElementById('ingrediente-id').value;

        // Validaciones
        if (!nombre || !unidad || isNaN(stock) || isNaN(minimo) || isNaN(precio)) {
            showAlert('error', 'Todos los campos son requeridos y deben ser válidos');
            return;
        }

        if (stock < 0 || minimo < 0 || precio <= 0) {
            showAlert('error', 'Los valores no pueden ser negativos y el precio debe ser mayor a cero');
            return;
        }

        const data = {
            nombre: nombre,
            unidad_medida: unidad,
            stock: stock,
            stock_minimo: minimo,
            precio_compra: precio
        };

        let response;

        if (modoEdicion && id) {
            // Actualizar ingrediente existente
            data.id_ingrediente = id;
            response = await fetchData('inventario.php', 'PUT', data);
        } else {
            // Crear nuevo ingrediente
            response = await fetchData('inventario.php', 'POST', data);
        }

        if (response && (response.success || response.id_ingrediente)) {
            showAlert('success', modoEdicion ? 'Ingrediente actualizado' : 'Ingrediente creado');
            await cargarIngredientes();
            limpiarFormularioIngrediente();
        } else {
            showAlert('error', 'Error al guardar ingrediente');
        }
    } catch (error) {
        console.error('Error al guardar ingrediente:', error);
        showAlert('error', 'Error al guardar ingrediente');
    }
}

// Limpiar formulario de ingrediente
function limpiarFormularioIngrediente() {
    modoEdicion = false;
    ingredienteEditando = null;

    document.getElementById('ingrediente-nombre').value = '';
    document.getElementById('ingrediente-unidad').value = '';
    document.getElementById('ingrediente-stock').value = '';
    document.getElementById('ingrediente-minimo').value = '';
    document.getElementById('ingrediente-precio').value = '';
    document.getElementById('ingrediente-id').value = '';

    // Enfocar en el primer campo
    document.getElementById('ingrediente-nombre').focus();
}

// Generar reporte de inventario
async function generarReporteInventario() {
    try {
        // Obtener datos actualizados
        const datos = await fetchData('inventario.php');

        if (!datos || datos.length === 0) {
            showAlert('info', 'No hay datos para generar el reporte');
            return;
        }

        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('Reporte de Inventario', 105, 15, { align: 'center' });

        // Fecha
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

        // Tabla de datos
        const headers = [
            'ID',
            'Nombre',
            'Stock',
            'Stock Mínimo',
            'Precio Compra',
            'Estado'
        ];

        const rows = datos.map(ingrediente => [
            ingrediente.id_ingrediente,
            ingrediente.nombre,
            `${ingrediente.stock} ${ingrediente.unidad_medida}`,
            `${ingrediente.stock_minimo} ${ingrediente.unidad_medida}`,
            `Q${parseFloat(ingrediente.precio_compra).toFixed(2)}`,
            ingrediente.stock < ingrediente.stock_minimo ? 'BAJO' : 'OK'
        ]);

        // Configuración de la tabla
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 30,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 60 },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 },
                4: { cellWidth: 30 },
                5: { cellWidth: 20 }
            },
            didDrawCell: (data) => {
                // Resaltar filas con stock bajo
                if (data.column.index === 5 && data.cell.raw === 'BAJO') {
                    doc.setTextColor(255, 0, 0);
                }
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
        doc.save(`Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
        showAlert('success', 'Reporte generado con éxito');
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showAlert('error', 'Error al generar reporte');
    }
}

        return {
            loadInventarioData
        };
    })();

window.loadInventarioData = InventarioModule.loadInventarioData;
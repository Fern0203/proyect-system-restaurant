// Variables globales
if (typeof window.PlatillosModule === 'undefined') {
    window.PlatillosModule = (function() {
/*const PlatillosModule = (() => {*/
    let platillos = [];
    let categorias = [];
    let ingredientesPlatillos = [];
    let modoEdicion = false;
    let platilloEditando = null;
    let ingredientesPlatillo = [];

// Cargar datos del módulo de platillos
async function loadPlatillosData() {
    try {
        // Cargar datos iniciales
        await Promise.all([
            cargarCategorias(),
            cargarIngredientes(),
            cargarPlatillos()
        ]);

        // Configurar eventos
        configurarEventosPlatillos();

        // Limpiar formulario
        limpiarFormularioPlatillo();
    } catch (error) {
        console.error('Error al cargar datos de platillos:', error);
        showAlert('error', 'Error al cargar datos de platillos');
    }
}

// Configurar eventos del módulo de platillos
function configurarEventosPlatillos() {
    // Guardar platillo
    document.getElementById('guardar-platillo-btn').addEventListener('click', guardarPlatillo);

    // Nuevo platillo
    document.getElementById('nuevo-platillo-btn').addEventListener('click', limpiarFormularioPlatillo);

    // Agregar ingrediente
    document.getElementById('agregar-ingrediente-btn').addEventListener('click', agregarIngredienteAPlatillo);

    // Generar reporte
    document.getElementById('generar-reporte-platillos').addEventListener('click', generarReportePlatillos);

    // Búsqueda de platillos
    document.getElementById('buscar-platillo').addEventListener('input', filtrarPlatillos);

    // Filtro por categoría
    document.getElementById('filtro-categoria').addEventListener('change', filtrarPlatillos);
}

// Cargar categorías
async function cargarCategorias() {
    try {
        categorias = await fetchData('categorias.php');

        // Llenar select en formulario
        const selectCategoria = document.getElementById('platillo-categoria');
        selectCategoria.innerHTML = '<option value="">Seleccionar categoría...</option>';

        // Llenar select en filtro
        const selectFiltro = document.getElementById('filtro-categoria');
        selectFiltro.innerHTML = '<option value="">Todas las categorías</option>';

        if (categorias && categorias.length > 0) {
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id_categoria;
                option.textContent = categoria.nombre;
                selectCategoria.appendChild(option.cloneNode(true));
                selectFiltro.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showAlert('error', 'Error al cargar categorías');
    }
}

// Cargar ingredientes para platillos
async function cargarIngredientes() {
    try {
        ingredientesPlatillos = await fetchData('inventario.php');

        // Llenar select de ingredientes
        const selectIngrediente = document.getElementById('ingrediente-platillo');
        selectIngrediente.innerHTML = '<option value="">Seleccionar ingrediente...</option>';

        if (ingredientesPlatillos && ingredientesPlatillos.length > 0) {
            ingredientesPlatillos.forEach(ingrediente => {
                const option = document.createElement('option');
                option.value = ingrediente.id_ingrediente;
                option.textContent = `${ingrediente.nombre} (${ingrediente.stock} ${ingrediente.unidad_medida})`;
                selectIngrediente.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
        showAlert('error', 'Error al cargar ingredientes');
    }
}

// Cargar platillos
async function cargarPlatillos() {
    try {
        platillos = await fetchData('platillos.php');
        actualizarTablaPlatillos(platillos);
    } catch (error) {
        console.error('Error al cargar platillos:', error);
        showAlert('error', 'Error al cargar la lista de platillos');
    }
}

// Actualizar tabla de platillos
function actualizarTablaPlatillos(data) {
    const tbody = document.querySelector('#tabla-platillos tbody');
    tbody.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(platillo => {
            const tr = document.createElement('tr');

            // Buscar nombre de categoría
            const categoria = categorias.find(c => c.id_categoria == platillo.id_categoria);
            const nombreCategoria = categoria ? categoria.nombre : 'Sin categoría';

            tr.innerHTML = `
                <td>${platillo.id_platillo}</td>
                <td>${platillo.nombre}</td>
                <td>${nombreCategoria}</td>
                <td>Q${parseFloat(platillo.precio).toFixed(2)}</td>
                <td>Q${parseFloat(platillo.costo).toFixed(2)}</td>
                <td>
                    <span class="badge ${platillo.activo ? 'badge-success' : 'badge-secondary'}">
                        ${platillo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-primary btn-sm btn-editar" data-id="${platillo.id_platillo}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm btn-eliminar" data-id="${platillo.id_platillo}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-info btn-sm btn-ingredientes" data-id="${platillo.id_platillo}">
                        <i class="fas fa-list"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Configurar eventos de botones editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarPlatillo(id);
            });
        });

        // Configurar eventos de botones eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                eliminarPlatillo(id);
            });
        });

        // Configurar eventos de botones ingredientes
        document.querySelectorAll('.btn-ingredientes').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                mostrarIngredientesPlatillo(id);
            });
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay platillos registrados</td></tr>';
    }
}

// Filtrar platillos por búsqueda y categoría
function filtrarPlatillos() {
    const busqueda = document.getElementById('buscar-platillo').value.toLowerCase();
    const categoriaId = document.getElementById('filtro-categoria').value;

    const resultados = platillos.filter(platillo => {
        const coincideNombre = platillo.nombre.toLowerCase().includes(busqueda);
        const coincideCategoria = !categoriaId || platillo.id_categoria == categoriaId;
        return coincideNombre && coincideCategoria;
    });

    actualizarTablaPlatillos(resultados);
}

// Editar platillo
async function editarPlatillo(id) {
    try {
        const platillo = platillos.find(p => p.id_platillo == id);

        if (platillo) {
            modoEdicion = true;
            platilloEditando = platillo;

            // Llenar formulario
            document.getElementById('platillo-nombre').value = platillo.nombre;
            document.getElementById('platillo-categoria').value = platillo.id_categoria || '';
            document.getElementById('platillo-descripcion').value = platillo.descripcion || '';
            document.getElementById('platillo-precio').value = platillo.precio;
            document.getElementById('platillo-costo').value = platillo.costo;
            document.getElementById('platillo-activo').checked = platillo.activo;
            document.getElementById('platillo-id').value = platillo.id_platillo;

            // Cargar ingredientes del platillo
            const response = await fetchData(`platillos.php?id=${id}&ingredientes=true`);
            ingredientesPlatillo = response?.ingredientesPlatillos || [];
            actualizarTablaIngredientesPlatillo();

            // Scroll al formulario
            document.querySelector('.platillos-form').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al preparar edición de platillo:', error);
        showAlert('error', 'Error al preparar edición de platillo');
    }
}

// Mostrar ingredientes de un platillo (modal)
async function mostrarIngredientesPlatillo(id) {
    try {
        const platillo = platillos.find(p => p.id_platillo == id);

        if (!platillo) {
            showAlert('error', 'Platillo no encontrado');
            return;
        }

        // Obtener ingredientes del platillo
        const response = await fetchData(`platillos.php?id=${id}&ingredientes=true`);
        const ingredientesPlatillo = response?.ingredientesPlatillos || [];

        // Crear contenido del modal
        let html = `
            <h3>Ingredientes de ${platillo.nombre}</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (ingredientesPlatillo.length > 0) {
            ingredientesPlatillo.forEach(ing => {
                const ingrediente = ingredientesPlatillos.find(i => i.id_ingrediente == ing.id_ingrediente);
                html += `
                    <tr>
                        <td>${ingrediente?.nombre || 'Desconocido'}</td>
                        <td>${ing.cantidad}</td>
                        <td>${ingrediente?.unidad_medida || ''}</td>
                    </tr>
                `;
            });
        } else {
            html += '<tr><td colspan="3" class="text-center">No hay ingredientes registrados</td></tr>';
        }

        html += `
                </tbody>
            </table>
        `;

        // Mostrar modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
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
        console.error('Error al mostrar ingredientes:', error);
        showAlert('error', 'Error al mostrar ingredientes del platillo');
    }
}

// Eliminar platillo
async function eliminarPlatillo(id) {
    try {
        if (confirm('¿Estás seguro de eliminar este platillo? Esta acción no se puede deshacer.')) {
            const response = await fetchData(`platillos.php?id=${id}`, 'DELETE');

            if (response && response.success) {
                showAlert('success', 'Platillo eliminado correctamente');
                await cargarPlatillos();
                limpiarFormularioPlatillo();
            } else {
                showAlert('error', 'Error al eliminar platillo');
            }
        }
    } catch (error) {
        console.error('Error al eliminar platillo:', error);
        showAlert('error', 'Error al eliminar platillo');
    }
}

// Agregar ingrediente al platillo actual
function agregarIngredienteAPlatillo() {
    const selectIngrediente = document.getElementById('ingrediente-platillo');
    const cantidadInput = document.getElementById('ingrediente-cantidad');

    if (!selectIngrediente.value) {
        showAlert('error', 'Selecciona un ingrediente');
        return;
    }

    const cantidad = parseFloat(cantidadInput.value);
    if (isNaN(cantidad) || cantidad <= 0) {
        showAlert('error', 'Ingresa una cantidad válida');
        return;
    }

    const ingredienteId = selectIngrediente.value;
    const ingrediente = ingredientesPlatillos.find(i => i.id_ingrediente == ingredienteId);

    if (!ingrediente) {
        showAlert('error', 'Ingrediente no encontrado');
        return;
    }

    // Verificar si el ingrediente ya está en el platillo
    const ingredienteExistente = ingredientesPlatillo.find(item => item.id_ingrediente == ingredienteId);

    if (ingredienteExistente) {
        // Actualizar cantidad
        ingredienteExistente.cantidad = cantidad;
    } else {
        // Agregar nuevo ingrediente
        ingredientesPlatillo.push({
            id_ingrediente: ingredienteId,
            nombre: ingrediente.nombre,
            cantidad: cantidad,
            unidad_medida: ingrediente.unidad_medida
        });
    }

    // Actualizar tabla de ingredientes
    actualizarTablaIngredientesPlatillo();

    // Limpiar selección
    selectIngrediente.value = '';
    cantidadInput.value = '';
}

// Actualizar tabla de ingredientes del platillo
function actualizarTablaIngredientesPlatillo() {
    const tbody = document.querySelector('#ingredientes-platillo tbody');
    tbody.innerHTML = '';

    ingredientesPlatillo.forEach(ingrediente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ingrediente.nombre}</td>
            <td>${ingrediente.cantidad}</td>
            <td class="actions">
                <button class="btn btn-danger btn-sm" data-id="${ingrediente.id_ingrediente}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Configurar eventos de botones eliminar
    document.querySelectorAll('#ingredientes-platillo .btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingredienteId = this.getAttribute('data-id');
            eliminarIngredienteDePlatillo(ingredienteId);
        });
    });

    // Calcular costo estimado
    calcularCostoPlatillo();
}

// Eliminar ingrediente del platillo actual
function eliminarIngredienteDePlatillo(ingredienteId) {
    ingredientesPlatillo = ingredientesPlatillo.filter(item => item.id_ingrediente != ingredienteId);
    actualizarTablaIngredientesPlatillo();
}

// Calcular costo estimado del platillo
function calcularCostoPlatillo() {
    let costoTotal = 0;

    ingredientesPlatillo.forEach(item => {
        const ingrediente = ingredientesPlatillos.find(i => i.id_ingrediente == item.id_ingrediente);
        if (ingrediente) {
            costoTotal += ingrediente.precio_compra * item.cantidad;
        }
    });

    // Actualizar campo de costo (sin disparar eventos)
    const costoInput = document.getElementById('platillo-costo');
    const originalValue = costoInput.value;
    costoInput.value = costoTotal.toFixed(2);
    if (originalValue !== costoInput.value) {
        costoInput.dispatchEvent(new Event('change'));
    }
}

// Guardar platillo (crear o actualizar)
async function guardarPlatillo() {
    try {
        const nombre = document.getElementById('platillo-nombre').value.trim();
        const categoriaId = document.getElementById('platillo-categoria').value;
        const descripcion = document.getElementById('platillo-descripcion').value.trim();
        const precio = parseFloat(document.getElementById('platillo-precio').value);
        const costo = parseFloat(document.getElementById('platillo-costo').value);
        const activo = document.getElementById('platillo-activo').checked;
        const id = document.getElementById('platillo-id').value;

        // Validaciones
        if (!nombre || isNaN(precio) || isNaN(costo)) {
            showAlert('error', 'Nombre, precio y costo son campos requeridos');
            return;
        }

        if (precio <= 0 || costo < 0) {
            showAlert('error', 'El precio debe ser mayor a cero y el costo no puede ser negativo');
            return;
        }

        if (ingredientesPlatillo.length === 0) {
            showAlert('error', 'Agrega al menos un ingrediente al platillo');
            return;
        }

        const data = {
            nombre: nombre,
            id_categoria: categoriaId || null,
            descripcion: descripcion || null,
            precio: precio,
            costo: costo,
            activo: activo,
            ingredientes: ingredientesPlatillo.map(item => ({
                id_ingrediente: item.id_ingrediente,
                cantidad: item.cantidad
            }))
        };

        let response;

        if (modoEdicion && id) {
            // Actualizar platillo existente
            data.id_platillo = id;
            response = await fetchData('platillos.php', 'PUT', data);
        } else {
            // Crear nuevo platillo
            response = await fetchData('platillos.php', 'POST', data);
        }

        if (response && (response.success || response.id_platillo)) {
            showAlert('success', modoEdicion ? 'Platillo actualizado' : 'Platillo creado');
            await cargarPlatillos();
            limpiarFormularioPlatillo();
        } else {
            showAlert('error', 'Error al guardar platillo');
        }
    } catch (error) {
        console.error('Error al guardar platillo:', error);
        showAlert('error', 'Error al guardar platillo');
    }
}

// Limpiar formulario de platillo
function limpiarFormularioPlatillo() {
    modoEdicion = false;
    platilloEditando = null;
    ingredientesPlatillo = [];

    document.getElementById('platillo-nombre').value = '';
    document.getElementById('platillo-categoria').value = '';
    document.getElementById('platillo-descripcion').value = '';
    document.getElementById('platillo-precio').value = '';
    document.getElementById('platillo-costo').value = '';
    document.getElementById('platillo-activo').checked = true;
    document.getElementById('platillo-id').value = '';
    document.querySelector('#ingredientes-platillo tbody').innerHTML = '';

    // Enfocar en el primer campo
    document.getElementById('platillo-nombre').focus();
}

// Generar reporte de platillos
async function generarReportePlatillos() {
    try {
        // Obtener datos actualizados
        const datos = await fetchData('platillos.php');

        if (!datos || datos.length === 0) {
            showAlert('info', 'No hay datos para generar el reporte');
            return;
        }

        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('Reporte de Platillos', 105, 15, { align: 'center' });

        // Fecha
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

        // Tabla de datos
        const headers = [
            'ID',
            'Nombre',
            'Categoría',
            'Precio',
            'Costo',
            'Margen',
            'Estado'
        ];

        const rows = datos.map(platillo => {
            const categoria = categorias.find(c => c.id_categoria == platillo.id_categoria);
            const margen = platillo.precio - platillo.costo;
            const margenPorcentaje = (margen / platillo.precio) * 100;

            return {
                'ID': platillo.id_platillo,
                'Nombre': platillo.nombre,
                'Categoría': categoria?.nombre || 'Sin categoría',
                'Precio': `Q${parseFloat(platillo.precio).toFixed(2)}`,
                'Costo': `Q${parseFloat(platillo.costo).toFixed(2)}`,
                'Margen': `${margenPorcentaje.toFixed(1)}%`,
                'Estado': platillo.activo ? 'Activo' : 'Inactivo'
            };
        });

        // Configuración de la tabla
        doc.autoTable({
            head: [headers],
            body: rows.map(Object.values),
            startY: 30,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 50 },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 20 }
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
        doc.save(`Reporte_Platillos_${new Date().toISOString().slice(0, 10)}.pdf`);
        showAlert('success', 'Reporte generado con éxito');
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showAlert('error', 'Error al generar reporte');
    }
}

        /*return {
            loadInventarioData
        };
    })();

window.loadInventarioData = InventarioModule.loadInventarioData;*/

    // EXPONE SOLO LO NECESARIO
    return {
        loadPlatillosData: async function() {
            try {
                // Cargar datos iniciales
                await Promise.all([
                    cargarCategorias(),
                    cargarIngredientes(),
                    cargarPlatillos()
                ]);

                // Configurar eventos
                configurarEventosPlatillos();

                // Limpiar formulario
                limpiarFormularioPlatillo();
            } catch (error) {
                console.error('Error al cargar datos de platillos:', error);
                showAlert('error', 'Error al cargar datos de platillos');
            }
        }
    };
})();

// Asignar al ámbito global
window.loadPlatillosData = window.PlatillosModule.loadPlatillosData;
}

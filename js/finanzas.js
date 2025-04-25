// Variables globales
let transacciones = [];
let ingresos = [];
let gastos = [];
let ingredientes = [];

// Cargar datos del módulo de finanzas
async function loadFinanzasData() {
    try {
        // Cargar datos iniciales
        await Promise.all([
            cargarTransacciones(),
            cargarIngredientes()
        ]);

        // Configurar eventos
        configurarEventosFinanzas();

        // Configurar gráficos
        configurarGraficosFinanzas();
    } catch (error) {
        console.error('Error al cargar datos de finanzas:', error);
        showAlert('error', 'Error al cargar datos de finanzas');
    }
}

// Configurar eventos del módulo de finanzas
function configurarEventosFinanzas() {
    // Aplicar filtros
    document.getElementById('aplicar-filtros-btn').addEventListener('click', aplicarFiltros);

    // Cambio en tipo de transacción
    document.getElementById('transaccion-tipo').addEventListener('change', function() {
        const tipo = this.value;
        const container = document.getElementById('gasto-ingrediente-container');
        container.style.display = tipo === 'gasto' ? 'block' : 'none';
    });

    // Guardar transacción
    document.getElementById('guardar-transaccion-btn').addEventListener('click', guardarTransaccion);

    // Generar reporte
    document.getElementById('generar-reporte-finanzas').addEventListener('click', generarReporteFinanzas);
}

// Cargar transacciones
async function cargarTransacciones() {
    try {
        // Obtener todas las transacciones
        const [ingresosData, gastosData] = await Promise.all([
            fetchData('finanzas.php?tipo=ingreso'),
            fetchData('finanzas.php?tipo=gasto')
        ]);

        ingresos = ingresosData || [];
        gastos = gastosData || [];

        // Combinar y ordenar transacciones
        transacciones = [
            ...ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
            ...gastos.map(g => ({ ...g, tipo: 'gasto' }))
        ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        actualizarTablaFinanzas(transacciones);
        actualizarResumenFinanciero();
    } catch (error) {
        console.error('Error al cargar transacciones:', error);
        showAlert('error', 'Error al cargar transacciones');
    }
}

// Cargar ingredientes para gastos
async function cargarIngredientes() {
    try {
        ingredientes = await fetchData('inventario.php');

        // Llenar select de ingredientes
        const selectIngrediente = document.getElementById('gasto-ingrediente');
        selectIngrediente.innerHTML = '<option value="">No aplica</option>';

        if (ingredientes && ingredientes.length > 0) {
            ingredientes.forEach(ingrediente => {
                const option = document.createElement('option');
                option.value = ingrediente.id_ingrediente;
                option.textContent = ingrediente.nombre;
                selectIngrediente.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
        showAlert('error', 'Error al cargar ingredientes');
    }
}

// Actualizar tabla de transacciones
function actualizarTablaFinanzas(data) {
    const tbody = document.querySelector('#tabla-finanzas tbody');
    tbody.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(transaccion => {
            const tr = document.createElement('tr');

            // Formatear fecha
            const fecha = new Date(transaccion.fecha);
            const fechaFormateada = fecha.toLocaleDateString();

            // Estilo según tipo
            const tipoClass = transaccion.tipo === 'ingreso' ? 'text-success' : 'text-danger';
            const icono = transaccion.tipo === 'ingreso' ? 'fa-arrow-up' : 'fa-arrow-down';

            tr.innerHTML = `
                <td>${fechaFormateada}</td>
                <td>
                    <span class="${tipoClass}">
                        <i class="fas ${icono}"></i> ${transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </span>
                </td>
                <td>${transaccion.concepto}</td>
                <td class="${tipoClass}">
                    ${transaccion.tipo === 'ingreso' ? '+' : '-'}Q${parseFloat(transaccion.monto).toFixed(2)}
                </td>
                <td>${transaccion.descripcion || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay transacciones registradas</td></tr>';
    }
}

// Actualizar resumen financiero
function actualizarResumenFinanciero() {
    // Calcular totales
    const totalIngresos = ingresos.reduce((sum, ingreso) => sum + parseFloat(ingreso.monto), 0);
    const totalGastos = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
    const balanceNeto = totalIngresos - totalGastos;

    // Actualizar UI
    document.getElementById('ingresos-totales').textContent = `Q${totalIngresos.toFixed(2)}`;
    document.getElementById('gastos-totales').textContent = `Q${totalGastos.toFixed(2)}`;
    document.getElementById('balance-neto').textContent = `Q${balanceNeto.toFixed(2)}`;

    // Actualizar clase según balance
    const balanceElement = document.getElementById('balance-neto');
    balanceElement.className = '';
    if (balanceNeto > 0) {
        balanceElement.classList.add('text-success');
    } else if (balanceNeto < 0) {
        balanceElement.classList.add('text-danger');
    }
}

// Configurar gráficos financieros
function configurarGraficosFinanzas() {
    const ctx = document.getElementById('finanzasChart').getContext('2d');

    // Datos para el gráfico (últimos 6 meses)
    const meses = [];
    const ingresosPorMes = [];
    const gastosPorMes = [];

    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const mes = fecha.toLocaleString('default', { month: 'short' });
        meses.push(mes);

        // Filtrar transacciones por mes
        const mesInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const mesFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

        const ingresosMes = ingresos.filter(ingreso => {
            const fechaIngreso = new Date(ingreso.fecha);
            return fechaIngreso >= mesInicio && fechaIngreso <= mesFin;
        }).reduce((sum, ingreso) => sum + parseFloat(ingreso.monto), 0);

        const gastosMes = gastos.filter(gasto => {
            const fechaGasto = new Date(gasto.fecha);
            return fechaGasto >= mesInicio && fechaGasto <= mesFin;
        }).reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);

        ingresosPorMes.push(ingresosMes);
        gastosPorMes.push(gastosMes);
    }

    // Crear gráfico
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresosPorMes,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Gastos',
                    data: gastosPorMes,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monto (Q)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mes'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Ingresos vs Gastos (últimos 6 meses)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: Q${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Aplicar filtros a las transacciones
async function aplicarFiltros() {
    try {
        const tipo = document.getElementById('finanzas-tipo').value;
        const fechaInicio = document.getElementById('finanzas-fecha-inicio').value;
        const fechaFin = document.getElementById('finanzas-fecha-fin').value;

        // Construir URL de consulta
        let url = 'finanzas.php?';

        if (tipo !== 'todos') {
            url += `tipo=${tipo}&`;
        }

        if (fechaInicio) {
            url += `fecha_inicio=${fechaInicio}&`;
        }

        if (fechaFin) {
            url += `fecha_fin=${fechaFin}&`;
        }

        // Eliminar el último & si existe
        url = url.replace(/&$/, '');

        // Obtener transacciones filtradas
        const transaccionesFiltradas = await fetchData(url);

        // Procesar respuesta según el tipo de filtro
        if (tipo === 'todos') {
            // Combinar ingresos y gastos
            const ingresosFiltrados = transaccionesFiltradas.ingresos || [];
            const gastosFiltrados = transaccionesFiltradas.gastos || [];

            transacciones = [
                ...ingresosFiltrados.map(i => ({ ...i, tipo: 'ingreso' })),
                ...gastosFiltrados.map(g => ({ ...g, tipo: 'gasto' }))
            ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            actualizarTablaFinanzas(transacciones);
        } else {
            // Solo un tipo (ingreso o gasto)
            transacciones = transaccionesFiltradas.map(t => ({ ...t, tipo }));
            actualizarTablaFinanzas(transacciones);
        }

        showAlert('success', 'Filtros aplicados correctamente');
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        showAlert('error', 'Error al aplicar filtros');
    }
}

// Guardar transacción (ingreso o gasto)
async function guardarTransaccion() {
    try {
        const tipo = document.getElementById('transaccion-tipo').value;
        const concepto = document.getElementById('transaccion-concepto').value.trim();
        const monto = parseFloat(document.getElementById('transaccion-monto').value);
        const descripcion = document.getElementById('transaccion-descripcion').value.trim();
        const idIngrediente = tipo === 'gasto' ? document.getElementById('gasto-ingrediente').value : null;

        // Validaciones
        if (!concepto || isNaN(monto) || monto <= 0) {
            showAlert('error', 'Concepto y monto son campos requeridos y el monto debe ser mayor a cero');
            return;
        }

        const data = {
            concepto: concepto,
            monto: monto,
            descripcion: descripcion || null
        };

        if (tipo === 'gasto' && idIngrediente) {
            data.id_ingrediente = idIngrediente;
        }

        const endpoint = tipo === 'ingreso' ? 'ingresos' : 'gastos';
        const response = await fetchData(`finanzas.php`, 'POST', { ...data, tipo });

        if (response && response.success) {
            showAlert('success', 'Transacción registrada correctamente');

            // Limpiar formulario
            document.getElementById('transaccion-concepto').value = '';
            document.getElementById('transaccion-monto').value = '';
            document.getElementById('transaccion-descripcion').value = '';
            document.getElementById('gasto-ingrediente').value = '';

            // Recargar datos
            await cargarTransacciones();
        } else {
            showAlert('error', 'Error al registrar transacción');
        }
    } catch (error) {
        console.error('Error al guardar transacción:', error);
        showAlert('error', 'Error al guardar transacción');
    }
}

// Generar reporte de finanzas
async function generarReporteFinanzas() {
    try {
        // Obtener parámetros de filtro actuales
        const tipo = document.getElementById('finanzas-tipo').value;
        const fechaInicio = document.getElementById('finanzas-fecha-inicio').value;
        const fechaFin = document.getElementById('finanzas-fecha-fin').value;

        // Construir URL de consulta
        let url = 'finanzas.php?';

        if (tipo !== 'todos') {
            url += `tipo=${tipo}&`;
        }

        if (fechaInicio) {
            url += `fecha_inicio=${fechaInicio}&`;
        }

        if (fechaFin) {
            url += `fecha_fin=${fechaFin}&`;
        }

        // Eliminar el último & si existe
        url = url.replace(/&$/, '');

        // Obtener datos filtrados
        const datos = await fetchData(url);

        if (!datos || (tipo === 'todos' && (!datos.ingresos || datos.ingresos.length === 0) && (!datos.gastos || datos.gastos.length === 0)) ||
            (tipo !== 'todos' && datos.length === 0)) {
            showAlert('info', 'No hay datos para generar el reporte');
            return;
        }

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();

        if (tipo === 'todos') {
            // Hoja de ingresos
            const ingresosData = datos.ingresos || [];
            if (ingresosData.length > 0) {
                const ingresosSheet = XLSX.utils.json_to_sheet(
                    ingresosData.map(i => ({
                        'ID': i.id_ingreso,
                        'Fecha': new Date(i.fecha).toLocaleDateString(),
                        'Concepto': i.concepto,
                        'Monto': parseFloat(i.monto),
                        'Descripción': i.descripcion || 'N/A'
                    }))
                );
                XLSX.utils.book_append_sheet(wb, ingresosSheet, 'Ingresos');
            }

            // Hoja de gastos
            const gastosData = datos.gastos || [];
            if (gastosData.length > 0) {
                const gastosSheet = XLSX.utils.json_to_sheet(
                    gastosData.map(g => ({
                        'ID': g.id_gasto,
                        'Fecha': new Date(g.fecha).toLocaleDateString(),
                        'Concepto': g.concepto,
                        'Monto': parseFloat(g.monto),
                        'Ingrediente': g.id_ingrediente ?
                            (ingredientes.find(i => i.id_ingrediente == g.id_ingrediente)?.nombre || 'N/A') : 'N/A',
                        'Descripción': g.descripcion || 'N/A'
                    }))
                );
                XLSX.utils.book_append_sheet(wb, gastosSheet, 'Gastos');
            }

            // Hoja de resumen
            const totalIngresos = ingresosData.reduce((sum, i) => sum + parseFloat(i.monto), 0);
            const totalGastos = gastosData.reduce((sum, g) => sum + parseFloat(g.monto), 0);
            const balance = totalIngresos - totalGastos;

            const resumenData = [
                { 'Concepto': 'Total Ingresos', 'Monto': totalIngresos },
                { 'Concepto': 'Total Gastos', 'Monto': totalGastos },
                { 'Concepto': 'Balance Neto', 'Monto': balance }
            ];

            const resumenSheet = XLSX.utils.json_to_sheet(resumenData);
            XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen');
        } else {
            // Solo un tipo de transacción
            const sheetData = datos.map(t => ({
                'ID': t.id_ingreso || t.id_gasto,
                'Fecha': new Date(t.fecha).toLocaleDateString(),
                'Concepto': t.concepto,
                'Monto': parseFloat(t.monto),
                'Ingrediente': tipo === 'gasto' && t.id_ingrediente ?
                    (ingredientes.find(i => i.id_ingrediente == t.id_ingrediente)?.nombre || t.id_ingrediente) : 'N/A',
                'Descripción': t.descripcion || 'N/A'
            }));

            const sheet = XLSX.utils.json_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(wb, sheet, tipo === 'ingreso' ? 'Ingresos' : 'Gastos');
        }

        // Generar nombre de archivo
        let nombreArchivo = 'Reporte_Finanzas';
        if (tipo !== 'todos') {
            nombreArchivo += `_${tipo}`;
        }
        if (fechaInicio || fechaFin) {
            nombreArchivo += `_${fechaInicio || 'inicio'}_a_${fechaFin || 'hoy'}`;
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
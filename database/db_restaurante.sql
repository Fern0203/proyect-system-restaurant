-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sistema_restaurante;
USE sistema_restaurante;

-- Tabla de clientes
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías de platillos
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Tabla de platillos
CREATE TABLE platillos (
    id_platillo INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- Tabla de ingredientes
CREATE TABLE ingredientes (
    id_ingrediente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    stock DECIMAL(10,2) NOT NULL,
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    precio_compra DECIMAL(10,2) NOT NULL
);

-- Tabla de relación platillo-ingrediente
CREATE TABLE platillo_ingredientes (
    id_platillo INT,
    id_ingrediente INT,
    cantidad DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_platillo, id_ingrediente),
    FOREIGN KEY (id_platillo) REFERENCES platillos(id_platillo),
    FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id_ingrediente)
);

-- Tabla de ventas
CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

-- Tabla de detalles de venta
CREATE TABLE detalle_venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT,
    id_platillo INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_platillo) REFERENCES platillos(id_platillo)
);

-- Tabla de ingresos
CREATE TABLE ingresos (
    id_ingreso INT AUTO_INCREMENT PRIMARY KEY,
    concepto VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT
);

-- Tabla de gastos
CREATE TABLE gastos (
    id_gasto INT AUTO_INCREMENT PRIMARY KEY,
    concepto VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    id_ingrediente INT NULL,
    FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id_ingrediente)
);

-- Insertar datos de ejemplo
-- Categorías
INSERT INTO categorias (nombre, descripcion) VALUES 
('Entradas', 'Platillos para comenzar la comida'),
('Platos Fuertes', 'Platillos principales'),
('Postres', 'Deliciosos postres'),
('Bebidas', 'Refrescantes bebidas');

-- Ingredientes
INSERT INTO ingredientes (nombre, unidad_medida, stock, stock_minimo, precio_compra) VALUES 
('Pollo', 'kg', 20, 5, 45.50),
('Carne de res', 'kg', 15, 5, 120.75),
('Arroz', 'kg', 30, 10, 25.00),
('Frijoles', 'kg', 20, 5, 30.50),
('Tortillas', 'pieza', 200, 50, 0.50),
('Queso', 'kg', 10, 3, 95.00),
('Crema', 'lt', 5, 2, 35.00),
('Lechuga', 'pieza', 15, 5, 12.00),
('Tomate', 'kg', 8, 3, 18.00),
('Cebolla', 'kg', 10, 3, 15.00),
('Aguacate', 'pieza', 20, 5, 22.00),
('Harina', 'kg', 15, 5, 20.00),
('Azúcar', 'kg', 10, 3, 18.50),
('Huevo', 'pieza', 60, 20, 2.50),
('Leche', 'lt', 10, 3, 22.00);

-- Platillos
INSERT INTO platillos (id_categoria, nombre, descripcion, precio, costo) VALUES 
(1, 'Sopa de tortilla', 'Deliciosa sopa de tortilla con aguacate y queso', 65.00, 25.00),
(1, 'Ensalada César', 'Ensalada fresca con aderezo césar y crotones', 55.00, 20.00),
(2, 'Pollo a la parrilla', 'Pollo asado con especias acompañado de arroz y ensalada', 120.00, 45.00),
(2, 'Filete de res', 'Filete de res a la parrilla con guarnición al gusto', 180.00, 80.00),
(2, 'Enchiladas verdes', 'Tortillas rellenas bañadas en salsa verde', 95.00, 35.00),
(3, 'Flan napolitano', 'Delicioso flan casero con caramelo', 45.00, 15.00),
(3, 'Pastel de chocolate', 'Rebanada de pastel de chocolate con crema batida', 50.00, 18.00),
(4, 'Refresco', 'Refresco de 600ml', 25.00, 8.00),
(4, 'Agua mineral', 'Agua mineral de 500ml', 20.00, 6.00),
(4, 'Jugo natural', 'Jugo natural de fruta de temporada', 30.00, 10.00);

-- Platillo-ingredientes
INSERT INTO platillo_ingredientes (id_platillo, id_ingrediente, cantidad) VALUES 
(1, 5, 3), (1, 6, 0.1), (1, 11, 0.5), (1, 8, 0.2), (1, 9, 0.2),
(2, 8, 0.3), (2, 6, 0.05), (2, 5, 1), (2, 7, 0.02),
(3, 1, 0.3), (3, 3, 0.2), (3, 8, 0.1), (3, 9, 0.1), (3, 10, 0.05),
(4, 2, 0.4), (4, 3, 0.2), (4, 8, 0.1), (4, 9, 0.1), (4, 10, 0.05),
(5, 1, 0.2), (5, 5, 3), (5, 6, 0.1), (5, 7, 0.05), (5, 9, 0.2),
(6, 13, 0.1), (6, 14, 2), (6, 15, 0.2),
(7, 12, 0.15), (7, 13, 0.1), (7, 14, 1), (7, 15, 0.1);

-- Clientes
INSERT INTO clientes (nombre, telefono, email, direccion) VALUES 
('Juan Pérez', '5551234567', 'juan@example.com', 'Calle Falsa 123'),
('María García', '5557654321', 'maria@example.com', 'Avenida Siempre Viva 456'),
('Pedro López', '5559876543', 'pedro@example.com', 'Boulevard de los Sueños Rotos 789'),
('Ana Martínez', '5554567890', 'ana@example.com', 'Callejón del Beso 101');

-- Ventas
INSERT INTO ventas (id_cliente, fecha, total, estado) VALUES 
(1, '2023-05-10 12:30:00', 240.00, 'completada'),
(2, '2023-05-10 13:15:00', 175.00, 'completada'),
(3, '2023-05-10 14:00:00', 360.00, 'completada'),
(4, '2023-05-10 19:30:00', 410.00, 'completada');

-- Detalle venta
INSERT INTO detalle_venta (id_venta, id_platillo, cantidad, precio_unitario, subtotal) VALUES 
(1, 3, 2, 120.00, 240.00),
(2, 1, 1, 65.00, 65.00),
(2, 5, 1, 95.00, 95.00),
(2, 8, 1, 25.00, 25.00),
(3, 4, 2, 180.00, 360.00),
(4, 2, 1, 55.00, 55.00),
(4, 4, 1, 180.00, 180.00),
(4, 6, 2, 45.00, 90.00),
(4, 9, 1, 20.00, 20.00),
(4, 10, 3, 30.00, 90.00);

-- Ingresos
INSERT INTO ingresos (concepto, monto, fecha, descripcion) VALUES 
('Venta 1', 240.00, '2023-05-10 12:30:00', 'Venta de 2 platos de pollo'),
('Venta 2', 175.00, '2023-05-10 13:15:00', 'Combo de comida'),
('Venta 3', 360.00, '2023-05-10 14:00:00', '2 filetes de res'),
('Venta 4', 410.00, '2023-05-10 19:30:00', 'Cena familiar');

-- Gastos
INSERT INTO gastos (concepto, monto, fecha, descripcion, id_ingrediente) VALUES 
('Compra de pollo', 500.00, '2023-05-09 08:00:00', 'Compra semanal de pollo', 1),
('Compra de carne', 1200.00, '2023-05-09 08:30:00', 'Compra semanal de carne', 2),
('Compra de verduras', 350.00, '2023-05-09 09:00:00', 'Compra semanal de verduras', NULL),
('Renta local', 8000.00, '2023-05-01 10:00:00', 'Pago de renta del mes', NULL),
('Pago de luz', 1200.00, '2023-05-05 11:00:00', 'Recibo de luz', NULL);
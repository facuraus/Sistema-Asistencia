CREATE DATABASE IF NOT EXISTS sistema_asistencias;
USE sistema_asistencias;

-- Tabla de dispositivos (primero, porque la referencia)
CREATE TABLE IF NOT EXISTS dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(100),
    uuid_dispositivo VARCHAR(100) UNIQUE -- identificador único del dispositivo (ej. IMEI)
);

-- Tabla de sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    lat DOUBLE,                -- latitud para geolocalización
    lon DOUBLE,
    radio_metros INT DEFAULT 100,
    dispositivo_id INT UNIQUE,  -- celular asignado a la sucursal
    zona_horaria VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    CONSTRAINT fk_sucursal_dispositivo FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE SET NULL
);

-- Tabla para guardar tokens temporales para asignar dispositivos a sucursales
CREATE TABLE IF NOT EXISTS registros_dispositivos (
    token VARCHAR(100) PRIMARY KEY,
    sucursal_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla de usuarios 
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    foto_path VARCHAR(255),  -- ruta o nombre de archivo de la foto facial
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Tabla de relación usuarios - sucursales
CREATE TABLE IF NOT EXISTS usuarios_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, sucursal_id)
);

-- Tabla de asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('entrada', 'salida') NOT NULL,
    lat DOUBLE,
    lon DOUBLE,
    llego_tarde BOOLEAN DEFAULT FALSE,
    estado_asistencia VARCHAR(20) DEFAULT 'presente',
    sucursal_fichada_id INT,
    dispositivo_id INT,
    validacion_facial BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sucursal_fichada_id) REFERENCES sucursales(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

-- Insertar roles básicos
INSERT IGNORE INTO roles (id, nombre) VALUES
(1, 'admin_general'),
(2, 'supervisor'),
(3, 'empleado');

-- Aquí podés insertar dispositivos y sucursales luego, respetando las FK.

-- Crear gerente ejemplo
INSERT IGNORE INTO usuarios (id, nombre, apellido, correo, password_hash, rol_id) VALUES
(1, 'Gerente', 'General', 'gerente@gmail.com', SHA2('Gerente123-', 256), 1);

-- Crear supervisores
INSERT IGNORE INTO usuarios (id, nombre, apellido, correo, password_hash, rol_id) VALUES
(2, 'Supervisor', 'Uno', 'supervisor1@gmail.com', SHA2('Supervisor123-', 256), 2),
(3, 'Supervisor', 'Dos', 'supervisor2@gmail.com', SHA2('Supervisor123-', 256), 2),
(4, 'Supervisor', 'Tres', 'supervisor3@gmail.com', SHA2('Supervisor123-', 256), 2),
(5, 'Supervisor', 'Cuatro', 'supervisor4@gmail.com', SHA2('Supervisor123-', 256), 2),
(6, 'Supervisor', 'Cinco', 'supervisor5@gmail.com', SHA2('Supervisor123-', 256), 2);

-- Asignar sucursales al gerente (todas)
INSERT IGNORE INTO usuarios_sucursales (usuario_id, sucursal_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5);

-- Asignar sucursales a cada supervisor
INSERT IGNORE INTO usuarios_sucursales (usuario_id, sucursal_id) VALUES
(2, 1),
(3, 2),
(4, 3),
(5, 4),
(6, 5);

const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro de usuario (con creación automática de club)
const register = async (req, res) => {
    try {
        const { email, password, nombre_completo, telefono, club_nombre } = req.body;

        // Verificar si el usuario ya existe
        const userExists = await pool.query(
            'SELECT * FROM rendimiento.usuarios WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // 1. CREAR EL CLUB
        const clubResult = await pool.query(
            `INSERT INTO rendimiento.clubes (nombre, descripcion) 
             VALUES ($1, $2) 
             RETURNING id_club`,
            [club_nombre || 'Mi Club', 'Club creado desde el registro']
        );
        
        const clubId = clubResult.rows[0].id_club;
        console.log('✅ Club creado con ID:', clubId);

        // 2. ENCRIPTAR CONTRASEÑA
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. CREAR EL USUARIO (ADMIN) ASOCIADO AL CLUB
        // NOTA: Usamos 'profesor' en tipo_usuario porque es uno de los valores permitidos en la tabla
        const newUser = await pool.query(
            `INSERT INTO rendimiento.usuarios 
            (email, password_hash, nombre_completo, telefono, tipo_usuario, plan, rol, id_club) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id_usuario, email, nombre_completo, telefono, tipo_usuario, plan, fecha_registro, rol, id_club`,
            [email, passwordHash, nombre_completo, telefono, 'profesor', 'mensual', 'admin', clubId]
        );

        // 4. GENERAR TOKEN CON ID_CLUB
        const token = jwt.sign(
            { 
                id: newUser.rows[0].id_usuario,
                email: newUser.rows[0].email,
                tipo: newUser.rows[0].tipo_usuario,
                rol: newUser.rows[0].rol,
                id_club: newUser.rows[0].id_club
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'Club y usuario creados exitosamente',
            token,
            user: newUser.rows[0],
            club: {
                id: clubId,
                nombre: club_nombre || 'Mi Club'
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

// Login de usuario
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario por email (INCLUYENDO id_club)
        const result = await pool.query(
            `SELECT u.*, c.nombre as club_nombre 
             FROM rendimiento.usuarios u
             LEFT JOIN rendimiento.clubes c ON u.id_club = c.id_club
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        // Actualizar último acceso
        await pool.query(
            'UPDATE rendimiento.usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = $1',
            [user.id_usuario]
        );

        // Generar token (INCLUYENDO id_club)
        const token = jwt.sign(
            { 
                id: user.id_usuario,
                email: user.email,
                tipo: user.tipo_usuario,
                rol: user.rol,
                id_club: user.id_club
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // No enviar password_hash
        delete user.password_hash;

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Obtener perfil del usuario logueado
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT u.id_usuario, u.email, u.nombre_completo, u.telefono, u.tipo_usuario, 
                    u.plan, u.fecha_registro, u.ultimo_acceso, u.activo, u.rol, u.id_club,
                    c.nombre as club_nombre
             FROM rendimiento.usuarios u
             LEFT JOIN rendimiento.clubes c ON u.id_club = c.id_club
             WHERE u.id_usuario = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getProfile
};
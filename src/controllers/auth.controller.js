const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ================= REGISTER =================
const register = async (req, res) => {
    try {
        console.log("📥 BODY REGISTER:", req.body);

        const { email, password, nombre_completo, telefono, club_nombre } = req.body;

        // Validación básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email y password son obligatorios"
            });
        }

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

        // 1. CREAR CLUB
        const clubResult = await pool.query(
            `INSERT INTO rendimiento.clubes 
             (nombre, descripcion, plan, fecha_inicio_trial, fecha_expiracion_trial, jugadores_max, almacenamiento_max) 
             VALUES ($1, $2, 'trial', CURRENT_TIMESTAMP, CURRENT_DATE + 15, 30, 5) 
             RETURNING id_club, fecha_expiracion_trial`,
            [club_nombre || 'Mi Club', 'Club creado desde el registro']
        );

        const clubId = clubResult.rows[0].id_club;

        // 2. ENCRIPTAR PASSWORD
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. CREAR USUARIO
        const newUser = await pool.query(
            `INSERT INTO rendimiento.usuarios 
            (email, password_hash, nombre_completo, telefono, tipo_usuario, plan, rol, id_club) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id_usuario, email, nombre_completo, telefono, tipo_usuario, plan, rol, id_club`,
            [email, passwordHash, nombre_completo, telefono, 'profesor', 'mensual', 'admin', clubId]
        );

        // 4. TOKEN
        const token = jwt.sign(
            {
                id: newUser.rows[0].id_usuario,
                email: newUser.rows[0].email,
                tipo: newUser.rows[0].tipo_usuario,
                rol: newUser.rows[0].rol,
                id_club: newUser.rows[0].id_club
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            token,
            user: newUser.rows[0]
        });

    } catch (error) {
        console.log("💥 ERROR REGISTER:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================= LOGIN =================
const login = async (req, res) => {
    try {
        console.log("📥 BODY LOGIN:", req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email y password son obligatorios"
            });
        }

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
                message: 'Usuario no encontrado'
            });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        const token = jwt.sign(
            {
                id: user.id_usuario,
                email: user.email,
                tipo: user.tipo_usuario,
                rol: user.rol,
                id_club: user.id_club
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        delete user.password_hash;

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user
        });

    } catch (error) {
        console.log("💥 ERROR LOGIN:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================= PROFILE =================
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM rendimiento.usuarios WHERE id_usuario = $1`,
            [userId]
        );

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.log("💥 ERROR PROFILE:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getProfile
};
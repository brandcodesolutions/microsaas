const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Database setup
const db = new sqlite3.Database('salon.db');

// Promisify database methods
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Register salon
app.post('/api/register', async (req, res) => {
  try {
    const { salonName, ownerName, email, password, phone, address, description } = req.body;
    
    // Validate required fields
    if (!email || !password || !salonName) {
      return res.status(400).json({ error: 'Email, password and salon name are required' });
    }
    
    // Check if user already exists
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (email, password, name, phone, address, description) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, salonName, phone || '', address || '', description || '']
    );

    // Generate token
    const token = jwt.sign({ userId: result.id, email }, JWT_SECRET);

    res.status(201).json({
      message: 'Salão cadastrado com sucesso',
      token,
      user: {
        id: result.id,
        email,
        name: salonName
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get salon by ID (for public booking page)
app.get('/api/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    
    // Convert salonId to email format
    const email = `${salonId}@salon.com`;
    
    const salon = await dbGet(
      'SELECT id, name, phone, address, description FROM users WHERE email = ?',
      [email]
    );

    if (!salon) {
      return res.status(404).json({ error: 'Salão não encontrado' });
    }

    res.json(salon);
  } catch (error) {
    console.error('Get salon error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create appointment (public endpoint)
app.post('/api/appointments/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    const { clientName, email, phone, service, professional, date, time, observations } = req.body;

    // Find salon user
    const salonEmail = `${salonId}@salon.com`;
    const salon = await dbGet('SELECT * FROM users WHERE email = ?', [salonEmail]);
    
    if (!salon) {
      return res.status(404).json({ error: 'Salão não encontrado' });
    }

    // Create appointment
     const result = await dbRun(
       'INSERT INTO appointments (client_name, email, phone, service, professional, date, time, observations, status, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
       [clientName, email || '', phone || '', service, professional || '', date, time, observations || '', 'Confirmado', new Date().toISOString(), salon.id]
     );

    const newAppointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get appointments (protected)
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const userAppointments = await dbAll(
       'SELECT * FROM appointments WHERE user_id = ? ORDER BY created_at',
       [req.user.userId]
     );

    res.json(userAppointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update appointment status (protected)
app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await dbRun(
       'UPDATE appointments SET status = ? WHERE id = ? AND user_id = ?',
       [status, parseInt(id), req.user.userId]
     );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const updatedAppointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [parseInt(id)]);

    res.json({
      message: 'Status atualizado com sucesso',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete appointment (protected)
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbRun(
       'DELETE FROM appointments WHERE id = ? AND user_id = ?',
       [parseInt(id), req.user.userId]
     );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json({ message: 'Agendamento excluído com sucesso' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
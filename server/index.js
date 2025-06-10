require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Task, User } = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001; // Backend läuft auf Port 3001

// CORS-Middleware hinzufügen
app.use(cors());
app.use(express.json());  // Um JSON-Daten im Body zu verarbeiten

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Ungültiger Token' });
  }
};

// Datenbankabfrage in der Route integrieren
app.get('/', (req, res) => {
  Task.findAll({
    include: [{
      model: User,
      attributes: ['username'],
      required: false
    }]
  })
    .then(tasks => {
      res.json(tasks);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Route zum Erstellen einer neuen Aufgabe
app.post('/tasks', authMiddleware, (req, res) => {
  const { title, description, status } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Titel ist erforderlich' });
  }

  Task.create({
    title,
    description,
    status,
    userId: req.user.userId
  })
    .then(task => {
      res.status(201).json(task);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Route zum Löschen einer Aufgabe
app.delete('/tasks/:id', (req, res) => {
  const id = req.params.id;
  
  Task.destroy({
    where: {
      id: id
    }
  })
    .then(result => {
      if (result === 0) {
        return res.status(404).json({ error: 'Task nicht gefunden' });
      }
      res.json({ message: 'Task erfolgreich gelöscht' });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Route zum Aktualisieren einer Aufgabe
app.put('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const { title, description, status } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Titel ist erforderlich' });
  }

  Task.update(
    {
      title,
      description,
      status
    },
    {
      where: {
        id: id
      }
    }
  )
    .then(result => {
      if (result[0] === 0) {
        return res.status(404).json({ error: 'Task nicht gefunden' });
      }
      res.json({
        id: id,
        title,
        description,
        status,
        created_at: new Date().toISOString()
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Login-Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Benutzer suchen
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Passwort vergleichen
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // JWT Token generieren
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, username: user.username });
    
  } catch (error) {
    console.error('Login Fehler:', error);
    res.status(500).json({ error: 'Serverfehler bei der Anmeldung' });
  }
});

// Signup-Route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort werden benötigt' });
    }

    // Überprüfen ob Benutzer existiert
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'Benutzername bereits vergeben' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Neuen Benutzer erstellen
    const newUser = await User.create({
      username,
      password: hashedPassword
    });

    // JWT Token generieren
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      token, 
      username: newUser.username,
      message: 'Registrierung erfolgreich' 
    });

  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ 
      error: 'Serverfehler bei der Registrierung',
      details: error.message 
    });
  }
});

// Route to get tasks for the logged-in user
app.get('/user/tasks', authMiddleware, (req, res) => {
  Task.findAll({
    where: {
      userId: req.user.userId
    },
    include: [{
      model: User,
      attributes: ['username'],
      required: false
    }]
  })
    .then(tasks => {
      res.json(tasks);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Den Server starten
app.listen(port, '0.0.0.0', () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

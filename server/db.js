const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './tasks.db',
  logging: console.log // Optional für Debugging
});

// Modelldefinition
const Task = sequelize.define('Task', {
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: Sequelize.TEXT,
  status: {
    type: Sequelize.STRING,
    defaultValue: 'open'
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: false,
  tableName: 'tasks'
});

const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'users'
});

// Assoziationen hinzufügen
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

// Synchronisierung mit Testdaten
const initializeDatabase = async () => {
  try {
    const [tasksTableExists, usersTableExists] = await Promise.all([
      sequelize.getQueryInterface().tableExists('tasks'),
      sequelize.getQueryInterface().tableExists('users')
    ]);

    await sequelize.sync();

    // ZUERST BENUTZER ANLEGEN
    if (!usersTableExists) {
      const createdUsers = await User.bulkCreate([
        {
          username: 'admin',
          password: await bcrypt.hash('admin123', 10)
        },
        {
          username: 'user',
          password: await bcrypt.hash('test456', 10)
        }
      ]);
      console.log('Testbenutzer angelegt');
      
      // Referenzen direkt aus createdUsers nehmen
      const adminUser = createdUsers[0];
      const normalUser = createdUsers[1];

      // ERST JETZT TASKS ANLEGEN
      if (!tasksTableExists) {
        await Task.bulkCreate([
          {
            title: 'Erste Aufgabe',
            description: 'Dies ist ein Beispieltask',
            status: 'open',
            userId: adminUser.id
          },
          {
            title: 'Erledigte Aufgabe',
            description: 'Bereits abgeschlossener Task',
            status: 'done',
            userId: normalUser.id
          }
        ]);
        console.log('Testdaten erfolgreich eingefügt');
      }
    }
  } catch (error) {
    console.error('Initialisierungsfehler:', error);
  }
};

initializeDatabase();

module.exports = { sequelize, Task, User };

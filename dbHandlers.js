const sqlite3 = require('sqlite3').verbose();
const config = require('../data/config.json');
const db = new sqlite3.Database(config.main_db);

module.exports = {
initializeDb: function() {
  db.serialize(() => {
 // Создание таблицы бота
  db.run("CREATE TABLE IF NOT EXISTS status_bot (name TEXT, firstRunBot INTEGER, status INTEGER, lastMessage INTEGER)");
  // Создание таблицы Кнопок
  db.run("CREATE TABLE IF NOT EXISTS buttons (id INTEGER PRIMARY KEY, title TEXT, command TEXT)");
   // Создание таблицы пользователей
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, lastMessageBot INTEGER, name TEXT, balance INTEGER, discountPercent INTEGER, referrals INTEGER, registrationDate INTEGER, lang TEXT, isAdmin INTEGER)");
  // Создание таблицы товаров
  db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, description TEXT, price INTEGER)");
  // Создание таблицы заказов
  db.run("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, userId TEXT, productId INTEGER, quantity INTEGER)");
      });
  },
  getAllButtons: function(callback) {
      db.all("SELECT title FROM buttons", callback);
  },
  addNewButton: function(title, command, callback) {
      db.run("INSERT INTO buttons (title, command) VALUES (?, ?)", [title, command], callback);
  },
  deleteButton: function(title, callback) {
      db.run("DELETE FROM buttons WHERE title = ?", [title], callback);
  },
  getAllProducts: function(callback) {
      db.all("SELECT * FROM products", callback);
  },
  checkBotFirstRun: function(callback) {
    db.get("SELECT status FROM bot WHERE status = 1488", (err, row) => {
        if (err) {
            console.error("Ошибка при проверке статуса бота:", err);
            callback(err, null);
            return;
        }
        if (!row) {
            // Если записи нет, считаем, что это первый запуск и добавляем запись
            db.run("INSERT INTO bot (status) VALUES (1488)", (err) => {
                if (err) {
                    console.error("Ошибка при добавлении статуса бота:", err);
                    callback(err, null);
                    return;
                }
                console.log("Бот запущен впервые.");
                callback(null, true); // Возвращаем true, указывая на первый запуск
            });
        } else {
            callback(null, false); // Возвращаем false, бот уже запускался
        }
    });
  },
  createUser: function(userId, name, lang, callback) {
    db.run("INSERT INTO users (id, name, balance, discountPercent, referrals, registrationDate, isAdmin, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, name, 0, 0, 0, Math.floor(Date.now() / 1000), 0, lang], // Начальные значения и выбранный язык
        callback
    );
  },
  userCheckReg: function(userId, callback) {
    db.get("SELECT id, lang FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            callback(err);
            return;
        }
        if (row) {
            // Пользователь уже существует, возвращаем true и его язык
            callback(null, true, row.lang);
        } else {
            // Пользователь не найден, возвращаем false
            callback(null, false);
        }
    });
  },
  setUserLanguage: function(userId, lang, callback) {
    db.run("UPDATE users SET lang = ? WHERE id = ?", [lang, userId], callback);
  },
  getUserLanguage(userId, callback) {
    db.get("SELECT lang FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            // В случае ошибки возвращаем ошибку
            callback(err, null);
        } else if (row) {
            // Если пользователь найден, возвращаем его язык
            callback(null, row.lang);
        } else {
            // Если пользователь не найден, можно вернуть null или значение по умолчанию
            callback(null, null);
        }
    });
  },
  getUserProfile: function(userId, callback) {
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            callback(err, null);
        }
        if (row) {
          // Преобразование Unix time в читаемый формат даты
          const registrationDate = new Date(row.registrationDate * 1000);
          const formattedDate = [
              registrationDate.getDate().toString().padStart(2, '0'),
              (registrationDate.getMonth() + 1).toString().padStart(2, '0'), // Месяцы начинаются с 0
              registrationDate.getFullYear()
          ].join('/');
          
          const userProfile = {
            name: row.name,
            balance: row.balance,
            referrals: row.referrals,
            discountPercent: row.discountPercent,
            registrationDate: formattedDate,
            lang: row.lang
          };
          callback(null, userProfile);
      } else {
          callback(new Error('User not found'), null);
      }
   });
  },
  setLastMessageBot: function(userId, lastMessageId, callback) {
    const query = "UPDATE users SET lastMessageBot = ? WHERE id = ?";
    db.run(query, [lastMessageId, userId], function(err) {
        if (err) {
            console.error("Ошибка при обновлении lastMessageBot:", err);
            callback(err);
        } else {
            console.log(`lastMessageBot обновлён для пользователя ${userId}.`);
            callback(null);
        }
    });
  },
  getLastMessageBot: function(userId, callback) {
    const query = "SELECT lastMessageBot FROM users WHERE id = ?";
    db.get(query, [userId], function(err, row) {
        if (err) {
            console.error("Ошибка при получении lastMessageBot:", err);
            callback(err, null);
        } else if (row) {
            console.log(`Извлечён lastMessageBot для пользователя ${userId}: ${row.lastMessageBot}`);
            callback(null, row.lastMessageBot);
        } else {
            console.log(`Пользователь ${userId} не найден.`);
            callback(new Error(`Пользователь ${userId} не найден.`), null);
        }
    });
  }
};



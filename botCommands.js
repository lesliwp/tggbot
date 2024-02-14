const { Markup } = require('telegraf');
const dbHandlers = require('./dbHandlers');
const config = require('../data/config.json');
const { mainKeyboard, getMenuForLang, generalCommands, adminCommands } = require('./keyboardConfig');
let lastMassage;
module.exports = function (bot) {
    // Установка команд для пользователя и администратора
    bot.telegram.setMyCommands(generalCommands);
    bot.telegram.setMyCommands(adminCommands, { scope: { type: 'chat', chat_id: config.admin_id } });

    
    bot.start((ctx) => {
        //const userId = ctx.from.id;
        //const userName = ctx.from.first_name;
        dbHandlers.userCheckReg(ctx.from.id, (err, userExists, userLang) => {
            if (err) {
                console.error(err);
                ctx.reply('Произошла ошибка при проверке вашего профиля.');
                return;
            }
            if (!userExists) {
                // Пользователь не зарегистрирован, предлагаем выбрать язык
                ctx.reply('Пожалуйста, выберите ваш язык / Please, choose your language:', Markup.inlineKeyboard([
                    Markup.button.callback('Русский 🇷🇺', 'create_user_ru'),
                    Markup.button.callback('English 🇬🇧', 'create_user_en')
                ]));
            } else {
                dbHandlers.getUserLanguage(ctx.from.id, (err, userLang) => {
                    if (err) {
                        console.error(err);
                        ctx.reply('Произошла ошибка при проверке языка вашего профиля.');
                        return;
                    }
                    if (userLang) {
                        // Язык пользователя найден, отображаем меню в зависимости от языка
                        const isAdmin = ctx.from.id.toString() === config.admin_id; // Или ваша логика определения админа
                        ctx.reply(`Добро пожаловать обратно ${ctx.from.first_name}!`, getMenuForLang(userLang, isAdmin));
                    }
                });  
            }
        });
    });
    

    
    
      bot.hears(/🏠 Главное меню|🏠 Main page/, (ctx) => {
        const isAdmin = ctx.from.id.toString() === config.admin_id; // Или ваша логика определения админа
        const keyboardMain = mainKeyboard(isAdmin); // mainKeyboard - функция, возвращающая клавиатуру
        ctx.reply('Вы в главном меню:', keyboardMain);
    });
    
    // Обработка команды "Профиль"
    bot.hears(/👤 Профиль|👤 Profile/, async (ctx) => {
        // Предположим, что у вас есть функция, которая возвращает данные пользователя по его ID
        dbHandlers.getUserProfile(ctx.from.id, (err, userProfile) => {
          if (err) {
            ctx.reply('Произошла ошибка при получении профиля.');
            console.error(err);
            return;
          }
          let profileMessage;
          let profileKeyboard;
          // Составление сообщения профиля
          if(userProfile.lang == "ru"){
          profileMessage = `*Привет* ${userProfile.name}\n`;
          profileMessage += "💰 *Баланс:* `"+userProfile.balance.toFixed(2)+"`*$*\n";
          profileMessage += `🔄 *Рефералов:* ${userProfile.referrals}\n`;
          profileMessage += `🎁 *Накопительная скидка:* ${userProfile.discountPercent}*%*\n`;
          profileMessage += `📅 *Регистрация:* ${userProfile.registrationDate}\n`;
          profileMessage += "🆔 *ID:* `"+ctx.from.id+"`\n";
          profileMessage += `🌐 *Язык:* ${userProfile.lang}\n`;
        }else{      
          profileMessage = `*Hello* ${userProfile.name}\n`;
          profileMessage += "💰 *Balance:* `"+userProfile.balance.toFixed(2)+"`*$*\n";
          profileMessage += `🔄 *Referals:* ${userProfile.referrals}\n`;
          profileMessage += `🎁 *Discount:* ${userProfile.discountPercent}*%*\n`;
          profileMessage += `📅 *Registration:* ${userProfile.registrationDate}\n`;
          profileMessage += "🆔 *ID:* `"+ctx.from.id+"`\n";
          profileMessage += `🌐 *Lang:* ${userProfile.lang}\n`;
        }  
          
          if(userProfile.lang == "ru"){
            profileKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💵 Пополнить баланс', 'replenish_balance'), Markup.button.callback('👥 Реферальная система', 'referral_system')],
            [Markup.button.callback('🔧 Техническая поддержка', 'tech_support'), Markup.button.callback('💸 Вывести средства', 'withdraw_funds')],
            [Markup.button.callback('🛍 Мои покупки', 'my_purchases'), Markup.button.callback('🌐 Смена языка', 'set_lang_en')]
          ]);}else{
            profileKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💵 Add funds', 'replenish_balance'), Markup.button.callback('👥 Referal system', 'referral_system')],
            [Markup.button.callback('🔧 Technical support', 'tech_support'), Markup.button.callback('💸 Withdrawal funds', 'withdraw_funds')],
            [Markup.button.callback('🛍 My pursharge', 'my_purchases'), Markup.button.callback('🌐 Change lang', 'set_lang_ru')]
          ]);
        }
          // Отправка сообщения профиля пользователю
          ctx.replyWithMarkdown(profileMessage, profileKeyboard).then(sentMessage => {
            // Получаем ID отправленного сообщения
            const lastMessageId = sentMessage.message_id;
            // Получаем ID пользователя (или чата, в зависимости от контекста)
            const userId = ctx.from.id;
        
            // Вызываем функцию setLastMessageBot, чтобы обновить lastMessageBot в базе данных для данного пользователя
            dbHandlers.setLastMessageBot(userId, lastMessageId, (err) => {
                if (err) {
                    console.error("Ошибка при сохранении ID последнего сообщения:", err);
                } else {
                    console.log(`ID последнего сообщения ${lastMessageId} успешно сохранен для пользователя ${userId}.`);
                }
            });
        }).catch(error => {
            console.error("Ошибка при отправке сообщения:", error);
        });
        });
      });
      bot.action('replenish_balance', (ctx) => {
        // Логика пополнения баланса
        ctx.answerCbQuery(); // Отвечаем на callback запрос
        ctx.reply('Функция пополнения баланса в разработке.');
      });

      
    // Действие при нажатии на кнопку "Магазин"
    bot.hears(/🛍 Магазин|🛍 Shop/, (ctx) => {
        dbHandlers.getUserProfile(ctx.from.id, (err, userProfile) => {
        dbHandlers.getAllButtons((err, rows) => {
            if (err) {
                ctx.reply('Произошла ошибка при загрузке кнопок.');
                console.error(err);
                return;
            }
            let buttonsDB;
            let keyboardDB;
            // Создание клавиатуры из загруженных кнопок
            if(userProfile.lang == 'ru'){
            buttonsDB = rows.map(row => Markup.button.text(row.title));
            buttonsDB.push(Markup.button.text('🏠 Главное меню'));
            keyboardDB = Markup.keyboard(buttonsDB, { columns: 2 }).resize();
        }else{
            // Создание клавиатуры из загруженных кнопок
            buttonsDB = rows.map(row => Markup.button.text(row.title));
            buttonsDB.push(Markup.button.text('🏠 Main page'));
            keyboardDB = Markup.keyboard(buttonsDB, { columns: 2 }).resize();
        }
            ctx.reply('Выберите категорию:', keyboardDB);
        });
      });
    });


  
  // Действие при нажатии на кнопку "Поддержка"
  bot.hears('🆘 Поддержка', (ctx) => {
    ctx.reply('Как мы можем помочь вам сегодня?');
    // Здесь можно добавить логику для предоставления помощи пользователю или контактных данных поддержки
  });
  
  // Действие при нажатии на кнопку "FAQ"
  bot.hears('❓ FAQ', (ctx) => {
    ctx.reply('Часто задаваемые вопросы:');
    // Здесь можно добавить логику для отображения FAQ
  });
  
  // Действие при нажатии на кнопку "Управление товарами" (только для администратора)
  bot.hears('🛠 Управление товарами', (ctx) => {
    if (ctx.from.id.toString() === config.admin_id) {
      ctx.reply('Функции управления товарами:');
      // Здесь можно добавить логику для управления товарами
    } else {
      ctx.reply('У вас нет доступа к этой функции.');
    }
  });
  
  // Действие при нажатии на кнопку "Настройки"
  bot.hears('⚙️ Настройки', (ctx) => {
    ctx.reply('Настройки системы:');
    // Здесь можно добавить логику для изменения настроек системы или бота
  });
  
  // Действие при нажатии на кнопку "Общие функции"
  bot.hears('🌐 Общие функции', (ctx) => {
    ctx.reply('Общедоступные функции:');
    // Здесь можно добавить логику для выполнения общих функций
  });
  
  // Действие при нажатии на кнопку "Статистика" (только для администратора)
  bot.hears('📊 Статистика', (ctx) => {
    if (ctx.from.id.toString() === config.admin_id) {
      ctx.reply('Статистика магазина:');
      // Здесь можно добавить логику для отображения статистики магазина
    } else {
      ctx.reply('У вас нет доступа к этой функции.');
    }
  });
  
  // Действие при нажатии на кнопку "Платежные системы"
  bot.hears('💳 Платежные системы', (ctx) => {
    ctx.reply('Информация о платежных системах:');
    // Здесь можно добавить логику для информации о платежных системах, используемых в магазине
  });

  // Добавьте здесь дополнительные обработчики команд и действий
};
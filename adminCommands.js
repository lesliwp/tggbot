const { Markup } = require('telegraf');
const dbHandlers = require('./dbHandlers');
const config = require('../data/config.json');
const { mainKeyboard, getMenuForLang, generalCommands, adminCommands } = require('./keyboardConfig');

module.exports = function (bot) {
// Команда для добавления кнопки
bot.command('addbutton', (ctx) => {
    ctx.session.isAddingButton = true;
    ctx.reply('Введите название кнопки:');
});
// Обработка текста для добавления кнопки
bot.on('text', (ctx) => {
    if (ctx.session.isAddingButton) {
        const title = ctx.message.text;
        const command = title.toLowerCase().replace(/\s+/g, '_');

        dbHandlers.addNewButton(title, command, (err) => {
            if (err) {
                ctx.reply('Произошла ошибка при добавлении кнопки.');
                console.error(err);
            } else {
                ctx.reply('Кнопка добавлена.');
            }
        });

        ctx.session.isAddingButton = false;
    }
});

// Команда для удаления кнопки
bot.command('deletebutton', (ctx) => {
    dbHandlers.getAllButtons((err, rows) => {
        if (err) {
            ctx.reply('Произошла ошибка при загрузке кнопок.');
            console.error(err);
            return;
        }

        if (rows.length === 0) {
            ctx.reply('Кнопок для удаления нет.');
            return;
        }

        const buttonsDB = rows.map(row => Markup.button.callback(row.title, `delete_${row.title}`));
        const keyboardDB = Markup.inlineKeyboard(buttonsDB);
        ctx.reply('Выберите кнопку для удаления:', keyboardDB);
    });
});

// Обработка действий для удаления кнопки
bot.action(/delete_(.+)/, (ctx) => {
    const titleToDelete = ctx.match[1];

    if (titleToDelete === '🏠 Главное меню') {
        ctx.reply('Нельзя удалить кнопку "Главное меню".');
        return;
    }

    dbHandlers.deleteButton(titleToDelete, (err) => {
        if (err) {
            ctx.reply('Произошла ошибка при удалении кнопки.');
            console.error(err);
        } else {
            ctx.reply(`Кнопка "${titleToDelete}" была удалена.`);
        }
    });
});


// bot.action('set_lang_ru', (ctx) => {
//     const userId = ctx.from.id;
//     const userName = ctx.from.first_name;
//     // Зарегистрируйте пользователя с выбранным языком 'ru'
//     dbHandlers.setUserLanguage(userId, 'ru', (err) => {
//         if (err) {
//             ctx.reply('Произошла ошибка при регистрации.');
//             return;
//         }

//         dbHandlers.getUserProfile(userId, (err, userProfile) => {
//             if (err) {
//                 ctx.reply('Failed to retrieve user profile.');
//                 return;
//             }

//         let profileMessage = `*Привет* ${userProfile.name}\n`;
//         profileMessage += "💰 *Баланс:* `"+userProfile.balance.toFixed(2)+"`*$*\n";
//         profileMessage += `🔄 *Рефералов:* ${userProfile.referrals}\n`;
//         profileMessage += `🎁 *Накопительная скидка:* ${userProfile.discountPercent}*%*\n`;
//         profileMessage += `📅 *Регистрация:* ${userProfile.registrationDate}\n`;
//         profileMessage += "🆔 *ID:* `"+ctx.from.id+"`\n";
//         profileMessage += `🌐 *Язык:* ${userProfile.lang}\n`;
//         const profileKeyboard = Markup.inlineKeyboard([
//             [Markup.button.callback('💵 Пополнить баланс', 'replenish_balance'), Markup.button.callback('👥 Реферальная система', 'referral_system')],
//             [Markup.button.callback('🔧 Техническая поддержка', 'tech_support'), Markup.button.callback('💸 Вывести средства', 'withdraw_funds')],
//             [Markup.button.callback('🛍 Мои покупки', 'my_purchases'), Markup.button.callback('🌐 Смена языка', 'set_lang_en')]
//           ]);
//         ctx.replyWithMarkdown(profileMessage, profileKeyboard);
//     });
//   });
// });

bot.action('set_lang_ru', (ctx) => {
    const userId = ctx.from.id;

    // Зарегистрируйте пользователя с выбранным языком 'ru'
    dbHandlers.setUserLanguage(userId, 'ru', (err) => {
        if (err) {
            ctx.reply('Произошла ошибка при регистрации.');
            return;
        }

        // Получаем профиль пользователя
        dbHandlers.getUserProfile(userId, (err, userProfile) => {
            if (err) {
                ctx.reply('Failed to retrieve user profile.');
                return;
            }


                let profileMessage = `*Привет* ${userProfile.name}\n`;
                profileMessage += "💰 *Баланс:* `" + userProfile.balance.toFixed(2) + "`*$*\n";
                profileMessage += `🔄 *Рефералов:* ${userProfile.referrals}\n`;
                profileMessage += `🎁 *Накопительная скидка:* ${userProfile.discountPercent}*%*\n`;
                profileMessage += `📅 *Регистрация:* ${userProfile.registrationDate}\n`;
                profileMessage += "🆔 *ID:* `" + userId + "`\n";
                profileMessage += `🌐 *Язык:* ${userProfile.lang}\n`;
                const profileKeyboard = Markup.inlineKeyboard([
                    [Markup.button.callback('💵 Пополнить баланс', 'replenish_balance'), Markup.button.callback('👥 Реферальная система', 'referral_system')],
                    [Markup.button.callback('🔧 Техническая поддержка', 'tech_support'), Markup.button.callback('💸 Вывести средства', 'withdraw_funds')],
                    [Markup.button.callback('🛍 Мои покупки', 'my_purchases'), Markup.button.callback('🌐 Смена языка', 'set_lang_en')]
                ]);
                const isAdmin = ctx.from.id.toString() === config.admin_id; // Или ваша логика определения админа
                ctx.reply('Русский язык', getMenuForLang('ru', isAdmin))
                // Редактируем последнее сообщение пользователя
                ctx.editMessageText(profileMessage,{
                    parse_mode: 'Markdown',
                    reply_markup: profileKeyboard.reply_markup
                }).catch(error => {
                    // Если не удалось отредактировать (например, сообщение старое или уже было отредактировано), отправляем новое
                    ctx.replyWithMarkdown(profileMessage, profileKeyboard);
                });
                
        });
    });
});

bot.action('set_lang_en', (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    
    // Сначала устанавливаем язык пользователя
    dbHandlers.setUserLanguage(userId, 'en', (err) => {
        if (err) {
            ctx.reply('An error occurred during registration.');
            return;
        }
        
        // Затем получаем обновленный профиль пользователя
        dbHandlers.getUserProfile(userId, (err, userProfile) => {
            if (err) {
                ctx.reply('Failed to retrieve user profile.');
                return;
            }
            
            let profileMessage = `*Hello* ${userProfile.name}\n`;
            profileMessage += "💰 *Balance:* `"+userProfile.balance.toFixed(2)+"`*$*\n";
            profileMessage += `🔄 *Refferals:* ${userProfile.referrals}\n`;
            profileMessage += `🎁 *Discount:* ${userProfile.discountPercent}*%*\n`;
            profileMessage += `📅 *Registration:* ${userProfile.registrationDate}\n`;
            profileMessage += "🆔 *ID:* `"+ctx.from.id+"`\n";
            profileMessage += `🌐 *Lang:* ${userProfile.lang}\n`;

            const profileKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('💵 Add funds', 'replenish_balance'), Markup.button.callback('👥 Referral system', 'referral_system')],
                [Markup.button.callback('🔧 Technical support', 'tech_support'), Markup.button.callback('💸 Withdrawal funds', 'withdraw_funds')],
                [Markup.button.callback('🛍 My purchases', 'my_purchases'), Markup.button.callback('🌐 Change lang', 'set_lang_ru')]
            ]);
                const isAdmin = ctx.from.id.toString() === config.admin_id; // Или ваша логика определения админа
                ctx.reply('Eng lang', getMenuForLang('en', isAdmin))
                // Редактируем последнее сообщение пользователя
                ctx.editMessageText(profileMessage,{
                    parse_mode: 'Markdown',
                    reply_markup: profileKeyboard.reply_markup
                }).catch(error => {
                    // Если не удалось отредактировать (например, сообщение старое или уже было отредактировано), отправляем новое
                    ctx.replyWithMarkdown(profileMessage, profileKeyboard);
                });
                
        });
    });
});

bot.action('create_user_ru', (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    // Зарегистрируйте пользователя с выбранным языком 'ru'
    dbHandlers.createUser(userId, userName, 'ru', (err) => {
        if (err) {
            ctx.reply('Произошла ошибка при регистрации.');
            return;
        }
        ctx.reply('Язык установлен на Русский. Добро пожаловать!');
        ctx.reply('Выберите действие:', getMenuForLang('ru', false));
    });
});

bot.action('create_user_en', (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    // Зарегистрируйте пользователя с выбранным языком 'en'
    dbHandlers.createUser(userId, userName, 'en', (err) => {
        if (err) {
            ctx.reply('An error occurred during registration.');
            return;
        }
        ctx.reply('Language is set to English. Welcome!');
        ctx.reply('Выберите действие:', getMenuForLang('en', false));
    });
});

}; // module export
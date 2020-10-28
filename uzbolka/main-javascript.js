const { readFileSync } = require('fs')

const Telegraf = require('telegraf')
const session = require('telegraf/session')

const TelegrafInlineMenu = require('../dist/source')

const menu = new TelegrafInlineMenu('Главное Меню')

const messages = require('./helpers/messages')
const designs = require('./data/designs')
const options = require('./helpers/options')

let chosen_design_message_id;
let user_id;
let user_first_name;
let user_last_name;
let user_session_data_time;
let user_callback_data;
let expected_callback_data;

const ZAKAZI_CHAT_ID = '-1001362009955'

const createYourOwnDesignMenu = new TelegrafInlineMenu(messages.MENU.CONTEXT.CREATE_YOUR_OWN)
const chooseReadyDesignMenu = new TelegrafInlineMenu(messages.MENU.CONTEXT.CHOOSE_READY_DESIGN)

menu.submenu(messages.MENU.CHOOSE_READY_DESIGN, messages.MENU.ACTIONS.READY_DESIGN, chooseReadyDesignMenu, createYourOwnDesignMenu, {
})

menu.submenu(messages.MENU.CREATE_YOUR_OWN, messages.MENU.ACTIONS.YOUR_OWN, createYourOwnDesignMenu, createYourOwnDesignMenu, {
    // hide: () => mainMenuToggle
})

createYourOwnDesignMenu.urlButton(messages.BUTTONS.CREATE_YOUR_OWN_URL_NAME, 'https://www.customink.com/ndx/#/')

const shirtNames = { "👕&📐": {} }
const size = ['XS', 'S', 'M', 'L', 'XL']
const color = ['⚫️Черный', '⚪️Белый', '🔴Красный', '🔵Синий', '😶Жёлтый']

function shirtInfoText(_ctx, key) {
    const entry = shirtNames[key]
    if (entry && entry.size && !entry.color) {
        return `${key} (${entry.size})`
    } else if (entry && entry.color && !entry.size) {
        return `${key} (${entry.color})`
    } else if (entry && entry.color && entry.size) {
        return `${key} (${entry.size}' ${entry.color})`
    }
    return key
}

var contactKeyboardButtons = {
    "parse_mode": "Markup",
    "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [[{
            text: "Поделится контактом",
            request_contact: true
        }],
        [{
            text:"Поделится адресом",
            request_location: true
        }]]
    }
};


function shirtSelectText(ctx) {
    const shirtName = ctx.match[1]
    const chosenSize = shirtNames[shirtName].size
    const chosenColor = shirtNames[shirtName].color
    if (!chosenSize && chosenColor) {
        return `Выбран ${chosenColor} цвет, теперь выберите размер`
    } else if (!chosenColor && chosenSize) {
        return `Выбран ${chosenSize}' размер, теперь выберите цвет`
    } else if (!chosenColor && !chosenSize) {
        return `Выбрать цвет и размер футболки`
    }
    return `Выбран ${chosenColor} цвет и ${chosenSize}' размер`
}

const shirtSelectSubMenu = new TelegrafInlineMenu(shirtSelectText)
    .toggle('Длинный Рукав Футболки', 'long-sleve', {
        setFunc: (ctx, choice) => {
            const shirtName = ctx.match[1]
            shirtNames[shirtName].tShirt = choice
        },
        isSetFunc: ctx => {
            const shirtName = ctx.match[1]
            return shirtNames[shirtName].tShirt === true
        }
    })
    .select('s', size, {
        setFunc: (ctx, key) => {
            const shirtName = ctx.match[1]
            shirtNames[shirtName].size = key
        },
        isSetFunc: (ctx, key) => {
            const shirtName = ctx.match[1]
            return shirtNames[shirtName].size === key
        }
    })
    .select('c', color, {
        setFunc: (ctx, key) => {
            const shirtName = ctx.match[1]
            shirtNames[shirtName].color = key
        },
        isSetFunc: (ctx, key) => {
            const shirtName = ctx.match[1]
            return shirtNames[shirtName].color === key
        }
    })

/** PHOTO MENU */
const designKeys = designs.TEXT_DESIGNS
let globalKey = 'Welcome To America'

const pic = {
    photo: () => designKeys[globalKey]
}

let customerAddress = '';
let customerLocation = '';
let customerGivenAddress = '';

const findCustomerInputAddress = (ctx) => {
    if(customerAddress) {
        return ctx.telegram.sendMessage(ZAKAZI_CHAT_ID, `Адрес: ${customerAddress}`);
    } else if (customerLocation){
        return ctx.telegram.sendLocation(ZAKAZI_CHAT_ID, customerLocation.latitude, customerLocation.longitude);
    }
    else {
        return ctx.telegram.sendMessage(ZAKAZI_CHAT_ID, `Адрес не указан или указан не правильно. ${customerGivenAddress}`);
    }
}

chooseReadyDesignMenu
    .submenu(designs.NAMES.TEXT_DESIGNS, designs.NAMES.ACTIONS.TEXT_DESIGNS, new TelegrafInlineMenu(messages.MENU.CONTEXT.CHOOSE_DESIGN, pic), contactKeyboardButtons)
    .select('img', Object.keys(designKeys), {
        isSetFunc: (_ctx, key) => {
            return key === _ctx.match[1]
        },
        setFunc: (_ctx, key) => {
            globalKey = key
            chosen_design_message_id = designKeys[globalKey]
        },
        columns: 1,
        maxRows: 12 // allow to display 12 designs per subMenu
    })
    .submenu(messages.BUTTONS.MAKE_PURCHASE, messages.BUTTONS.ACTIONS.MAKE_PURCHASE, new TelegrafInlineMenu(messages.MENU.CONTEXT.SHOW_CHOSEN_DESIGN, pic), {
        textFunc: shirtInfoText
    })
    .selectSubmenu('j', () => Object.keys(shirtNames), shirtSelectSubMenu, {
        textFunc: shirtInfoText,
        columns: 2
    })
    .simpleButton('Добавить адресс', messages.BUTTONS.ACTIONS.ADD_ADDRESS, {
        doFunc: async ctx => {
            // TODO: new menu for address and add question here.
            ctx.answerCbQuery(messages.CALLBACK_ANSWERS.ADD_ADDRESS, true);
        }
    })
    .simpleButton(messages.BUTTONS.COMPLETE_ORDER, messages.BUTTONS.ACTIONS.COMPLETE_ORDER, {
        doFunc: async ctx => {
            if(customerAddress || customerLocation) {
                ctx.telegram.sendMessage(ZAKAZI_CHAT_ID, `Имя заказчика: ${ctx.update.callback_query.from.first_name} ${ctx.update.callback_query.from.last_name}, айди: ${ctx.update.callback_query.from.id}`)
                ctx.forwardMessage(ZAKAZI_CHAT_ID, ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id),
                findCustomerInputAddress(ctx),
                chosen_design_message_id ? ctx.telegram.sendPhoto(ZAKAZI_CHAT_ID, chosen_design_message_id) : ctx.answerCbQuery('Вы не выбрали дизайн.'),
                ctx.reply(`🎊Ваш заказ выполнен🎊\nВсе указанные данные отправлены в Узболка.\nВаш заказ будет доставлен в течении 2-3 дней по указанному адресу.\n\n${customerAddress}\n📞Если у вас возникли вопросы, вы можете связатся с нами по телефону +99891-434-6975.\nУзболка благодарит вас за покупку.`)
            }
            else {
                ctx.answerCbQuery('Cперва укажите свой адрес.');
            }
        }
    })
    
// chooseReadyDesignMenu.question('Добавить еще футболку', 'add', {
//     uniqueIdentifier: '666',
//     questionText: 'Как назовёте футболку?',
//     setFunc: (_ctx, key) => {
//         shirtNames[key] = {}
//     }
// })

/** ************** CUSTOM DESIGN MENU ************** */

let uploaded_file_object = { "Вид спереди": "", "Вид сзади": "", "Рукоятки": ""}
let selected_button = ''

createYourOwnDesignMenu.submenu(messages.MENU.UPLOAD_DESIGN, 
    messages.MENU.ACTIONS.UPLOAD_DESIGN, 
    new TelegrafInlineMenu(messages.MENU.CONTEXT.UPLOAD_DESIGN))
    .select(messages.MENU.ACTIONS.UPLOAD_DESIGN, Object.keys(uploaded_file_object), {
        isSetFunc: (_ctx, key) => {
            if(uploaded_file_object[_ctx.match[1]] === "") {
                if(_ctx.match[1] === Object.keys(uploaded_file_object)[0]) {
                    _ctx.answerCbQuery(messages.CALLBACK_ANSWERS.UPLOAD_FRONT_DESIGN)
                    console.log(`EXPECTED CALLBACK DATA ${_ctx.callbackQuery.data}`)
                    selected_button = _ctx.match[1]
                    return key === _ctx.match[1]
                } else if(_ctx.match[1] === Object.keys(uploaded_file_object)[1]) {
                    _ctx.answerCbQuery(messages.CALLBACK_ANSWERS.UPLOAD_BACK_DESIGN)
                    selected_button = _ctx.match[1]
                    console.log(`SECOND EXPECTED CALLBACK DATA ${_ctx.callbackQuery.data}`)
                    return key === _ctx.match[1]
                } else if(_ctx.match[1] === Object.keys(uploaded_file_object)[2]) {
                    _ctx.answerCbQuery(messages.CALLBACK_ANSWERS.UPLOAD_SLEEVES_DESIGN)
                    selected_button = _ctx.match[1]
                    console.log(`THIRD EXPECTED CALLBACK DATA ${_ctx.callbackQuery.data}`)
                    return key === _ctx.match[1]
                }
            }
        },
        setFunc: (_ctx, key) => {
            console.log(`DATA ${_ctx.match[1]}`)
            // selected_button = _ctx.callbackQuery.data
            if(uploaded_file_object[_ctx.match[1]] === "") {
                if(_ctx.match[1] === Object.keys(uploaded_file_object)[0]) {
                    _ctx.answerCbQuery(messages.CALLBACK_ANSWERS.UPLOAD_FRONT_DESIGN)
                    selected_button = _ctx.match[1]
                } else if(_ctx.match[1] === Object.keys(uploaded_file_object)[1]) {
                    _ctx.answerCbQuery(messages.CALLBACK_ANSWERS.UPLOAD_BACK_DESIGN)
                    selected_button = _ctx.match[1]
                } else if(_ctx.match[1] === Object.keys(uploaded_file_object)[2]) {
                    selected_button = _ctx.match[1]
                    _ctx.answerCbQuery(messages.CALLBACK_ANSWERS.UPLOAD_SLEEVES_DESIGN)
                }
            }
        }
    })

const token = readFileSync('token.txt', 'utf8').trim()
const bot = new Telegraf(token)

/** PHOTO MENU */
let customer_data = require(`./data/customers_data/object.json`)
// const fs = require("fs");
let error_handler = {};

let photo_file_id
bot.on('photo', (ctx) => {
    photo_file_id = ctx.message.photo[0].file_id
    uploaded_file_object[selected_button] = photo_file_id
    //     console.log(`UPLOADED JSON ${JSON.stringify(uploaded_file_object)}`)
    //     fs.writeFile("./uzbolka/data/customers_data/object.json", JSON.stringify(uploaded_file_object), 'utf-8', (err) => {
    //         if (err) {
    //             console.error(`THIS ERROR ${err}`);
    //             return;
    //         };
    //         console.log("File has been created");
    //     });
    //     i++
    //     console.log(`I VALUES : ${i.toString()} FILE ID: ${photo_file_id}`)
    //     console.log(`File ID ${uploaded_file_object[i.toString()]} \n and keys ${Object.keys(uploaded_file_object)}`)
})


// append uploaded designs
let globalKeyForUploaded = options.UPLOADED_DESIGNS.FRONT

const uploadedPhoto = {
    photo: () => uploaded_file_object[globalKeyForUploaded]
}

createYourOwnDesignMenu
    .submenu(messages.MENU.UPLOADED_DESIGNS, messages.MENU.ACTIONS.UPLOADED_DESIGNS, new TelegrafInlineMenu('', uploadedPhoto), contactKeyboardButtons)
    .select(messages.MENU.ACTIONS.CHOOSE_UPLOADED_DESIGNS, Object.keys(uploaded_file_object), {
        isSetFunc: (_ctx, key) => {
            if(_ctx.match[1] === Object.keys(uploaded_file_object)[0]) {
                _ctx.answerCbQuery(messages.CALLBACK_ANSWERS.UPLOAD_FRONT_DESIGN)
                
                return 
            }
            else if((_ctx.match[1] === Object.keys(uploaded_file_object)[1]  && uploaded_file_object[_ctx.match[1]] === "") ||
                (_ctx.match[1] === Object.keys(uploaded_file_object)[2]  && uploaded_file_object[_ctx.match[1]] === "")) 
                {
                _ctx.answerCbQuery(`${key} ${messages.CALLBACK_ANSWERS.PIC_IS_NOT_UPLOADED_YET}`)
                return key === options.UPLOADED_DESIGNS.FRONT
            }
            else 
                return key === _ctx.match[1]
        },
        setFunc: (_ctx, key) => {
            if(
                (_ctx.match[1] === Object.keys(uploaded_file_object)[1]  && uploaded_file_object[_ctx.match[1]] === "") ||
                (_ctx.match[1] === Object.keys(uploaded_file_object)[2]  && uploaded_file_object[_ctx.match[1]] === "")
                ) {
                    _ctx.answerCbQuery(`${key} ${messages.CALLBACK_ANSWERS.PIC_IS_NOT_UPLOADED_YET}`)
                    globalKeyForUploaded === options.UPLOADED_DESIGNS.FRONT
            }
            else {
                globalKeyForUploaded = key
            }
        },
        joinLastrow: true,
        columns: 3
    })
    .submenu(messages.BUTTONS.MAKE_PURCHASE, 'self', new TelegrafInlineMenu(messages.MENU.CONTEXT.SHOW_CHOSEN_DESIGN, uploadedPhoto), {
        textFunc: shirtInfoText
    })
    .selectSubmenu('sh', () => Object.keys(shirtNames), shirtSelectSubMenu, {
        textFunc: shirtInfoText,
        columns: 2
    })
    .button('🏁Завершить заказ личного дизайна ✔️', 'sold', {
        doFunc: async ctx => {
            if(customerAddress || customerLocation) {
                ctx.telegram.sendMessage(ZAKAZI_CHAT_ID, `Имя заказчика: ${ctx.update.callback_query.from.first_name} ${ctx.update.callback_query.from.last_name}, айди: ${ctx.update.callback_query.from.id}`)
                ctx.forwardMessage(ZAKAZI_CHAT_ID, ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id),
                findCustomerInputAddress(ctx),

                uploaded_file_object[options.UPLOADED_DESIGNS.FRONT] !== "" ? 
                ctx.telegram.sendPhoto(ZAKAZI_CHAT_ID, uploaded_file_object[options.UPLOADED_DESIGNS.FRONT]) :
                console.log(`NOT UPLOADED ${options.UPLOADED_DESIGNS.FRONT}`),

                uploaded_file_object[options.UPLOADED_DESIGNS.BACK] !== "" ? 
                ctx.telegram.sendPhoto(ZAKAZI_CHAT_ID, uploaded_file_object[options.UPLOADED_DESIGNS.BACK]) :
                console.log(`NOT UPLOADED ${options.UPLOADED_DESIGNS.BACK}`),

                uploaded_file_object[options.UPLOADED_DESIGNS.SLEEVES] !== "" ? 
                ctx.telegram.sendPhoto(ZAKAZI_CHAT_ID, uploaded_file_object[options.UPLOADED_DESIGNS.SLEEVES]) :
                console.log(`NOT UPLOADED ${options.UPLOADED_DESIGNS.SLEEVES}`),

                chosen_design_message_id ? ctx.telegram.sendPhoto(ZAKAZI_CHAT_ID, chosen_design_message_id) : ctx.answerCbQuery('Вы не выбрали дизайн.'),
                ctx.reply(`🎊Ваш заказ выполнен🎊\nВсе указанные данные отправлены в Узболка.\nВаш заказ будет доставлен в течении 2-3 дней по указанному адресу.\n\n${customerAddress}\n📞Если у вас возникли вопросы, вы можете связатся с нами по телефону +99891-434-6975.\nУзболка благодарит вас за покупку.`)
            }
            else {
                ctx.answerCbQuery('Cперва укажите свой адрес.');
            }
        }
    })

menu.setCommand('start')

bot.use(session())

bot.use((ctx, next) => {
    if (ctx.callbackQuery) {
        user_id = ctx.callbackQuery.from.user_id
        user_first_name = ctx.callbackQuery.from.first_name
        user_last_name = ctx.callbackQuery.from.last_name
        user_callback_data = ctx.callbackQuery.data
        console.log(ctx.callbackQuery.from.first_name, ctx.callbackQuery.from.last_name, 'selected', ctx.callbackQuery.data)
    } 
    else if (ctx.message) {
        if(ctx.message.text && (
            ctx.message.text.startsWith('Адрес') || 
            ctx.message.text.startsWith('Adres') ||
            ctx.message.text.startsWith('Address') ||
            ctx.message.text.startsWith('адрес') ||
            ctx.message.text.startsWith('adres') ||
            ctx.message.text.startsWith('address') ||
            ctx.message.text.startsWith('АДРЕС') ||
            ctx.message.text.startsWith('ADRES')
        )) {
            customerAddress = ctx.message.text
            ctx.reply(`Адрес добавлен: ${customerAddress}. Теперь вы можете нажать\n"${messages.BUTTONS.COMPLETE_ORDER}"\n\n🗒Чтоб указать новый адрес, введите адрес снова со слова "Адрес".`)
        }
        else if (ctx.message.location) {
            customerLocation = ctx.message.location;
            ctx.reply(`Вы добавили адрес для доставки. Теперь вы можете нажать\n"${messages.BUTTONS.COMPLETE_ORDER}"\n\n🗒Если указали неверную геолокацию, то отправте его заново,\nили же напишите свой адрес вручную начав со слова "Адрес".`)
        }
    }
    return next()
})

bot.use(menu.init({
    backButtonText: '⬅️ назад…',
    mainMenuButtonText: '↩️в главное меню…'
}))

bot.catch(error => {
    error_handler = error.response
    console.log('telegraf error', error.response, error.parameters, error.on || error)
})

async function startup() {
    await bot.launch()
    console.log(new Date(), 'Bot started as', bot.options.username)
}

startup()
import {readFileSync} from 'fs'

import Telegraf from 'telegraf'

import TelegrafInlineMenu from '../source'

const session = require('telegraf/session')

const menu = new TelegrafInlineMenu('Главное Меню')

// let mainMenuToggle = false
// menu.toggle('👕Создать свою футболку👚', 'custom', {
//   setFunc: (_ctx, newVal) => {
//     mainMenuToggle = newVal
//   },
//   isSetFunc: () => mainMenuToggle
// })

const createYourOwnDesignMenu = new TelegrafInlineMenu('- Создайте свой дизайн на сайте.\n - Заскриншотьте дизайн.\n- Выложите его чтоб заказать')
const chooseReadyDesignMenu = new TelegrafInlineMenu('Найти готовый дизайн')

menu.submenu('👕Выбрать готовый дизайн.🖼', 'chooseReady', chooseReadyDesignMenu, {
  // hide: () => mainMenuToggle
})

menu.submenu('✍️Создать свой дизайн.📎', 'createYourOwn', createYourOwnDesignMenu, {
// hide: () => mainMenuToggle
})

interface plainShirtChoises {
  size?: string;
  color?: string;
  designId?: string;
}

// interface designChoises {
//   designId?: string;
//   designName?: string;
// }

// const designInfo: {[key: string]: designChoises} = {ChooseDesign: {}}
// const designNames = ['FirstDesign', 'SecondDesign', 'ThirdDesign', 'ForthDesign']
// const designUrls = [
//   'https://www.thefancydeal.com/wp-content/uploads/edd/2017/08/buy-t-shirt-design-bundle16.jpg', 
//   'https://cfmir.ru/wa-data/public/shop/products/17/77/27717/images/3878/3878.970.jpg',
//   'https://dress015.files.wordpress.com/2015/07/33.jpg']

const shirtInfo: {[key: string]: plainShirtChoises} = {AddToCart: {}}
const sizeNames = ['30', '34', '38', '42', '46']
const colorNames = ['⚫️Черный', '⚪️Белый', '🔴Красный', '🔵Синий', '😶Жёлтый']

// function designButtonText(_ctx: any, key: string): string {
//   const entry = designInfo[key] as designChoises | undefined
//   if(entry && entry.designId) {
//     return `${key} (${entry.designId})`
//   }
//   return key
// }

function shirtButtonText(_ctx: any, key: string): string {
  const entry = shirtInfo[key] as plainShirtChoises | undefined
  if(entry && entry.size) {
    return `${key} (${entry.size}' ${entry.color})`
  }
  return key
}

// function designSelectText(ctx: any): object {
//   const designId = ctx.match[1]
//   const designsName = designInfo[designId].designName
//   // if(!designsName)
//   //   return `Выберите дизайн ${designId}`
//   if(designsName === 'FirstDesign') 
//     return {
//       photo: () => designUrls[0]
//     }
//   else if(designsName === 'SecondDesign')
//     return {
//       photo: () => designUrls[1]
//     }
//   else if( designsName === 'ThirdDesign')
//     return {
//       photo: () => designUrls[2]
//     }
//   return { photo: () => designUrls[3] }
//   // return `Выбран дизайн ${designsName}`
// }

function shirtSelectText(ctx: any): string {
  const shirtName = ctx.match[1]
  const shirtsSize = shirtInfo[shirtName].size
  const shirtsColor = shirtInfo[shirtName].color
  if(!shirtsColor) 
    return `Выберите цвет для ${shirtName}`

  if(shirtsColor && !shirtsSize)
    return `Выберите размер для ${shirtName}`
 
  return `Выбран размер '${shirtsSize}' и цвет ${shirtsColor} для ${shirtName} футболки.`
}

const shirtSelectSubmenu = new TelegrafInlineMenu(shirtSelectText)
  .select('c', colorNames, {
    setFunc: (ctx: any, key) => {
      const buyer = ctx.match[1]
      shirtInfo[buyer].color = key
    },
    isSetFunc: (ctx: any, key) => {
      const buyer = ctx.match[1]
      return shirtInfo[buyer].color === key
    }
  })
  .select('s', sizeNames, {
    setFunc: (ctx: any, key) => {
      const buyer = ctx.match[1]
      shirtInfo[buyer].size = key
    },
    isSetFunc: (ctx: any, key) => {
      const buyer = ctx.match[1]
      return shirtInfo[buyer].size === key
    }
  })

createYourOwnDesignMenu.urlButton('Создать свой дизайн на сайте и заскриншотить', 'https://www.customink.com/ndx/#/')

// TODO: create upload button where user can upload his screenshoted designs

createYourOwnDesignMenu.simpleButton('Выложить свой дизайн или скриншот', 'upload_photo', {
  doFunc: async ctx => ctx.answerCbQuery('Function is not ready yet')
})

const values = ['Welcome To America', 'Husband promoted to Papa', 'Ti Kto Takoi', 'Davai Dosvidaniya']
const designKeys = {
  "Welcome To America": "https://www.thefancydeal.com/wp-content/uploads/edd/2017/08/buy-t-shirt-design-bundle16.jpg",
  "Husband promoted to Papa": "https://i.ebayimg.com/images/g/VvcAAOSw8IpcY7Ph/s-l1600.jpg",
  "Ti Kto Takoi": "https://dress015.files.wordpress.com/2015/07/33.jpg",
  "Davai Dosvidaniya": "https://cfmir.ru/wa-data/public/shop/products/17/77/27717/images/3878/3878.970.jpg"
}
let globalKey = "Welcome To America";
const gggg = 'Welcome To America'


const pic = {
  photo: () =>  designKeys[gggg]
  }

chooseReadyDesignMenu.submenu('Американские дизайны', 'americanDesign', new TelegrafInlineMenu('', pic))
  .setCommand('americanDesign')
  .select('img', values, {
    isSetFunc: (_ctx) =>
      true,
    setFunc: (_ctx, key) => {
        // designInfo[key] = key
        globalKey = key
        console.log(`THIS IS IMPORTANT: ${designKeys[gggg]}`)
        console.log(`THIS IS IMPORTANT: ${globalKey}  navu bo ichinda ${_ctx.match}\n KEY ${key}`)
    }
  })
  .selectSubmenu('b', () => Object.keys(shirtInfo), shirtSelectSubmenu, {
    textFunc: shirtButtonText,
    columns: 1
  })

let isSecondShirt = true
chooseReadyDesignMenu.submenu('Прикольные дизайны', 'funDesign', new TelegrafInlineMenu('', {
  photo: () => isSecondShirt ? 'https://dress015.files.wordpress.com/2015/07/33.jpg' 
    : 'https://cfmir.ru/wa-data/public/shop/products/17/77/27717/images/3878/3878.970.jpg'
  }))
  .setCommand('funDesign')
  .simpleButton('Добавить в корзину.', 'b', {
    doFunc: async ctx => ctx.answerCbQuery('Кнопка пока не работает (не готово)')
  })
  .select('img', values, {
    isSetFunc: (_ctx, key) => key === '1' ? isSecondShirt : !isSecondShirt,
    setFunc: (_ctx, key) => {
      isSecondShirt = key === '1'
    }
  })

menu.setCommand('start')

const token = readFileSync('token.txt', 'utf8').trim()
const bot = new Telegraf(token)
bot.use(session())

bot.use((ctx, next) => {
  if (ctx.callbackQuery && ctx.callbackQuery.data) {
    console.log(ctx.callbackQuery.from.first_name, ctx.callbackQuery.from.last_name, 'selected', ctx.callbackQuery.data)
  }

  return next && next()
})

bot.use(menu.init({
  backButtonText: '⬅️ назад…',
  mainMenuButtonText: '↩️ назад в главное меню…'
}))

bot.catch((error: any) => {
  console.log('telegraf error', error.response, error.parameters, error.on || error)
})

async function startup(): Promise<void> {
  await bot.launch()
  console.log(new Date(), 'Bot started as', bot.options.username)
}

startup()
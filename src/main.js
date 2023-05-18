import {Telegraf,session} from "telegraf";
import {message} from "telegraf/filters";
import config from "config"
import {ogg} from "./ogg.js"
import {openai} from "./openAI.js"
import {code} from "telegraf/format";
const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
const INITIAL_SESSION={
    messages:[],
}
bot.launch()
bot.use(session())
bot.command('new',async (ctx)=>{
    ctx.session=INITIAL_SESSION
    await ctx.reply('I`m waiting')
})
bot.command('start',async (ctx)=>{
    ctx.session=INITIAL_SESSION
    await ctx.reply('I`m waiting')
})
bot.on(message("voice"),async ctx=>{
    ctx.session??=INITIAL_SESSION
    try {
        await ctx.reply(code('Запрос прийнял, обработка'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href,userId)
        const mp3Path = await ogg.toMp3(oggPath,userId)
        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Ваш текст:${text}`))
        ctx.session.messages.push({role:'user',content:text})
        const response = await openai.chat(ctx.session.messages)
        ctx.session.messages.push({role:'assistant',content:response.content})
        await ctx.reply(response.content)
    }catch (e) {
        console.error("Error",e.message)
    }

})




process.once('SIGINT', ()=> bot.stop('SIGINT'))
process.once('SIGTERM', ()=> bot.stop('SIGTERM'))
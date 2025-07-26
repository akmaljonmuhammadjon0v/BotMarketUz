const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const channelId = process.env.Channel_Id;

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
	{ command: '/start', description: 'Botni ishga tushirish' },
	{ command: '/about', description: 'Bu bot haqida ma’lumot' },
]);

const userSteps = {};

const sellerQuestions = [
	{ text: '🔒 Botni Username:', key: 'user' },
	{ text: '👥 A’zolar soni:', key: 'members' },
	{ text: '🔥 Aktiv:', key: 'active' },
	{ text: '💰 Narxi:', key: 'price' },
	{ text: '💳 To’lov turi:', key: 'payment' },
	{ text: '♻️ Obmen:', key: 'exchange' },
	{ text: '🧑‍💻 Sotuvchi:', key: 'seller' },
	{ text: '✅ Egalik:', key: 'ownership' },
	{ text: '☎️ Nomer:', key: 'phone' },
	{ text: '🤖 Qo’shimcha ma’lumot:', key: 'info' },
];

const buyerQuestions = [
	{ text: '🔒 User:', key: 'user' },
	{ text: '☎️ Nomer:', key: 'phone' },
	{ text: '💬 Izoh:', key: 'comment' },
];

function askNextQuestion(chatId) {
	const step = userSteps[chatId].step;
	const questions = userSteps[chatId].isSeller
		? sellerQuestions
		: buyerQuestions;

	if (step < questions.length) {
		const question = questions[step];
		bot.sendMessage(chatId, question.text, {
			reply_markup: { force_reply: true },
		});
		userSteps[chatId].step++;
	} else {
		finalizeData(chatId);
	}
}

function finalizeData(chatId) {
	const postData = userSteps[chatId].data;
	const isSeller = userSteps[chatId].isSeller;
	const messageTemplate = isSeller
		? `🤖 Bot sotiladi.

🔒 Botni username: ${postData.user}
👥 A’zolar soni: ${postData.members}
🔥 Aktiv: ${postData.active}
💰 Narxi: ${postData.price}
💳 To’lov turi: ${postData.payment}
♻️ Obmen: ${postData.exchange}
🧑‍💻 Sotuvchi: ${postData.seller}
✅ Egalik: ${postData.ownership}
☎️ Nomer: ${postData.phone}

❗Qo’shimcha ma’lumot❗
${postData.info}

E’lon berish uchun: @botlar_savdosibot
Kanal: @zakazchatbot416`
		: `📌 Bot sotib olish.

🔒 Telegram Username: ${postData.user}
☎️ Nomer: ${postData.phone}
💬 Izoh: ${postData.comment}

E’lon berish uchun: @botlar_savdosibot
Kanal: @zakazchatbot416`;

	bot.sendMessage(
		chatId,
		'Ma’lumot 1 daqiqada @zakazchatbot416 kanaliga yetkaziladi ⌛'
	);

	setTimeout(() => {
		bot
			.sendMessage(channelId, messageTemplate)
			.then(() => {
				bot.sendMessage(chatId, 'Sizning xabaringiz kanalga yuborildi ✅');
				delete userSteps[chatId];
			})
			.catch(error => {
				console.error(error);
				bot.sendMessage(
					chatId,
					'Xabaringizni kanalga yuborishda xatolik yuz berdi. 😩'
				);
			});
	}, 60000);
}

bot.onText(/\/start/, msg => {
	const chatId = msg.chat.id;
	bot.sendMessage(
		chatId,
		`Assalomu alaykum, hurmatli ${msg.from.first_name}! Botimizga xush kelibsiz. Quyidagi tugmalardan birini tanlang:`,
		{
			reply_markup: {
				inline_keyboard: [
					[{ text: 'Botni Sotuvchi', callback_data: 'seller' }],
					[{ text: 'Botni Sotib oluvchi', callback_data: 'buyer' }],
				],
			},
		}
	);
});

bot.onText(/\/about/, msg => {
	const chatId = msg.chat.id;
	const text = `Bu bot orqali siz botlaringizni sotishingiz yoki sotib olishingiz mumkin. Botni savollariga javob berganingizdan so‘ng ma’lumotni avtomatik ravishda kanalga yuboradi.`;
	bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
});

bot.on('callback_query', callbackQuery => {
	const chatId = callbackQuery.message.chat.id;
	const action = callbackQuery.data;

	userSteps[chatId] = {
		step: 0,
		data: {},
		isSeller: action === 'seller',
	};

	askNextQuestion(chatId);
});

bot.on('message', msg => {
	const chatId = msg.chat.id;

	if (!userSteps[chatId] || msg.text === '/start') return;

	const step = userSteps[chatId].step - 1;
	const questions = userSteps[chatId].isSeller
		? sellerQuestions
		: buyerQuestions;

	if (step >= 0 && step < questions.length) {
		const key = questions[step].key;
		const input = msg.text.trim();

		if (!input) {
			bot.sendMessage(chatId, 'Iltimos, barcha ma’lumotlarni to‘ldiring❗');
			userSteps[chatId].step--;
		} else {
			userSteps[chatId].data[key] = input;
			askNextQuestion(chatId);
		}
	}
});

bot.on('polling_error', error => {
	console.error('Polling error:', error.code, error.message);
});

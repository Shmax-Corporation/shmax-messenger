let username = '';

// При загрузке страницы — проверяем, есть ли пользователь
window.onload = function () {
  const savedUser = localStorage.getItem('shmax_username');
  const savedMessages = JSON.parse(localStorage.getItem('shmax_messages') || '[]');

  if (savedUser) {
    username = savedUser;
    document.getElementById('currentUser').textContent = username;
    showChat();
    loadMessages(savedMessages);
  }
};

// Регистрация пользователя
function registerUser() {
  const input = document.getElementById('username');
  const name = input.value.trim();

  if (name === '') {
    alert('Введите имя!');
    return;
  }

  username = name;
  localStorage.setItem('shmax_username', name); // Сохраняем имя

  document.getElementById('currentUser').textContent = name;
  showChat();

  // Загружаем старые сообщения
  const savedMessages = JSON.parse(localStorage.getItem('shmax_messages') || '[]');
  loadMessages(savedMessages);
}

// Показать чат
function showChat() {
  document.getElementById('registerPage').classList.add('hidden');
  document.getElementById('chatPage').classList.remove('hidden');
}

// Загрузить сообщения в чат
function loadMessages(messages) {
  const container = document.getElementById('messages');
  container.innerHTML = ''; // Очистим перед загрузкой

  if (messages.length === 0) {
    const systemMsg = document.createElement('div');
    systemMsg.classList.add('message', 'system');
    systemMsg.textContent = 'История сообщений пуста. Напишите первым!';
    container.appendChild(systemMsg);
  } else {
    messages.forEach(msg => {
      addMessageToDOM(msg.text, msg.sender);
    });
  }
}

// Добавить сообщение в DOM
function addMessageToDOM(text, sender) {
  const container = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  if (sender === username) {
    messageElement.classList.add('own');
  } else if (sender === 'system' || sender === 'bot') {
    messageElement.classList.add('system');
  } else {
    messageElement.classList.add('other');
  }

  messageElement.textContent = text;
  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
}

// Отправка сообщения
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();

  if (text === '') return;

  // Сохраняем сообщение
  const messages = JSON.parse(localStorage.getItem('shmax_messages') || '[]');
  messages.push({ text, sender: username });

  // Ограничиваем историю 100 сообщениями (по желанию)
  if (messages.length > 100) {
    messages.shift();
  }

  localStorage.setItem('shmax_messages', JSON.stringify(messages));

  // Показываем в чате
  addMessageToDOM(text, username);

  // Очистить поле
  input.value = '';

  // Бот-ответ
  setTimeout(() => {
    const replyText = 'Я — бот. В реальном чате тут будет живой собеседник!';
    messages.push({ text: replyText, sender: 'bot' });
    localStorage.setItem('shmax_messages', JSON.stringify(messages));
    addMessageToDOM(replyText, 'bot');
  }, 600);
}

// Отправка по Enter
document.getElementById('messageInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
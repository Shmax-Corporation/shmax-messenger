// ЗАМЕНИ НИЖЕ НА СВОЙ КОНФИГ ИЗ FIREBASE!
const firebaseConfig = {
  apiKey: "AIzaSyCX_MwbmEQ-__rZJF7cIDjXh3W1FWWV0vY",
  authDomain: "shmax-messenger.firebaseapp.com",
  projectId: "shmax-messenger",
  storageBucket: "shmax-messenger.firebasestorage.app",
  messagingSenderId: "306454875402",
  appId: "1:306454875402:web:911de6702902a5351afef3",
  measurementId: "G-21HCVG44B5"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let username = '';

// При загрузке — проверяем имя
window.onload = function () {
  const savedUser = localStorage.getItem('shmax_username');
  if (savedUser) {
    username = savedUser;
    document.getElementById('currentUser').textContent = username;
    showChat();
    loadMessagesFromFirebase();
  }
};

function registerUser() {
  const input = document.getElementById('username');
  const name = input.value.trim();

  if (name === '') {
    alert('Введите имя!');
    return;
  }

  username = name;
  localStorage.setItem('shmax_username', name);
  document.getElementById('currentUser').textContent = name;
  showChat();
  loadMessagesFromFirebase();
}

function showChat() {
  document.getElementById('registerPage').classList.add('hidden');
  document.getElementById('chatPage').classList.remove('hidden');
}

// Загружаем сообщения из Firebase
function loadMessagesFromFirebase() {
  const messagesRef = database.ref('messages');
  const messagesContainer = document.getElementById('messages');

  messagesRef.off(); // очищаем предыдущие слушатели
  messagesContainer.innerHTML = '';

  messagesRef.on('child_added', (snapshot) => {
    const msg = snapshot.val();
    addMessageToDOM(msg.text, msg.sender);
  });
}

// Добавить сообщение в интерфейс
function addMessageToDOM(text, sender) {
  const container = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  if (sender === username) {
    messageElement.classList.add('own');
  } else if (sender === 'system') {
    messageElement.classList.add('system');
  } else {
    messageElement.classList.add('other');
  }

  messageElement.textContent = `${sender !== username && sender !== 'system' ? sender + ': ' : ''}${text}`;
  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
}

// Отправка сообщения в Firebase
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();

  if (text === '' || !username) return;

  const newMessageRef = database.ref('messages').push();
  newMessageRef.set({
    text: text,
    sender: username,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  input.value = '';
}

// Отправка по Enter
document.getElementById('messageInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
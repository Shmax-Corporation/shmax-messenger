// Firebase конфиг — ЗАМЕНИ НА СВОЙ!
const firebaseConfig = {
  apiKey: "AIzaSyCX_MwbmEQ-__rZJF7cIDjXh3W1FWWV0vY",
  authDomain: "shmax-messenger.firebaseapp.com",
  projectId: "shmax-messenger",
  storageBucket: "shmax-messenger.firebasestorage.app",
  messagingSenderId: "306454875402",
  appId: "1:306454875402:web:911de6702902a5351afef3",
  measurementId: "G-21HCVG44B5"
};

// Инициализация
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;

// При загрузке страницы — проверяем, авторизован ли пользователь
window.onload = function () {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Пользователь вошёл
      currentUser = user;
      showChat(user);
      loadMessagesFromFirebase();
    } else {
      // Не вошёл
      showAuth();
    }
  });
};

// Показать экран входа
function showAuth() {
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('chatPage').classList.add('hidden');
}

// Показать чат
function showChat(user) {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('chatPage').classList.remove('hidden');

  document.getElementById('currentUser').textContent = user.displayName || user.email;
  document.getElementById('userPhoto').src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=2ecc71&color=fff';
}

// Вход через Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .catch((error) => {
      alert('Ошибка входа: ' + error.message);
    });
}

// Выход (опционально — можно добавить позже)
function signOut() {
  auth.signOut();
}

// Загрузка сообщений
function loadMessagesFromFirebase() {
  const messagesRef = database.ref('messages');
  const messagesContainer = document.getElementById('messages');
  messagesContainer.innerHTML = '';

  messagesRef.on('child_added', (snapshot) => {
    const msg = snapshot.val();
    addMessageToDOM(msg.text, msg.sender);
  });
}

// Добавить сообщение в DOM
function addMessageToDOM(text, sender) {
  const container = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  if (sender === currentUser?.email) {
    messageElement.classList.add('own');
  } else if (sender === 'system') {
    messageElement.classList.add('system');
  } else {
    messageElement.classList.add('other');
  }

  const displayName = getDisplayName(sender);
  const prefix = sender === 'system' ? '' : sender === currentUser?.email ? '' : `${displayName}: `;
  messageElement.textContent = prefix + text;

  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
}

// Получить имя из email (или использовать email)
function getDisplayName(email) {
  if (email === 'system') return 'Система';
  return email.split('@')[0].replace('.', ' ');
}

// Отправка сообщения
function sendMessage() {
  if (!currentUser) return;

  const input = document.getElementById('messageInput');
  const text = input.value.trim();

  if (text === '') return;

  const messagesRef = database.ref('messages');
  messagesRef.push({
    text: text,
    sender: currentUser.email,
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
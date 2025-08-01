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

// При загрузке — проверка состояния авторизации
window.onload = function () {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      updateProfileDisplayName(); // Сохраняем имя при входе
      showChat(user);
      loadMessagesFromFirebase();
    } else {
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

  const displayName = user.displayName || user.email.split('@')[0];
  document.getElementById('currentUser').textContent = displayName;

  const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2ecc71&color=fff`;
  document.getElementById('userPhoto').src = photoURL;
}

// Переключение форм
function showLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('registerTab').classList.remove('active');
}

function showRegister() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginTab').classList.remove('active');
  document.getElementById('registerTab').classList.add('active');
}

// Регистрация по email и паролю
function registerWithEmail() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name || !email || !password) {
    alert('Заполните все поля');
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      // Устанавливаем отображаемое имя
      return cred.user.updateProfile({
        displayName: name
      });
    })
    .then(() => {
      console.log('Пользователь зарегистрирован:', auth.currentUser);
    })
    .catch((error) => {
      alert('Ошибка: ' + error.message);
    });
}

// Вход по email и паролю
function loginWithEmail() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  auth.signInWithEmailAndPassword(email, password)
    .catch((error) => {
      alert('Ошибка входа: ' + error.message);
    });
}

// Вход через Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => {
    alert('Ошибка: ' + error.message);
  });
}

// Обновляем имя в профиле (если пользователь изменил имя)
function updateProfileDisplayName() {
  const user = auth.currentUser;
  if (user && !user.displayName) {
    const name = user.email.split('@')[0].replace('.', ' ');
    user.updateProfile({ displayName: name });
  }
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

  const displayName = getDisplayName(sender);

  if (sender === currentUser?.email) {
    messageElement.classList.add('own');
  } else if (sender === 'system') {
    messageElement.classList.add('system');
  } else {
    messageElement.classList.add('other');
  }

  const prefix = sender === 'system' ? '' : sender === currentUser?.email ? '' : `${displayName}: `;
  messageElement.textContent = prefix + text;

  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
}

// Получить имя из email
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

  database.ref('messages').push({
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
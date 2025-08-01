// Firebase конфиг — ЗАМЕНИ НА СВОЙ!
// Получи его в Firebase Console → Project Settings → Your apps → Config
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
const auth = firebase.auth();
const database = firebase.database();

// Глобальная переменная для текущего пользователя
let currentUser = null;

// При загрузке страницы — проверяем, вошёл ли пользователь
window.onload = function () {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      updateProfileDisplayName();
      showChat(user);
      loadMessagesFromFirebase();
    } else {
      currentUser = null;
      showAuth(); // ← вот сюда переходит после выхода
    }
  });
};

// Показать экран авторизации
function showAuth() {
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('chatPage').classList.add('hidden');
}

// Показать чат
function showChat(user) {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('chatPage').classList.remove('hidden');

  // Показываем имя
  const displayName = user.displayName || user.email.split('@')[0].replace('.', ' ');
  document.getElementById('currentUser').textContent = displayName;

  // Показываем фото
  const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2ecc71&color=fff`;
  document.getElementById('userPhoto').src = photoURL;
}

// Переключение на форму входа
function showLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('registerTab').classList.remove('active');
}

// Переключение на форму регистрации
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
    alert('Пожалуйста, заполните все поля');
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((credential) => {
      // После регистрации устанавливаем отображаемое имя
      return credential.user.updateProfile({
        displayName: name
      });
    })
    .then(() => {
      console.log('Регистрация успешна:', auth.currentUser);
    })
    .catch((error) => {
      alert('Ошибка регистрации: ' + error.message);
    });
}

// Вход по email и паролю
function loginWithEmail() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('Введите email и пароль');
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .catch((error) => {
      alert('Ошибка входа: ' + error.message);
    });
}

// Вход через Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .catch((error) => {
      alert('Ошибка входа через Google: ' + error.message);
    });
}

// Выход из аккаунта
function signOut() {
  auth.signOut()
    .then(() => {
      console.log("Пользователь успешно вышел");
    })
    .catch((error) => {
      alert('Ошибка при выходе: ' + error.message);
    });
}

// Обновляем имя в профиле (если его нет)
function updateProfileDisplayName() {
  const user = auth.currentUser;
  if (user && !user.displayName) {
    const name = user.email.split('@')[0].replace('.', ' ');
    user.updateProfile({
      displayName: name
    }).then(() => {
      console.log("Имя пользователя установлено:", name);
    });
  }
}

// Загрузка сообщений из Firebase
function loadMessagesFromFirebase() {
  const messagesRef = database.ref('messages');
  const messagesContainer = document.getElementById('messages');
  messagesContainer.innerHTML = ''; // Очистим перед загрузкой

  messagesRef.on('child_added', (snapshot) => {
    const msg = snapshot.val();
    addMessageToDOM(msg.text, msg.sender);
  });
}

// Добавление сообщения в интерфейс
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

  // Форматирование текста сообщения
  let messageText = text;
  if (sender !== 'system' && sender !== currentUser?.email) {
    messageText = `${displayName}: ${text}`;
  }

  messageElement.textContent = messageText;
  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
}

// Получить отображаемое имя по email
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

  input.value = ''; // Очистить поле
}

// Отправка по нажатию Enter
document.getElementById('messageInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
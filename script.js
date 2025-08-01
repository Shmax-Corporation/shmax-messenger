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

// Инициализация
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;
let currentChatWith = null; // С кем сейчас чат

// При загрузке
window.onload = function () {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      setupUserInDatabase();
      showChatPage();
      loadUsersList();
      loadChatList();
    } else {
      showAuthPage();
    }
  });
};

// Показать экран входа
function showAuthPage() {
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('chatPage').classList.add('hidden');
}

// Показать основной интерфейс
function showChatPage() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('chatPage').classList.remove('hidden');
  updateUserInfo();
}

// Обновить данные пользователя в интерфейсе
function updateUserInfo() {
  const displayName = currentUser.displayName || currentUser.email.split('@')[0];
  document.getElementById('currentUser').textContent = displayName;
  const photoURL = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2ecc71&color=fff`;
  document.getElementById('userPhoto').src = photoURL;
}

// Сохранить пользователя в базу
function setupUserInDatabase() {
  const userRef = database.ref('users/' + currentUser.uid);
  userRef.set({
    email: currentUser.email,
    displayName: currentUser.displayName || currentUser.email.split('@')[0],
    photoURL: currentUser.photoURL,
    lastSeen: new Date().toISOString()
  });
}

// Обновить время "был в сети"
window.addEventListener('beforeunload', () => {
  if (currentUser) {
    database.ref('users/' + currentUser.uid + '/lastSeen').set(new Date().toISOString());
  }

// Загрузить список пользователей
function loadUsersList() {
  const usersRef = database.ref('users');
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = '';

  usersRef.on('value', (snapshot) => {
    const users = snapshot.val();
    for (const uid in users) {
      const user = users[uid];
      if (uid === currentUser.uid) continue; // Не показываем себя

      const userEl = document.createElement('div');
      userEl.classList.add('user-item');
      userEl.innerHTML = `
        <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=2ecc71&color=fff`}" 
             width="40" height="40" style="border-radius: 50%; margin-right: 10px;">
        <div>
          <strong>${user.displayName}</strong><br>
          <small>${user.email}</small>
        </div>
      `;
      userEl.onclick = () => startChatWith(user);
      usersList.appendChild(userEl);
    }
  });
}

// Начать чат с пользователем
function startChatWith(user) {
  currentChatWith = user;
  document.getElementById('chatHeader').textContent = user.displayName;
  document.getElementById('messages').innerHTML = '';
  loadChatMessages(currentUser.uid, user.email);
  document.getElementById('chatContainer').classList.remove('hidden');
}

// Получить ID чата (алфавитный порядок)
function getChatId(uid1, email2) {
  const key = [uid1, email2].sort().join('_');
  return 'direct_' + key;
}

// Загрузить сообщения чата
function loadChatMessages(myUid, otherEmail) {
  const chatId = getChatId(myUid, otherEmail);
  const chatRef = database.ref('chats/' + chatId);
  const messagesContainer = document.getElementById('messages');

  chatRef.off(); // Убираем старые слушатели
  messagesContainer.innerHTML = '';

  chatRef.on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const isMine = msg.sender === currentUser.email;
    addMessageToChat(msg.text, isMine);
  });
}

// Отправить сообщение
function sendMessage() {
  if (!currentChatWith || !currentUser) return;

  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;

  const chatId = getChatId(currentUser.uid, currentChatWith.email);
  const chatRef = database.ref('chats/' + chatId);

  chatRef.push({
    text: text,
    sender: currentUser.email,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  input.value = '';
}

// Добавить сообщение в DOM
function addMessageToChat(text, isMine) {
  const container = document.getElementById('messages');
  const msgEl = document.createElement('div');
  msgEl.classList.add('message');
  msgEl.classList.add(isMine ? 'own' : 'other');
  msgEl.textContent = text;
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

// Выход
function signOut() {
  if (currentUser) {
    database.ref('users/' + currentUser.uid + '/lastSeen').set(new Date().toISOString());
  }
  auth.signOut();
}

// Загрузить список чатов (последние)
function loadChatList() {
  const chatsRef = database.ref('chats');
  const chatList = document.getElementById('chatList');
  chatList.innerHTML = '';

  chatsRef.on('value', (snapshot) => {
    const allChats = snapshot.val();
    const userChats = [];

    for (const chatId in allChats) {
      if (chatId.includes(currentUser.uid)) {
        const messages = Object.values(allChats[chatId]);
        const lastMsg = messages[messages.length - 1];
        if (lastMsg) {
          const otherId = chatId.split('_')[1] === currentUser.uid 
            ? chatId.split('_')[2] 
            : chatId.split('_')[1];

          userChats.push({
            chatId,
            lastMessage: lastMsg.text,
            sender: lastMsg.sender,
            timestamp: lastMsg.timestamp,
            otherId
          });
        }
      }
    }

    // Сортировка по времени
    userChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Пока просто заглушка — в реальности нужно подтягивать имя собеседника
    userChats.forEach(chat => {
      const item = document.createElement('div');
      item.classList.add('chat-item');
      item.innerHTML = `
        <strong>Чат с пользователем</strong><br>
        <small>${chat.lastMessage.substring(0, 30)}...</small>
      `;
      chatList.appendChild(item);
    });
  }, (error) => {
    console.error("Ошибка загрузки чатов:", error);
  });
}
});
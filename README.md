# 💬 Real-Time Chat

<div align="center">
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react">
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs">
<img src="https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socket.io">
<img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql">
<img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript">
<img src="https://img.shields.io/badge/Tailwind-4.1.16-06B6D4?style=for-the-badge&logo=tailwindcss">
</div>

## 📋 О проекте
Полнофункциональное веб-приложение для обмена сообщениями в реальном времени с использованием React, Node.js, WebSocket и PostgreSQL.

## 🚀 Быстрый запуск
**Предварительные требования: Docker и Docker Compose**

```bash
git clone https://github.com/zxcThienla0/real-time-chat.git
cd real-time-chat
docker-compose up --build
```
Доступ к приложению:

**Frontend: http://localhost:5173**

**Backend API: http://localhost:3000**

## ⚙️ Конфигурация
**Переменные окружения Backend**
```env
DB_NAME=chatdb
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
PORT=3000
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## 🏗 Архитектура
Приложение состоит из трех сервисов:

**frontend** - React/Vite приложение (порт 5173)

**backend** - Node.js/Express API (порт 3000)

**database** - PostgreSQL (порт 5432)

## 🛠 Технологический стек
**Frontend**

React 19, TypeScript, Tailwind CSS 4

Vite, Socket.io Client, Axios

**Backend**

Node.js + Express 5, Socket.io 4.8.1

PostgreSQL + Sequelize, JWT, bcrypt

## 🎯 Функциональность
🔐 Регистрация и авторизация

💬 Обмен сообщениями в реальном времени

👥 Онлайн-статусы пользователей

📁 Загрузка файлов и изображений

⌨️ Индикаторы набора текста

## 🔌 API Endpoints
**🔐 Аутентификация**
**POST /api/auth/login** - вход в систему

**POST /api/auth/registration** - регистрация пользователя

**POST /api/auth/logout** - выход из системы

**GET /api/auth/refresh** - обновление токенов

**💬 Сообщения**
**GET /api/messages/:conversationId** - получение истории сообщений

**👥 Диалоги**
**GET /api/conversations** - список диалогов пользователя

**GET /api/conversations/:id** - информация о диалоге

**POST /api/conversations** - создание нового диалога

**GET /api/conversations/with/:nickname** - поиск диалога с пользователем

**👤 Пользователи**
**GET /api/users/profile** - профиль текущего пользователя

**POST /api/users/upload** - загрузка файлов

## 🔧 Ручная установка (без Docker)
**Backend**

```bash
cd backend
npm install
npm start
```

**Frontend**

```bash
cd frontend
npm install  
npm run dev
```

## 📞 Контакты

Telegram: @Thienla0o0

Email: sburcalev@gmail.com

GitHub: zxcThienla0

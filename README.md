# 💬 Real-Time Chat Application

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
**Предварительные требования:** Docker и Docker Compose

```bash
git clone https://github.com/zxcThienla0/real-time-chat.git
cd real-time-chat
docker-compose up --build
```
Доступ к приложению:

**Frontend: http://localhost:5173**

**Backend API: http://localhost:3001**

## 🏗 Архитектура
Приложение состоит из трех сервисов:

**frontend** - React/Vite приложение (порт 5173)

**backend** - Node.js/Express API (порт 3001)

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

##🔧 Ручная установка (без Docker)
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

# Prize Pool Website 🎟️

A full-stack web application built as a learning and portfolio project.
The application displays prize pools, stores them in a database, and serves them through a backend API with a simple frontend.

This project is being developed to demonstrate junior-level full-stack skills using modern web technologies.

---

## 🚀 Features

- Backend API built with Node.js and Express
- Database integration using PostgreSQL and Prisma ORM
- REST API endpoint to fetch prize pools
- Simple frontend (HTML + JavaScript) that displays live data from the backend
- Clean project structure following real-world practices

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL
- Prisma ORM

### Frontend
- HTML
- Vanilla JavaScript
- CSS

### Tools
- Git
- GitHub
- VS Code

---

## 📂 Project Structure

Prize Pool Website/
├─ src/
│  ├─ index.js
│  └─ routes/
│     └─ pools.js
├─ public/
│  └─ index.html
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ .env
├─ package.json
└─ README.md

---

## ⚙️ Setup & Installation

### 1. Clone the repository

git clone <your-repo-url>
cd prize-pool-website

### 2. Install dependencies

npm install

### 3. Configure environment variables

Create a .env file in the project root:

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/prizepool"

---

### 4. Run database migrations

npx prisma migrate dev

(Optional)
npx prisma studio

---

### 5. Start the server

node src/index.js

Visit:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/pools

---

## 📌 Current Status

- Backend API connected to database
- Frontend displaying live data
- Tickets, users, and payments in progress

---

## 📈 Planned Features

- Admin UI to create prize pools
- Ticket purchasing system
- User accounts
- Payment integration
- Confirmation emails
- Improved UI styling

---

## 🎯 Purpose of This Project

This project was created to:
- Learn full-stack web development
- Practice working with APIs and databases
- Build a real, explainable portfolio project for job applications

---

## 👤 Author

Rainen Scaife  
Junior Developer (Learning Project)

---

## 📄 License

This project is for educational and portfolio purposes.

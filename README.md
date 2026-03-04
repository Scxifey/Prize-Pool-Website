# 🏆 Prize Pool Website

A full-stack web application where users can buy tickets for a chance to win prizes. Built with Node.js, Express, PostgreSQL and Prisma.

---

## ✨ Features

- 🎟 **Buy Tickets** — Customers can enter their name and email to purchase a ticket for any active pool
- 📧 **Email Confirmations** — Automatic confirmation emails sent to customers on ticket purchase
- 🏆 **Winner Selection** — Randomly picks a winner from all ticket holders and notifies them by email
- ➕ **Create Pools** — Add new prize pools with a custom title, ticket price and ticket cap
- 📊 **Live Progress** — Each pool displays a progress bar showing how many tickets have been sold
- 💾 **Persistent Storage** — All data stored in a real PostgreSQL database

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | PostgreSQL, Prisma ORM |
| Emails | Nodemailer, Gmail |

---

## 📁 Project Structure

```
Prize Pool Website/
├── prisma/
│   ├── schema.prisma        # Database schema (Pool, User, Ticket)
│   └── migrations/          # Database migration history
├── public/
│   └── index.html           # Frontend UI
├── src/
│   ├── index.js             # Main server entry point
│   └── routes/
│       └── pools.js         # API routes for pools, tickets and winners
├── .env                     # Environment variables (not included in repo)
├── .gitignore
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Scxifey/Prize-Pool-Website.git
   cd Prize-Pool-Website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment variables**

   Create a `.env` file in the root of the project:
   ```
   DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/yourdbname"
   EMAIL_USER=yourgmail@gmail.com
   EMAIL_PASS=your16characterapppassword
   ```

   > For email, you'll need to generate a [Gmail App Password](https://myaccount.google.com/apppasswords)

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the server**
   ```bash
   node src/index.js
   ```

6. **Visit the website**

   Open your browser and go to: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pools` | Get all prize pools |
| POST | `/api/pools` | Create a new pool |
| POST | `/api/pools/:id/buy` | Buy a ticket for a pool |
| POST | `/api/pools/:id/winner` | Randomly pick a winner |

---

## 📸 Preview

### Active Pools
- Dark luxury UI with gold accents
- Progress bars showing tickets sold
- Buy ticket modal with name and email form

### Emails
- Branded confirmation email sent on ticket purchase
- Winner notification email sent when a winner is picked

---

## ⚠️ Disclaimer

This project is for **educational and portfolio purposes only**. It is not intended to be used as a real commercial service.

---

## 👤 Author

**Scxifey** — [GitHub](https://github.com/Scxifey)

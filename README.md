# 🚀 FullStack EMS (Employee Management System)

A **production-grade full-stack Employee Management System (EMS)** built using modern web technologies. This project demonstrates real-world backend architecture, authentication systems, database design, and scalable frontend integration.

---
🌐 Live Demo

🔗 Frontend (Deployed on Vercel):
👉 https://employee-management-system-rosy-ten.vercel.app/login

🧪 Test Credentials:

Email: prakashratnesh2005@gmail.com
Password: admin123

# 📌 Project Overview

FullStack EMS is a complete employee management platform that allows organizations to:

* Manage employees efficiently
* Handle authentication & authorization securely
* Automate background tasks
* Maintain scalable and modular architecture

This project simulates a **real SaaS product backend + frontend system**.

---

# 🧠 Tech Stack

## 🔹 Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* Inngest (Background Jobs & Cron)
* Brevo SMTP (Email Service)

## 🔹 Frontend

* React.js
* Axios
* Modern UI components

## 🔹 Dev Tools

* Git & GitHub
* VS Code
* Postman

---

# 🏗️ System Architecture

```
Client (React)
      ↓
API Layer (Express.js)
      ↓
Authentication Middleware (JWT)
      ↓
Business Logic (Controllers & Services)
      ↓
Database (MongoDB Atlas)
      ↓
Background Jobs (Inngest)
      ↓
Email Service (Brevo SMTP)
```

---

# 🔐 Features

## ✅ Authentication & Security

* JWT-based authentication
* Secure password hashing
* Role-based access control (Admin/User)
* Protected API routes

## 👨‍💼 Employee Management

* Add / Update / Delete employees
* Admin dashboard functionality
* Data stored in MongoDB

## 📧 Email Integration

* Automated email services using Brevo
* Notification system support

## ⏱ Background Jobs

* Scheduled jobs using Inngest
* Event-driven architecture

## ⚙️ Scalable Backend

* Modular folder structure
* Middleware-based design
* Clean API separation

---

# 📁 Project Structure

```
FullStack-EMS/
│
├── client/          # React frontend
├── server/          # Node.js backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── seed.js
│
├── .gitignore
└── README.md
```

---

# ⚙️ Environment Variables

Create a `.env` file inside the `server` folder:

```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
ADMIN_EMAIL=your_email
INNGEST_EVENT_KEY=your_key
INNGEST_SIGNING_KEY=your_key
BREVO_API_KEY=your_key
```

---

# 🚀 How to Run Locally

## 1️⃣ Clone the repository

```
git clone https://github.com/yourusername/your-repo-name.git
cd FullStack-EMS
```

---

## 2️⃣ Setup Backend

```
cd server
npm install
npm run seed
npm run server
```

---

## 3️⃣ Setup Frontend

```
cd client
npm install
npm run start
```

---

# 🔑 Default Admin Credentials

```
Email: admin@example.com
Password: admin123
```

⚠️ Change password after first login

---

# 🌐 Deployment

* Backend can be deployed on **Vercel / Render**
* MongoDB hosted on **MongoDB Atlas**
* Update Inngest endpoint after deployment

---

# 📊 Real-World Engineering Concepts Used

* REST API Design
* MVC Architecture
* Middleware-based authentication
* Environment-based configuration
* Database schema design
* Event-driven background processing
* Secure credential management

---

# ⚠️ Security Considerations

* `.env` is excluded using `.gitignore`
* Sensitive credentials are not exposed
* JWT secrets should be strong in production
* Passwords must be hashed

---

# 💡 Future Improvements

* Role-based dashboards (Admin/User UI)
* Pagination & filtering
* Docker containerization
* CI/CD pipeline integration
* Logging & monitoring (Winston / Prometheus)
* Unit & integration testing

---

# 👨‍💻 Author

**Ratnesh Prakash Yadav**

* Passionate about backend systems & scalable architecture
* Focused on building real-world production-ready applications

---

# ⭐ Why This Project Stands Out

✔ Full-stack production-level architecture
✔ Real-world integrations (Email, Background Jobs)
✔ Clean and scalable backend design
✔ Demonstrates strong understanding of system design

---

# 📬 Contact

If you found this project useful or want to collaborate:

* GitHub: https://github.com/alpharatnesh
* Email: prakashratnesh2005@gmail.com

---

> 🚀 This project reflects practical backend engineering skills required in real-world software development.

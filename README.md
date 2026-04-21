# Crop Harvest Advisor | Smart Farming AI

![version](https://img.shields.io/badge/v1.0.0-brightgreen)

A sophisticated AI-driven platform designed to optimize agricultural productivity through data-backed crop recommendations and harvest insights.

---

## 🚀 Getting Started

Follow these steps to get your local development environment up and running. Ensure you have **Python 3.x** and **Node.js** installed.

### 1. Backend Setup

The backend serves as the AI engine and API for the application. It must be started first.

```bash
# Open a new terminal
cd backend
source venv/bin/activate
python run.py
```

*The server typically runs on `http://localhost:5000`.*

### 2. Frontend Setup

The frontend provides the user interface for farmers and researchers to interact with the AI models.

```bash
# Open a second terminal
cd frontend
npm start
```

*The application will open automatically in your browser at `http://localhost:3000`.*

> **Security Reminder:** Never push your `.env` or `config.json` files to version control. Ensure they are listed in your `.gitignore` file.

---

## 🛠 Tech Stack

- **Frontend:** React.js
- **Backend:** Python / Flask
- **AI/ML:** TensorFlow / Scikit-Learn
- **Environment Management:** Virtualenv / npm

---

## 📁 Project Structure

```
Crop-Harvest-Advisor/
├── backend/          # Python API & AI Logic
│   ├── venv/         # Virtual Environment (Ignored)
│   └── run.py        # Entry point
└── frontend/         # React Application
    ├── src/
    └── package.json
```
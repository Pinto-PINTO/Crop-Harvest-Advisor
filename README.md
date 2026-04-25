# Crop Harvest Advisor | Smart Farming AI

![version](https://img.shields.io/badge/v1.4.0-brightgreen)

A sophisticated AI-driven platform designed to optimize agricultural productivity through data-backed crop recommendations and harvest insights.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Installation](#-installation)
- [🏃 Running the App](#-running-the-app)
- [📁 Project Structure](#-project-structure)
- [🔧 Environment Variables](#-environment-variables)
- [📡 API Endpoints](#-api-endpoints)
- [🐛 Troubleshooting](#-troubleshooting)
- [📄 License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌱 **Crop Management** | Add, edit, delete and monitor multiple crops |
| 🤖 **AI Analysis** | Upload images for instant crop health assessment |
| 🦠 **Disease Detection** | Identify leaf blast, brown spot, bacterial blight |
| 📊 **Harvest Predictions** | AI-driven harvest timing recommendations |
| 🌤️ **Weather Integration** | Real-time weather data affecting crop health |
| 🏷️ **Dynamic Health Tags** | Color-coded health status (Healthy, Monitor, ACT NOW!) |
| 📱 **Responsive Design** | Works seamlessly on desktop, tablet, and mobile |
| 🔒 **Secure Authentication** | Firebase Auth with email/password |

---

## 🛠 Tech Stack

- **Frontend:** React.js, Tailwind CSS (v3.4.0), Framer Motion
- **Backend:** Python / FastAPI (v0.104.1)
- **AI/ML:** TensorFlow (v2.13.0) / Scikit-Learn
- **Database:** Firebase Firestore
- **Environment Management:** Virtualenv / npm

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9 - 3.11** (TensorFlow 2.13.0 requires Python 3.9-3.11)
- **Node.js 14+** (with npm)
- **Git**

### Verify installations:

```bash
# Check Python version (must be 3.9-3.11)
python --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/Pinto-PINTO/Crop-Harvest-Advisor.git

# Navigate into the project
cd Crop-Harvest-Advisor
```

### Step 2: Backend Setup

**macOS / Linux:**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create uploads directory
mkdir -p uploads

# Create environment file
cat > .env << 'EOF'
DEMO_MODE=True
WEATHER_API_KEY=demo_key
EOF

# Return to root
cd ..
```

**Windows:**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create uploads directory
mkdir uploads

# Create environment file
echo DEMO_MODE=True > .env
echo WEATHER_API_KEY=demo_key >> .env

# Return to root
cd ..
```

### Step 3: Frontend Setup

**macOS / Linux & Windows:**

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Install Tailwind CSS (specific versions for compatibility)
npm install -D tailwindcss@3.4.0 postcss@8.4.31 autoprefixer@10.4.16

# Initialize Tailwind config
npx tailwindcss init -p

# Return to root
cd ..
```

---

## 🏃 Running the App

> **⚠️ Important:** You need to run the backend and frontend in **two separate terminal windows**.

### Terminal 1: Start Backend Server

**macOS / Linux:**

```bash
cd Crop-Harvest-Advisor/backend
source venv/bin/activate
python run.py
```

**Windows:**

```bash
cd Crop-Harvest-Advisor\backend
venv\Scripts\activate
python run.py
```

The backend will run at: `http://localhost:8000`

### Terminal 2: Start Frontend Server

**macOS / Linux & Windows:**

```bash
cd Crop-Harvest-Advisor/frontend
npm start
```

The app will open automatically at: `http://localhost:3000`

### ✅ Success Indicators

**Backend Terminal should show:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Frontend Terminal should show:**
```
Compiled successfully!
You can now view frontend in the browser.
Local: http://localhost:3000
```

---

## 📁 Project Structure

```
Crop-Harvest-Advisor/
├── backend/                    # Python API & AI Logic
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI application
│   │   ├── firebase_config.py # Firebase setup
│   │   ├── ml_model.py        # AI analysis model
│   │   ├── weather_service.py # Weather API
│   │   └── prediction_service.py # Harvest predictions
│   ├── uploads/               # Temporary image storage (auto-created)
│   ├── venv/                  # Virtual Environment (Ignored)
│   ├── requirements.txt       # Python dependencies
│   ├── run.py                 # Server entry point
│   └── .env                   # Environment variables
├── frontend/                   # React Application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── FarmAuth/      # Login/Register components
│   │   │   └── FarmDashboard/ # Dashboard, Cards, Modals
│   │   ├── context/
│   │   │   └── FarmContext.js # Global state
│   │   ├── App.js             # Main React component
│   │   ├── index.css          # Tailwind + global styles
│   │   └── firebase.js        # Firebase config
│   ├── package.json
│   └── tailwind.config.js
├── .gitignore
└── README.md
```

---

## 🔧 Environment Variables

### Backend `.env` file (create in `backend/` folder)

```env
# Firebase Configuration
DEMO_MODE=True                                    # Use demo mode (no Firebase needed)
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com

# Weather API (get free key from OpenWeatherMap)
WEATHER_API_KEY=your_openweather_api_key_here
```

> **Note:** `DEMO_MODE=True` works without Firebase. Set to `False` for production.

### Getting a Free Weather API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "API Keys" section
4. Copy your API key
5. Add it to `.env` file

---

## 📡 API Endpoints

Once backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/farm/register` | Register a new farm |
| POST | `/api/farm/login` | Login to farm account |
| GET | `/api/farm/{farm_id}` | Get farm profile |
| PUT | `/api/farm/{farm_id}` | Update farm profile |
| POST | `/api/crops` | Add a new crop |
| GET | `/api/crops/{farm_id}` | Get all crops |
| PUT | `/api/crops/{crop_id}` | Update crop |
| DELETE | `/api/crops/{crop_id}` | Delete crop |
| POST | `/api/analyze` | AI image analysis |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/history/{user_id}` | Get analysis history |

---

## 🐛 Troubleshooting

### Common Issues and Solutions

**❌ Module not found: 'framer-motion'**

```bash
cd frontend
npm install framer-motion react-icons react-hot-toast axios
npm start
```

**❌ TensorFlow installation fails**

```bash
# For macOS with Apple Silicon
pip install tensorflow-macos==2.13.0

# For CPU-only installation
pip install tensorflow-cpu==2.13.0

# Or use Python 3.10 (TensorFlow 2.13 works best with Python 3.10)
```

**❌ Port already in use**

```bash
# Kill process on port 8000 (Mac/Linux)
lsof -ti:8000 | xargs kill -9

# Or change port in backend/run.py
uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
```

**❌ Firebase initialization error**

Set `DEMO_MODE=True` in `.env` to run without Firebase.

**❌ Tailwind CSS not working**

Make sure you installed the correct versions:
```bash
npm list tailwindcss postcss autoprefixer
# Should show: tailwindcss@3.4.0, postcss@8.4.31, autoprefixer@10.4.16
```

**❌ Python version issues**

TensorFlow 2.13.0 requires Python 3.9-3.11. Check your version:
```bash
python --version
# If you have Python 3.12+, create venv with specific version:
python3.10 -m venv venv
```

---

## 📄 License

This project is licensed under the MIT License.

---

**Made with 🌾 by farmers, for farmers**
```
# 🧠 Cerebro Connect

A full-stack EEG (Electroencephalography) monitoring web application for clinical use. Enables doctors to manage patients and conduct EEG sessions for neurological condition analysis including Dementia, Coma, and General monitoring.

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login for Doctors and Patients
- 👨‍⚕️ **Doctor Dashboard** — Manage patients, start EEG sessions, view real-time stats
- 🧑‍🦽 **Patient Dashboard** — View personal EEG session history and health summary
- 🧪 **EEG Session Modes** — DEMENTIA (Theta/Alpha), COMA (Delta), GENERAL (Full band)
- 📋 **Patient Assignment** — Doctors can assign patients to their profile
- 📊 **Live Stats** — Real session counts, dementia/coma session tracking, today's sessions
- 🌐 **Local Network Access** — Accessible across all devices on same WiFi
- 🎨 **Pleasant Medical UI** — Clean light theme with role-based color coding
- 🛡️ **Route Protection** — Unauthenticated users redirected to landing page

---

## 🛠️ Tech Stack

### Backend
| Technology | Details |
|---|---|
| Java 17+ | Core language |
| Spring Boot 4.0.1 | Application framework |
| Spring Security 7.0.2 | JWT authentication + route protection |
| Spring Data JDBC | Database access layer |
| MySQL 8.0+ | Relational database |
| JJWT 0.11.5 | JWT token generation and validation |
| BCrypt | Password hashing |
| Maven | Build tool |

### Frontend
| Technology | Details |
|---|---|
| React 18+ | UI framework |
| React Router DOM v6 | Client-side routing |
| Axios | HTTP client |
| MUI (Material UI) v5 | UI components |
| Chart.js | Data visualization |

---

## 📁 Project Structure

```
cerebro-connect/
│
├── backend (main branch)
│   └── src/main/java/com/cerebro/demo/
│       ├── config/
│       │   ├── AppConfig.java              # ObjectMapper bean
│       │   └── SecurityConfig.java         # JWT filter + CORS config
│       ├── controller/
│       │   ├── AuthController.java         # Register & Login endpoints
│       │   ├── EEGSessionController.java   # EEG session endpoints
│       │   ├── PatientController.java      # Patient management endpoints
│       │   └── UserController.java         # User listing endpoints
│       ├── dao/
│       │   ├── UserDAO.java / UserDAOImpl.java
│       │   ├── PatientDAO.java / PatientDAOImpl.java
│       │   └── EEGSessionDAO.java / EEGSessionDAOImpl.java
│       ├── model/
│       │   ├── User.java                   # UserDetails implementation
│       │   ├── Patient.java
│       │   ├── Doctor.java
│       │   ├── EEGSession.java
│       │   ├── EEGLog.java
│       │   ├── MedicalHistoryEntry.java
│       │   └── Prescription.java
│       └── security/
│           ├── JwtUtil.java                # Token generation & validation
│           └── JwtAuthFilter.java          # Request filter
│
├── frontend (frontend branch)
│   └── src/
│       ├── components/
│       │   ├── LandingPage.js              # Role selector (Doctor/Patient)
│       │   ├── Login.js                    # Auth screen (register/login)
│       │   └── Dashboard.js               # Role-based dashboard
│       ├── config.js                       # API base URL config
│       └── App.js                         # Routes + auth protection
│
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

---

### 1️⃣ MySQL Database Setup

```sql
CREATE DATABASE cerebro_connect;
CREATE USER 'cerebro_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON cerebro_connect.* TO 'cerebro_user'@'localhost';
FLUSH PRIVILEGES;

USE cerebro_connect;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  profile_info TEXT
);

CREATE TABLE patients (
  id BIGINT PRIMARY KEY,
  doctor_ids JSON,
  medical_history JSON,
  reports JSON,
  prescriptions JSON,
  eeg_data_logs JSON
);

CREATE TABLE eeg_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  mode VARCHAR(50),
  start_time DATETIME,
  end_time DATETIME,
  notes TEXT,
  raw_data TEXT,
  processed_data TEXT
);
```

---

### 2️⃣ Backend Setup

```bash
# Clone the repo
git clone https://github.com/Amogh1802/cerebro-connect.git
cd cerebro-connect
```

Create `src/main/resources/application.properties` from the example file:

```properties
spring.application.name=Cerebro Connect
server.port=9090
server.address=0.0.0.0
spring.datasource.url=jdbc:mysql://localhost:3306/cerebro_connect?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
jwt.secret=YOUR_SUPER_LONG_SECRET_KEY_MIN_32_CHARS
jwt.expiration=86400
logging.level.org.springframework=INFO
logging.level.com.cerebro=DEBUG
```

```bash
# Run the backend
mvn spring-boot:run
```

✅ Backend runs on: `http://localhost:9090`

---

### 3️⃣ Frontend Setup

```bash
# Switch to frontend branch
git checkout frontend
npm install
```

Create `src/config.js`:
```js
// For localhost development:
const API_BASE = 'http://localhost:9090/api';
export default API_BASE;
```

```bash
npm start
```

✅ Frontend runs on: `http://localhost:3000`

---

## 🌐 Local Network Access

To access from other devices on the same WiFi:

**1. Find your IP:**
```cmd
ipconfig
# Look for IPv4 Address e.g. 192.168.x.x
```

**2. Update `src/config.js`:**
```js
const API_BASE = 'http://192.168.x.x:9090/api';
export default API_BASE;
```

**3. Allow firewall ports (run CMD as Administrator):**
```cmd
netsh advfirewall firewall add rule name="React 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Spring 9090" dir=in action=allow protocol=TCP localport=9090
```

**4. Access from any device on WiFi:**
```
http://192.168.x.x:3000
```

---

## 🔐 API Endpoints

### Auth (Public — no token required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (Doctor or Patient) |
| POST | `/api/auth/login` | Login and receive JWT token |

### Patients (🔒 Protected — requires Bearer token)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/patients` | Get all patients |
| GET | `/api/patients/doctor/{doctorId}` | Get patients assigned to a doctor |
| POST | `/api/patients/assign` | Assign patient to a doctor |

### EEG Sessions (🔒 Protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/eeg/session` | Start a new EEG session |
| GET | `/api/eeg/sessions/{patientId}` | Get all sessions for a patient |

### Users (🔒 Protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/patients` | Get all users with PATIENT role |
| GET | `/api/users/doctors` | Get all users with DOCTOR role |

---

## 🧪 EEG Modes Explained

| Mode | Brain Waves Analyzed | Clinical Use Case |
|---|---|---|
| **DEMENTIA** | Theta (4–8Hz), Alpha (8–13Hz) | Alzheimer's detection, cognitive decline monitoring |
| **COMA** | Delta (0.5–4Hz) | Consciousness level assessment |
| **GENERAL** | Full band (0.5–30Hz) | General neurological health screening |

---

## 👥 User Roles

### 👨‍⚕️ Doctor
- Register/Login via `/login/doctor`
- View list of assigned patients
- Assign new patients from unassigned pool
- Start and stop EEG sessions per patient
- Select EEG mode per session
- View dementia/coma/general session stats
- View sessions today count

### 🧑‍🦽 Patient
- Register/Login via `/login/patient`
- View personal EEG session history
- View health summary statistics
- Auto-assigned a patient record on registration
- Sessions viewable with mode, date and notes

---

## 🔒 Security Implementation

- ✅ Passwords hashed with **BCrypt**
- ✅ **JWT tokens** expire after 24 hours
- ✅ **JwtAuthFilter** validates token on every protected request
- ✅ Public routes — only `/api/auth/login` and `/api/auth/register`
- ✅ All other routes require valid `Authorization: Bearer <token>` header
- ✅ **CORS** configured for frontend origin
- ✅ **Stateless** session management
- ✅ Returns `401 Unauthorized` for missing/invalid tokens

---

## 🗄️ Database Schema

```
users
├── id (PK, AUTO_INCREMENT)
├── email (UNIQUE)
├── password (BCrypt hashed)
├── role (DOCTOR / PATIENT)
├── name
└── profile_info (JSON)

patients
├── id (PK, FK → users.id)
├── doctor_ids (JSON array of doctor IDs)
├── medical_history (JSON)
├── reports (JSON)
├── prescriptions (JSON)
└── eeg_data_logs (JSON)

eeg_sessions
├── id (PK, AUTO_INCREMENT)
├── patient_id (FK → patients.id)
├── mode (DEMENTIA / COMA / GENERAL)
├── start_time (DATETIME)
├── end_time (DATETIME)
├── notes (TEXT)
├── raw_data (TEXT/JSON)
└── processed_data (TEXT/JSON)
```

---

## 🚀 Future Roadmap

- [ ] Real-time EEG streaming via WebSocket
- [ ] Python + Arduino EEG hardware data pipeline
- [ ] EEG band power graph visualization (Chart.js)
- [ ] Cloud deployment (Render + Vercel)
- [ ] PDF report generation per patient
- [ ] Doctor-Patient messaging system
- [ ] Email notifications for new sessions
- [ ] P300/N400 ERP component analysis
- [ ] Mobile responsive design

---

## 👨‍💻 Team

| Name | Role |
|---|---|
| Sumedh Kasture | Full Stack Developer |
| Amogh Ghare | Full Stack Developer |
| Raj Kavathekar | Full Stack Developer |

---

## 📄 License

This project is developed for educational and clinical research purposes.

---

> 🧠 Built with ❤️ for neurological health monitoring — Cerebro Connect 2026

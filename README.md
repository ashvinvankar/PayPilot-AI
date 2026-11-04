# PayPilot AI 🚀
### Intelligent Payment Management & Financial Intelligence for Businesses

PayPilot AI is an AI-powered financial intelligence platform designed to help businesses understand their payment activity, monitor transactions, identify unusual patterns, and make smarter financial decisions.

Built with **Next.js, PayPal Sandbox, Prisma, SQLite, and Google Gemini**, PayPilot AI combines payment processing workflows with an intelligent financial dashboard.

> **Current status:** Working hackathon MVP. PayPal integration currently uses Sandbox mode; no real-money transactions are processed.

---

## 💡 The Problem

Small businesses often receive payments through digital platforms but lack a simple, unified way to understand their financial activity.

They need to:
- Track payment transactions in one place.
- Understand where their money is coming from.
- Categorize transactions.
- Identify unusual payment patterns.
- Get useful insights without manually analyzing every transaction.

## 💡 Our Solution

PayPilot AI brings payment activity and financial intelligence together in one dashboard.

It helps merchants monitor transactions, explore financial trends, detect potentially unusual activity, and interact with their financial data through an AI assistant.

## ✨ Key Features

### 1. PayPal Sandbox Integration
- Create PayPal checkout orders.
- Generate sandbox approval links.
- Process test checkout flows.
- Record completed transactions.

### 2. Financial Dashboard
- Transaction overview.
- Payment volume and transaction statistics.
- Average transaction value.
- Visual financial analytics and charts.

### 3. AI-Powered Financial Insights
- AI-generated summaries of transaction activity.
- Spending and category observations.
- Actionable business recommendations.
- Basic insights fallback when Gemini is unavailable.

### 4. Transaction Categorization
- Organize transaction records by category.
- View category-level transaction summaries.

### 5. Anomaly Monitoring
- Analyze transaction patterns.
- Identify potentially unusual transaction values.
- Display alerts for further review.

### 6. Financial AI Assistant
- Ask questions about transaction activity.
- Get summaries of available financial data.
- Receive recommendations based on transaction information.
- Uses Google Gemini with a local intelligence fallback.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack web application |
| React | User interface |
| TypeScript | Application logic and type safety |
| Tailwind CSS | Styling |
| PayPal Server SDK | PayPal Sandbox checkout integration |
| Prisma | Database ORM |
| SQLite | Local transaction storage |
| Google Gemini | AI financial assistant and insights |
| Recharts | Dashboard visualizations |

---

## 🏗️ Application Architecture

```text
User
  |
  v
Next.js Dashboard
  |
  +---- Financial Dashboard
  |
  +---- Financial AI Assistant
  |         |
  |         +---- Google Gemini
  |         +---- Local Fallback
  |
  +---- API Routes
            |
            +---- PayPal Sandbox
            |
            +---- Transaction Management
            |
            +---- AI Insights
            |
            +---- Anomaly Monitoring
            |
            v
       Prisma + SQLite
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- npm
- PayPal Developer Sandbox account
- Google Gemini API key (optional for fallback functionality)

### 1. Clone the repository

```bash
git clone https://github.com/ashvinvankar/PayPilot-AI.git
cd PayPilot-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

Add the environment variables required by your local configuration:

```env
# PayPal Sandbox credentials
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret

# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key

# Database configuration
DATABASE_URL="file:./dev.db"
```

Use the exact variable names expected by the application source code. Never commit `.env.local` or expose API credentials.

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔐 Security & Payment Status

- PayPal integration is currently configured for Sandbox testing.
- Sandbox transactions do not represent real payments or business revenue.
- API credentials must remain in environment variables.
- AI-generated insights are informational and should be reviewed before making business decisions.
- Anomaly alerts indicate patterns for review, not confirmed fraud.

---

## 🗺️ Future Roadmap

- More advanced merchant analytics.
- Improved financial forecasting.
- Smarter transaction classification.
- More robust anomaly detection.
- Multi-currency financial reporting.
- Merchant-focused mobile experience.
- Production payment integration through appropriate regulated payment providers.

---

## 🎯 Project Vision

Our vision is to make financial intelligence more accessible to businesses by bringing payment activity, analytics, and AI-powered assistance into one platform.

**PayPilot AI — Understand your payments. Discover your insights. Make smarter decisions.**

---

## 👨‍💻 Developer

**Ashvin Vankar**

GitHub: [@ashvinvankar](https://github.com/ashvinvankar)

Project: [PayPilot AI](https://github.com/ashvinvankar/PayPilot-AI)

---

## 📄 License

This project is currently developed as a hackathon MVP. A formal open-source license can be added before public distribution.

# Cocable AI - AI-Powered Image Editing Suite

Cocable AI is a web application that provides a suite of powerful, easy-to-use AI image editing tools. The platform is designed to be fast, private, and user-friendly, leveraging in-browser processing for core features.

## ✨ Features

- **AI Background Remover**: Instantly removes the background from images using a client-side TensorFlow.js model.
- **Batch Background Remover**: A premium feature to process dozens of images at once.
- **User Authentication**: Secure sign-up and login handled by Supabase Auth.
- **Credit System**: Users get free daily uses, with the option to purchase credits for more extensive use.
- **Payments Integration**: Secure payments handled by Razorpay for purchasing credits.
- **User Profile Management**: Users can update their name and avatar.
- **Creations Gallery**: Automatically saves processed images to a user-specific gallery in Supabase Storage.
- **Admin Dashboard**: A protected route for admins to view key application statistics.
- **Responsive Design**: A polished, responsive UI built with shadcn/ui and Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend-as-a-Service**: Supabase
  - **Authentication**: Supabase Auth
  - **Database**: Supabase Postgres
  - **Storage**: Supabase Storage for user avatars and creations
  - **Edge Functions**: Server-side logic for payments and credit deductions
- **AI / Machine Learning**: TensorFlow.js (MediaPipeSelfieSegmentation) for in-browser background removal.
- **Payments**: Razorpay
- **State Management**: TanStack Query (React Query) for server state management.
- **Routing**: React Router

## 🚀 Getting Started

Follow these instructions to set up the project for local development.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (or yarn/pnpm)
- A Supabase account and project.
- A Razorpay account for payment processing.

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/cocable-ai.git
cd cocable-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

You will need to set up environment variables for the application to connect to Supabase and Razorpay.

#### Client-side Variables

Create a `.env` file in the root of the project and add the following variables. You can find these keys in your Supabase project dashboard under `Project Settings > API`.

```
VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
VITE_RAZORPAY_KEY_ID="YOUR_RAZORPAY_KEY_ID"
```

- `VITE_RAZORPAY_KEY_ID` is your public "Key ID" from the Razorpay dashboard.

#### Server-side Secrets (for Edge Functions)

The Supabase Edge Functions require secrets to be set directly in the Supabase dashboard. Navigate to `Project Settings > Edge Functions` and add the following secrets:

- `RAZORPAY_KEY_ID`: Your Razorpay Key ID.
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret.
- `HF_API_KEY`: Your Hugging Face API key (for future AI models).

### 4. Supabase Database Setup

The database schema is managed via migration files located in `supabase/migrations`. To set up your database, you can either run these migrations using the Supabase CLI or execute the SQL manually in the Supabase SQL Editor.

### 5. Run the Development Server

Once the dependencies are installed and environment variables are set, you can start the development server:

```bash
npm run dev
```

The application should now be running on `http://localhost:8080`.

## 📁 Project Structure

The project follows a standard React application structure:

```
.
├── public/              # Static assets
├── supabase/
│   ├── functions/       # Supabase Edge Functions
│   └── migrations/      # Database schema migrations
├── src/
│   ├── components/      # Reusable UI components (including shadcn/ui)
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Third-party service integrations (e.g., Supabase client)
│   ├── pages/           # Route components for each page
│   ├── utils/           # Utility functions
│   ├── workers/         # Web workers for intensive tasks
│   ├── App.tsx          # Main app component with routing
│   └── main.tsx         # Application entry point
└── README.md
```

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.
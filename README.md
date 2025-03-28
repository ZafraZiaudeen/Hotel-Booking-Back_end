# Hotel Booking System - Backend

## Overview
The **Hotel Booking System** backend is a robust API built with **Node.js** and **Express**, handling hotel data management, user authentication, hotel booking, wishlist functionality, and AI-powered search capabilities. It integrates with **MongoDB** for storage and utilizes **OpenAI** and **LangChain** for AI-driven hotel search. The backend provides RESTful endpoints for hotel management, booking, wishlist, and search functionality.

## Features
- 🏨 **Hotel Management**: CRUD operations for hotels (create, read, update, delete).  
- 🔍 **Vector Search**: AI-powered hotel search using embeddings and cosine similarity.  
- 🔒 **Authentication**: Secure sign-in/sign-up powered by **Clerk**.  
- 🚪 **Authorization**: Role-based access (e.g., admin-only hotel creation).  
- 📡 **RESTful API**: Well-structured endpoints for hotel management, bookings, and wishlist.  
- 💾 **Database**: Uses **MongoDB** with Mongoose.  
- ⭐ **Wishlist**: Users can add hotels to their wishlist and retrieve them.  
- 📅 **Hotel Booking**: Users can book hotels by selecting rooms, check-in/check-out dates, and special requests.  
- ❌ **Booking Cancellation**: Users can cancel their bookings from their account.

## Repositories
- **Frontend**: [Hotel Booking Frontend Repository](https://github.com/ZafraZiaudeen/Hotel-Booking)  
- **Backend**: [Hotel Booking Backend Repository](https://github.com/ZafraZiaudeen/Hotel-Booking-Back_end)

## Tech Stack
- **Node.js**: JavaScript runtime.  
- **Express**: Fast and lightweight backend framework.  
- **MongoDB**: NoSQL database with Mongoose ODM.  
- **Clerk**: Authentication and session management.  
- **OpenAI**: AI integration for hotel search.  
- **LangChain**: Framework for vector search.  
- **Nodemon**: Auto-restart during development.  

## Installation & Setup
### Prerequisites
- **Node.js** (v16 or later).  
- **MongoDB** .  
- **Clerk** (Account and API keys).  
- **OpenAI** (API key for LLM integration).  

### Steps
1. **Clone the Repository**
   ```sh
   git clone https://github.com/ZafraZiaudeen/Hotel-Booking-Back_end.git
   cd Hotel-Booking-Back_end
   ```

2. **Install Dependencies**
   ```sh
   npm install
   ```

3. **Set Up Environment Variables**  
   Create a `.env` file in the root directory and add:
   ```sh
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hotels?retryWrites=true&w=majority
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Start the Server**
   ```sh
   npm run dev
   ```
   The server will run at **http://localhost:8000**.

## Contributing
1. Fork the repository.
2. Create a branch:  
   ```sh
   git checkout -b feature/your-feature
   ```
3. Commit changes:  
   ```sh
   git commit -m "Add your feature"
   ```
4. Push to your branch:  
   ```sh
   git push origin feature/your-feature
   ```
5. Open a pull request.

## Contact Me
For any inquiries, feel free to reach out via email:  
📧 Zafraziaudeen@gmail.com



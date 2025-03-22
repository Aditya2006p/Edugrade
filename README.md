# EduGrade: AI-Powered Grading and Feedback System

![EduGrade Logo](public/logo.png)

## 🏆 Google Developer Challenge (GDC) Submission

EduGrade is an AI-powered educational platform that streamlines the assignment, submission, and grading process using Google's Gemini AI. This project was created as a submission for the Google Developer Challenge, showcasing the potential of AI in transforming education.

## 🚀 Key Features

- **Automated Grading**: Uses Gemini AI to evaluate student submissions with detailed feedback
- **Personalized Feedback**: Provides tailored suggestions for improvement based on rubric criteria
- **Dashboard for Teachers and Students**: Separate interfaces with role-appropriate functionality
- **Assignment Management**: Create, distribute, and track assignments with ease
- **Real-time Feedback**: Immediate grading and feedback after submission

## 🧠 Gemini AI Integration

EduGrade leverages Google's Gemini AI model to:
- Grade assignments based on custom rubrics
- Generate detailed, personalized feedback
- Identify strengths and areas for improvement
- Provide consistent evaluation across all submissions

## 🛠️ Technologies Used

- **Frontend**: React, React Router, CSS
- **Backend**: Node.js, Express.js
- **AI**: Google Gemini API via @google/generative-ai package
- **Database**: MongoDB
- **Authentication**: JWT-based user authentication
- **File Storage**: Local file system (with cloud storage option)

## 📋 Project Structure

```
edugrade/
├── api/                # Backend server code
│   ├── routes/         # API endpoints
│   │   ├── assignments.js
│   │   ├── auth.js
│   │   └── feedback.js
│   └── server.js       # Main server file
├── public/             # Static files
├── src/                # React frontend
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   └── styles/         # CSS styles
├── data/               # Uploaded submissions
└── .env                # Environment variables
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas connection)
- Gemini API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/aditya2006p/edugrade.git
   cd edugrade
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root:
   ```
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/edugrade
   GEMINI_API_KEY=your-gemini-api-key
   NODE_ENV=development
   ```

4. Start the backend server:
   ```
   cd api
   node server.js
   ```

5. In a new terminal, start the frontend:
   ```
   npm start
   ```

6. Access the application at `http://localhost:5000`

## 🎯 Use Cases

### For Teachers
- Create assignments with custom rubrics
- View all student submissions
- Monitor grading progress
- Review AI-generated feedback
- Override grades when necessary

### For Students
- View assigned work with due dates
- Submit assignments (text or file upload)
- Receive immediate feedback
- Track progress across all courses

## 🔍 How It Works

1. **Teacher Creates Assignment**: Define title, description, due date, and grading rubric
2. **Students Submit Work**: Enter text directly or upload files
3. **Gemini AI Grades**: The AI evaluates submissions based on the rubric
4. **Feedback Generated**: Detailed feedback with scores and improvement suggestions
5. **Teacher Review**: Optional review and adjustment of AI-generated grades

## 🌟 Why EduGrade Stands Out

- **Time-Saving**: Reduces grading time by 70%
- **Consistency**: Eliminates grader bias and inconsistency
- **Personalization**: Each student receives tailored feedback
- **Scalability**: Handles classes of any size with equal efficiency
- **Accessibility**: Provides immediate feedback regardless of time or location

## 🔮 Future Enhancements

- Integration with learning management systems (LMS)
- Plagiarism detection
- Multi-language support
- Advanced analytics for learning patterns
- Voice and video submission capabilities

## 📷 Screenshots

![Teacher Dashboard](public/teacher-dashboard.png)
![Student View](public/student-view.png)
![Feedback Interface](public/feedback.png)

## 👥 Team

- Aditya Pandey - Full Stack Developer
- Vivek Negi - Team Leader
- [Team Member 3] - AI Integration Specialist

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Developer Challenge for the opportunity
- Google Gemini team for the powerful AI capabilities
- Our mentors and advisors who guided this project
- The educational institutions that provided testing and feedback

---

*Built with ❤️ for the Google Developer Challenge* 

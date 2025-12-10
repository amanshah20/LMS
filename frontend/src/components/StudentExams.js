import React, { useState, useEffect } from 'react';
import { onlineExamService } from '../services/api';
import './StudentExam.css';

const StudentExams = ({ user, examFilter }) => {
  const [availableExams, setAvailableExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    loadAvailableExams();
  }, [examFilter]);

  useEffect(() => {
    if (currentExam && examQuestions.length > 0) {
      const duration = currentExam.duration * 60; // Convert minutes to seconds
      setTimeRemaining(duration);

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentExam, examQuestions]);

  const loadAvailableExams = async () => {
    try {
      setLoading(true);
      const response = await onlineExamService.getAvailableExams();
      let exams = response.data.exams || [];
      
      console.log('📚 All exams received:', exams.map(e => ({
        id: e.id,
        title: e.examTitle,
        createdByRole: e.createdByRole,
        isLocked: e.isLocked
      })));
      
      // Filter exams based on examFilter prop
      if (examFilter === 'teacher') {
        // Teacher exams (quizzes/tests) - show only exams created by teachers
        exams = exams.filter(exam => exam.createdByRole === 'teacher');
        console.log('📝 Filtered TEACHER exams:', exams.length);
      } else if (examFilter === 'admin') {
        // Admin exams (finals) - show only exams created by admins
        exams = exams.filter(exam => exam.createdByRole === 'admin');
        console.log('📋 Filtered ADMIN exams:', exams.length);
      }
      
      setAvailableExams(exams);
    } catch (err) {
      console.error('Error loading exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      // Join exam
      await onlineExamService.joinExam(examId);
      
      // Get exam questions
      const response = await onlineExamService.getExamQuestions(examId);
      setCurrentExam(response.data.exam);
      setExamQuestions(response.data.exam.questions || []);
      setAnswers({});
      setExamSubmitted(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start exam');
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmitExam = async () => {
    if (Object.keys(answers).length < examQuestions.length) {
      if (!window.confirm('You haven\'t answered all questions. Submit anyway?')) {
        return;
      }
    }

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId: parseInt(questionId),
        selectedAnswer
      }));

      const response = await onlineExamService.submitExam(currentExam.id, formattedAnswers);
      setScore(response.data.score);
      setExamSubmitted(true);
      alert(`Exam submitted successfully! Your score: ${response.data.score}/${response.data.totalMarks}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit exam');
    }
  };

  const handleAutoSubmit = async () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId: parseInt(questionId),
      selectedAnswer
    }));

    try {
      const response = await onlineExamService.submitExam(currentExam.id, formattedAnswers);
      setScore(response.data.score);
      setExamSubmitted(true);
      alert(`Time's up! Exam auto-submitted. Your score: ${response.data.score}/${response.data.totalMarks}`);
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExitExam = () => {
    if (!examSubmitted && window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      setCurrentExam(null);
      setExamQuestions([]);
      setAnswers({});
      loadAvailableExams();
    } else if (examSubmitted) {
      setCurrentExam(null);
      setExamQuestions([]);
      setAnswers({});
      loadAvailableExams();
    }
  };

  // If taking an exam, show exam interface
  if (currentExam && !examSubmitted) {
    return (
      <div className="exam-container">
        <div className="exam-header">
          <div>
            <h2>{currentExam.examTitle}</h2>
            <p>{currentExam.examDescription}</p>
            <span className="exam-info">👨‍🏫 Monitor: {currentExam.teacher.facultyName}</span>
          </div>
          <div className="timer-box">
            <span className="timer-label">Time Remaining</span>
            <span className={`timer ${timeRemaining < 300 ? 'timer-warning' : ''}`}>
              ⏱️ {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {currentExam.instructions && (
          <div className="instructions-box">
            <h4>📋 Instructions:</h4>
            <p>{currentExam.instructions}</p>
          </div>
        )}

        <div className="questions-container">
          {examQuestions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                <span className="question-marks">({question.marks} mark{question.marks > 1 ? 's' : ''})</span>
              </div>
              <p className="question-text">{question.questionText}</p>
              <div className="options">
                {['A', 'B', 'C', 'D'].map(option => (
                  <label key={option} className={`option ${answers[question.id] === option ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleAnswerSelect(question.id, option)}
                    />
                    <span className="option-letter">{option}</span>
                    <span className="option-text">{question[`option${option}`]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="exam-actions">
          <div className="progress-info">
            Answered: {Object.keys(answers).length} / {examQuestions.length}
          </div>
          <div>
            <button className="btn-secondary" onClick={handleExitExam}>
              Exit
            </button>
            <button className="btn-primary" onClick={handleSubmitExam}>
              🎯 Submit Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If exam submitted, show results
  if (examSubmitted) {
    return (
      <div className="exam-result">
        <div className="result-card">
          <h2>✅ Exam Submitted Successfully!</h2>
          <div className="score-display">
            <span className="score-label">Your Score</span>
            <span className="score-value">{score} / {currentExam.totalMarks}</span>
            <span className="score-percentage">
              {((score / currentExam.totalMarks) * 100).toFixed(1)}%
            </span>
          </div>
          <button className="btn-primary" onClick={handleExitExam}>
            Back to Exams List
          </button>
        </div>
      </div>
    );
  }

  // Show available exams list
  return (
    <div className="student-exams">
      <div className="exams-header">
        <h2>📝 Online Exams</h2>
        <p>All scheduled exams - Click "Start Exam" when available</p>
        <button className="btn-secondary" onClick={loadAvailableExams} style={{marginTop: '10px'}}>
          🔄 Refresh Exams
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading exams...</div>
      ) : availableExams.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>No exams scheduled at the moment</p>
          <small>Please check back later or contact your teacher</small>
        </div>
      ) : (
        <div className="exams-grid">
          {availableExams.map(exam => {
            const examDate = new Date(exam.examDate);
            const now = new Date();
            const isPast = examDate < now;
            const isFuture = exam.timeUntilStart > 0;
            
            return (
              <div key={exam.id} className={`exam-card ${exam.canJoin ? 'can-join' : ''} ${exam.isLocked ? 'locked' : ''}`}>
                <div className="exam-card-header">
                  <h3>{exam.examTitle}</h3>
                  <div className="status-badges">
                    {exam.isLocked && <span className="locked-badge">🔒 Locked</span>}
                    {exam.canJoin && !exam.isLocked && <span className="available-badge">✅ Available Now</span>}
                    {isFuture && <span className="upcoming-badge">⏳ Upcoming</span>}
                  </div>
                </div>
                {exam.examDescription && <p className="exam-description">{exam.examDescription}</p>}
                <div className="exam-details">
                  <div className="detail-item">
                    <span className="detail-label">👨‍🏫 Monitor:</span>
                    <span>{exam.teacher?.facultyName || 'Not Assigned'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📅 Exam Date:</span>
                    <span>{examDate.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">⏱️ Duration:</span>
                    <span>{exam.duration} minutes</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📊 Total Marks:</span>
                    <span>{exam.totalMarks}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🚪 Can Enter From:</span>
                    <span>{exam.canEnterAt || 'Check schedule'}</span>
                  </div>
                </div>
                {exam.instructions && (
                  <div className="exam-instructions">
                    <strong>📋 Instructions:</strong>
                    <p>{exam.instructions}</p>
                  </div>
                )}
                <div className="exam-card-footer">
                  <button
                    className="btn-primary"
                    onClick={() => handleStartExam(exam.id)}
                    disabled={exam.isLocked || !exam.canJoin}
                  >
                    {exam.isLocked 
                      ? '🔒 Exam Locked by Teacher' 
                      : exam.canJoin 
                        ? '▶️ Start Exam Now' 
                        : isFuture
                          ? '⏳ Not Yet Available (Wait for teacher to unlock)'
                          : '⚠️ Exam Time Passed'}
                  </button>
                  {!exam.canJoin && !exam.isLocked && isFuture && (
                    <small className="hint-text">
                      💡 Exam will be available 20 minutes before scheduled time
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentExams;

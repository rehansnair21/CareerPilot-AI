import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  X,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen,
  RotateCcw,
  Loader2,
  Check,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentQuizModal = ({ isOpen, onClose, quiz, courseId, onQuizSubmitted, onQuizCompleted }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIndex]: selectedOptionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null); // Evaluated response from backend
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setQuizResult(null);
      setError(null);
    }
  }, [isOpen, quiz]);

  if (!isOpen || !quiz) return null;

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(userAnswers).length;

  const handleSelectOption = (optionIdx) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIdx,
    }));
  };

  const notifyCompletion = (resultData) => {
    if (onQuizSubmitted) onQuizSubmitted(resultData);
    if (onQuizCompleted) onQuizCompleted(resultData);
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const formattedAnswers = Object.entries(userAnswers).map(([qIdx, optIdx]) => ({
        questionIndex: Number(qIdx),
        selectedOptionIndex: Number(optIdx),
      }));

      const res = await api.post(`/student/courses/${courseId}/quizzes/${quiz._id}/submit`, {
        userAnswers: formattedAnswers,
      });

      if (res.data && res.data.success) {
        setQuizResult(res.data.data);
        notifyCompletion(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to evaluate quiz submission.');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A0307]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#9FB2AC] shadow-2xl animate-scaleUp my-auto">
        {/* Modal Header */}
        <header className="bg-[#5D0D1A] text-[#FFF9EB] px-6 py-4 flex items-center justify-between border-b border-[#7A1424] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF9EB]/10 flex items-center justify-center border border-[#FFF9EB]/20 shrink-0 text-[#FFF9EB]">
              <HelpCircle size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#FFF9EB]/70 uppercase tracking-wider">
                Module Quiz • Knowledge Check
              </div>
              <h2 className="text-lg font-black text-[#FFF9EB] leading-snug">{quiz.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FFF9EB]/10 hover:bg-[#FFF9EB]/20 text-[#FFF9EB] transition-all shrink-0"
          >
            <X size={20} />
          </button>
        </header>

        {/* ----------------------------------------------------
            A. QUIZ QUESTIONS RUNNER (Before Submission)
        ---------------------------------------------------- */}
        {!quizResult ? (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
            {/* Progress Header & Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#5D0D1A]">
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-[#4A5D57]">
                  {answeredCount} of {questions.length} Answered
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/50">
                <div
                  className="h-full bg-[#5D0D1A] transition-all duration-300 rounded-full"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Message if submit fails */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Active Question Display */}
            {currentQuestion ? (
              <div className="space-y-6 my-auto">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF9EB] text-[#5D0D1A] text-[11px] font-black border border-[#9FB2AC]">
                      {currentQuestion.marks || 1} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-black text-[#5D0D1A] leading-snug">
                    {currentQuestion.questionText}
                  </h3>
                </div>

                {/* Option Choice Buttons */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, optIdx) => {
                    const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs md:text-sm font-semibold transition-all duration-200 flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-md shadow-[#5D0D1A]/20 scale-[1.01]'
                            : 'bg-[#FFF9EB]/60 text-[#2D060D] border-[#9FB2AC] hover:bg-[#FFF9EB] hover:border-[#5D0D1A]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              isSelected
                                ? 'bg-[#FFF9EB] text-[#5D0D1A] border-[#FFF9EB]'
                                : 'bg-white text-[#5D0D1A] border-[#9FB2AC]'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{option}</span>
                        </div>
                        {isSelected && <Check size={18} className="shrink-0 text-[#FFF9EB]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-[#4A5D57] py-8">No questions found in this quiz.</div>
            )}

            {/* Bottom Nav Controls */}
            <div className="pt-6 border-t border-[#9FB2AC]/40 flex items-center justify-between shrink-0">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2.5 rounded-xl bg-white text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting || answeredCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                  <span>Submit Quiz ({answeredCount}/{questions.length})</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold shadow-xs hover:bg-[#7A1424] flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------
              B. POST-SUBMISSION RESULTS & EXPLANATIONS VIEW
          ---------------------------------------------------- */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
            {/* Score Overview Card */}
            <div className="bg-gradient-to-br from-[#5D0D1A] to-[#420912] rounded-[24px] p-6 text-[#FFF9EB] text-center space-y-4 shadow-xl border border-[#7A1424]">
              <div className="w-16 h-16 rounded-full bg-[#FFF9EB]/15 flex items-center justify-center mx-auto border border-[#FFF9EB]/30 text-[#FFF9EB]">
                <Award size={36} />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-[#FFF9EB] text-[#5D0D1A] text-xs font-black uppercase tracking-wider">
                  {quizResult.passed ? 'Quiz Passed!' : 'Quiz Complete'}
                </span>
                <h3 className="text-3xl font-black text-[#FFF9EB] tracking-tight pt-2">
                  {quizResult.totalScore} / {quizResult.maxScore} Marks
                </h3>
                <p className="text-sm font-bold text-[#FFF9EB]/80">
                  Overall Score: {quizResult.percentage}%
                </p>
              </div>
            </div>

            {/* Question-by-Question Detailed Feedback & Explanations */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-[#5D0D1A] uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} />
                <span>Question Explanations & Results</span>
              </h4>

              <div className="space-y-4">
                {quizResult.detailedFeedback?.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-5 border shadow-2xs space-y-3 transition-all ${
                      item.isCorrect
                        ? 'bg-emerald-50/80 border-emerald-300'
                        : 'bg-red-50/80 border-red-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {item.isCorrect ? (
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-red-600 shrink-0" />
                        )}
                        <h5 className="text-xs font-extrabold text-[#5D0D1A]">
                          Question {idx + 1}: {item.questionText}
                        </h5>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-[#9FB2AC]/50 shrink-0">
                        {item.marksObtained} / {item.marks} Marks
                      </span>
                    </div>

                    {/* Options list with correct / incorrect badges */}
                    <div className="space-y-1.5 pl-6">
                      {item.options?.map((opt, optIdx) => {
                        const isSelected = item.selectedOptionIndex === optIdx;
                        const isCorrectOpt = item.correctOptionIndex === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                              isCorrectOpt
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold'
                                : isSelected
                                ? 'bg-red-100 text-red-950 border-red-400 font-bold'
                                : 'bg-white text-[#4A5D57] border-[#9FB2AC]/40'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-white text-[#5D0D1A] text-[10px] font-bold flex items-center justify-center border border-[#9FB2AC]">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              {opt}
                            </span>

                            {isCorrectOpt && (
                              <span className="text-[10px] font-black uppercase text-emerald-800 px-2 py-0.5 rounded bg-emerald-200">
                                Correct Answer
                              </span>
                            )}
                            {isSelected && !isCorrectOpt && (
                              <span className="text-[10px] font-bold uppercase text-red-800 px-2 py-0.5 rounded bg-red-200">
                                Your Selection
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed Mentor Explanation Box */}
                    <div className="bg-[#FFF9EB] p-3.5 rounded-xl border border-amber-300 text-xs text-[#2D060D] space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 font-extrabold text-[#5D0D1A] uppercase text-[10px]">
                        <Lightbulb size={14} className="text-[#5D0D1A]" />
                        <span>Mentor Explanation:</span>
                      </div>
                      <p className="font-medium leading-relaxed pl-5">{item.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-[#9FB2AC]/40 flex items-center justify-between shrink-0">
              <button
                onClick={handleRetakeQuiz}
                className="px-4 py-2.5 rounded-xl bg-[#FFF9EB] hover:bg-[#5D0D1A] hover:text-[#FFF9EB] text-[#5D0D1A] text-xs font-bold border border-[#9FB2AC] flex items-center gap-2 transition-all"
              >
                <RotateCcw size={15} />
                <span>Retake Quiz</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:bg-[#7A1424]"
              >
                Close & Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Sparkles,
  Camera,
  Layers,
  Filter,
  Globe,
  Target,
  CheckSquare,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  Lightbulb,
  Info,
  Award,
  ChevronDown,
  ChevronRight,
  FileCode,
  Upload,
  FileType,
  Paperclip,
  RefreshCw,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_OPTIONS = [
  'Software Development',
  'Data Science & Analytics',
  'AI / Machine Learning',
  'Cloud & DevOps',
  'Cybersecurity',
  'UI/UX Design',
  'Career & Interview Prep',
];

const DIFFICULTY_OPTIONS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Mandarin', 'Other'];

// Helper to render Markdown / Rich Text content into styled JSX
const renderFormattedLessonContent = (rawText) => {
  if (!rawText) return <p className="text-gray-400 italic">No content provided.</p>;

  const lines = rawText.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';
  let inTable = false;
  let tableRows = [];

  const flushCodeBlock = (key) => {
    elements.push(
      <div key={key} className="my-4 rounded-xl overflow-hidden border border-[#5D0D1A]/30 shadow-md">
        <div className="bg-[#2D060D] px-4 py-2 text-[11px] font-mono font-bold text-amber-300 flex items-center justify-between border-b border-amber-900/40">
          <span className="flex items-center gap-1.5 uppercase">
            <FileCode size={14} />
            {codeLang || 'CODE'}
          </span>
          <span className="text-[10px] text-amber-400/70">Text-Based Code Block</span>
        </div>
        <pre className="bg-[#1A0307] text-[#FFF9EB] p-4 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre font-medium">
          {codeBuffer.join('\n')}
        </pre>
      </div>
    );
    codeBuffer = [];
    codeLang = '';
  };

  const flushTable = (key) => {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const body = tableRows.slice(1).filter((r) => !r.every((cell) => cell.includes('---')));

    elements.push(
      <div key={key} className="my-4 overflow-x-auto rounded-2xl border border-[#9FB2AC] shadow-2xs">
        <table className="w-full text-xs text-left text-[#5D0D1A] border-collapse">
          {header && (
            <thead className="bg-[#FFF9EB] font-extrabold uppercase text-[11px] border-b border-[#9FB2AC]">
              <tr>
                {header.map((cell, idx) => (
                  <th key={idx} className="px-4 py-2.5 border-r border-[#9FB2AC]/50 last:border-r-0">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-[#9FB2AC]/40 last:border-b-0 hover:bg-[#FFF9EB]/50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2.5 font-medium border-r border-[#9FB2AC]/30 last:border-r-0">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock(`code-${i}`);
      } else {
        inCodeBlock = true;
        codeLang = line.trim().replace('```', '');
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cells = line.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      inTable = false;
      flushTable(`table-${i}`);
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl md:text-2xl font-extrabold text-[#5D0D1A] mt-6 mb-3 tracking-tight border-b border-[#9FB2AC]/40 pb-2">
          {line.replace('# ', '')}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg md:text-xl font-extrabold text-[#5D0D1A] mt-5 mb-2 tracking-tight">
          {line.replace('## ', '')}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-[#5D0D1A] mt-4 mb-2">
          {line.replace('### ', '')}
        </h3>
      );
      continue;
    }

    if (line.startsWith('> 💡') || line.toLowerCase().includes('example:')) {
      elements.push(
        <div key={`example-${i}`} className="my-3 p-4 rounded-2xl bg-cyan-50/80 border border-cyan-300 text-cyan-950 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 font-extrabold text-xs text-cyan-900 uppercase">
            <Lightbulb size={16} className="text-cyan-700" />
            <span>Example Callout</span>
          </div>
          <p className="text-xs font-medium leading-relaxed">{line.replace(/^>\s*/, '').replace(/💡\s*\*\*Example:\*\*/i, '')}</p>
        </div>
      );
      continue;
    }

    if (line.startsWith('> 📌') || line.toLowerCase().includes('note:')) {
      elements.push(
        <div key={`note-${i}`} className="my-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-900 uppercase">
            <Info size={16} className="text-amber-700" />
            <span>Important Note</span>
          </div>
          <p className="text-xs font-medium leading-relaxed">{line.replace(/^>\s*/, '').replace(/📌\s*\*\*Note:\*\*/i, '')}</p>
        </div>
      );
      continue;
    }

    if (line.startsWith('> 🎯') || line.toLowerCase().includes('key takeaway')) {
      elements.push(
        <div key={`takeaway-${i}`} className="my-3 p-4 rounded-2xl bg-[#FFF9EB] border-2 border-[#5D0D1A] text-[#5D0D1A] shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 font-extrabold text-xs uppercase">
            <Award size={16} className="text-[#5D0D1A]" />
            <span>Key Takeaways</span>
          </div>
          <p className="text-xs font-bold leading-relaxed">{line.replace(/^>\s*/, '').replace(/🎯\s*\*\*Key Takeaways:\*\*/i, '')}</p>
        </div>
      );
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={`ul-${i}`} className="ml-5 list-disc text-xs font-medium text-[#2D060D] my-1 leading-relaxed">
          {line.trim().substring(2)}
        </li>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      elements.push(
        <li key={`ol-${i}`} className="ml-5 list-decimal text-xs font-medium text-[#2D060D] my-1 leading-relaxed">
          {line.trim().replace(/^\d+\.\s/, '')}
        </li>
      );
      continue;
    }

    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-xs font-medium text-[#2D060D] leading-relaxed my-2">
        {line}
      </p>
    );
  }

  if (inTable) {
    flushTable(`table-end`);
  }
  if (inCodeBlock) {
    flushCodeBlock(`code-end`);
  }

  return <div className="space-y-1 text-[#2D060D]">{elements}</div>;
};

// Format byte file size to readable string
const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const MentorCourses = ({ onCoursesUpdated }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  // Delete Course Confirmation Modal State
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ================= MODULE MANAGEMENT STATE =================
  const [activeModuleCourse, setActiveModuleCourse] = useState(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Add / Edit Module Modal State
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleFormState, setModuleFormState] = useState({ title: '', description: '' });
  const [moduleSaving, setModuleSaving] = useState(false);

  // Delete Module Confirmation State
  const [deletingModule, setDeletingModule] = useState(null);
  const [isDeletingModule, setIsDeletingModule] = useState(false);

  // ================= LESSON MANAGEMENT STATE =================
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [moduleLessonsMap, setModuleLessonsMap] = useState({});
  const [lessonsLoadingMap, setLessonsLoadingMap] = useState({});

  // Lesson Editor Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [targetModuleForLesson, setTargetModuleForLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonFormState, setLessonFormState] = useState({ title: '', content: '', duration: '10 min' });
  const [lessonTab, setLessonTab] = useState('write');
  const [lessonSaving, setLessonSaving] = useState(false);

  // Delete Lesson Confirmation State
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  // ================= PDF RESOURCE MANAGEMENT STATE =================
  const [activePDFCourse, setActivePDFCourse] = useState(null);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfResources, setPdfResources] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Add / Edit / Replace PDF Form State
  const [isPDFFormOpen, setIsPDFFormOpen] = useState(false);
  const [editingPDF, setEditingPDF] = useState(null);
  const [pdfFormState, setPdfFormState] = useState({
    title: '',
    description: '',
    moduleId: '',
    lessonId: '',
  });
  const [selectedPDFFile, setSelectedPDFFile] = useState(null);
  const [pdfBase64Data, setPdfBase64Data] = useState('');
  const [pdfSaving, setPdfSaving] = useState(false);

  // Modules & Lessons option lists for PDF assignment
  const [pdfModulesList, setPdfModulesList] = useState([]);
  const [pdfLessonsList, setPdfLessonsList] = useState([]);

  // Delete PDF Confirmation State
  const [deletingPDF, setDeletingPDF] = useState(null);
  const [isDeletingPDF, setIsDeletingPDF] = useState(false);

  // ================= TEXT RESOURCE MANAGEMENT STATE =================
  const [activeTextCourse, setActiveTextCourse] = useState(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textResources, setTextResources] = useState([]);
  const [textLoading, setTextLoading] = useState(false);

  // Add / Edit Text Resource Form State
  const [isTextFormOpen, setIsTextFormOpen] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const [textFormState, setTextFormState] = useState({
    title: '',
    description: '',
    type: 'reference_link',
    url: '',
    content: '',
    moduleId: '',
    lessonId: '',
  });
  const [textSaving, setTextSaving] = useState(false);
  const [textModulesList, setTextModulesList] = useState([]);
  const [textLessonsList, setTextLessonsList] = useState([]);

  // Delete Text Resource Confirmation State
  const [deletingText, setDeletingText] = useState(null);
  const [isDeletingText, setIsDeletingText] = useState(false);

  // ================= QUIZ MANAGEMENT STATE =================
  const [activeQuizCourse, setActiveQuizCourse] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);

  // Add / Edit Quiz Form State
  const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizFormState, setQuizFormState] = useState({
    title: '',
    description: '',
    moduleId: '',
    status: 'draft',
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        marks: 1,
      },
    ],
  });
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizModulesList, setQuizModulesList] = useState([]);

  // Delete Quiz Confirmation State
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  // Course Preview Modal State
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    loading: false,
    courseData: null,
    expandedModules: {},
    activeLesson: null,
    activeNote: null,
    activePDF: null,
    activeQuiz: null,
  });

  const fileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);
  const replacePdfFileInputRef = useRef(null);
  const lessonTextareaRef = useRef(null);

  // Course Form State
  const [formState, setFormState] = useState({
    title: '',
    shortDescription: '',
    thumbnail: '',
    category: 'Software Development',
    skills: [],
    learningObjectives: [],
    prerequisites: [],
    difficulty: 'All Levels',
    duration: '4 Weeks',
    language: 'English',
    priceType: 'Free',
    price: 0,
    status: 'draft',
  });

  const [saving, setSaving] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newObjectiveInput, setNewObjectiveInput] = useState('');
  const [newPrerequisiteInput, setNewPrerequisiteInput] = useState('');

  // Fetch mentor's courses from backend API
  const fetchCourses = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.get('/mentor/courses');
      if (res.data && res.data.success) {
        setCourses(res.data.data.courses || []);
      } else {
        setError(res.data?.message || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching mentor courses:', err);
      setError(err.response?.data?.message || 'Failed to connect to course service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(true);
  }, [fetchCourses]);

  // Open modal for Create New Course
  const handleOpenCreateModal = () => {
    setEditingCourseId(null);
    setFormState({
      title: '',
      shortDescription: '',
      thumbnail: '',
      category: 'Software Development',
      skills: [],
      learningObjectives: [],
      prerequisites: [],
      difficulty: 'All Levels',
      duration: '4 Weeks',
      language: 'English',
      priceType: 'Free',
      price: 0,
      status: 'draft',
    });
    setNewSkillInput('');
    setNewObjectiveInput('');
    setNewPrerequisiteInput('');
    setIsModalOpen(true);
  };

  // Open modal for Edit Course
  const handleOpenEditModal = (course) => {
    setEditingCourseId(course._id);
    setFormState({
      title: course.title || '',
      shortDescription: course.shortDescription || course.description || course.detailedDescription || '',
      thumbnail: course.thumbnail || '',
      category: course.category || 'Software Development',
      skills: Array.isArray(course.skills) ? [...course.skills] : [],
      learningObjectives: Array.isArray(course.learningObjectives) ? [...course.learningObjectives] : [],
      prerequisites: Array.isArray(course.prerequisites) ? [...course.prerequisites] : [],
      difficulty: course.difficulty || 'All Levels',
      duration: course.duration || '4 Weeks',
      language: course.language || 'English',
      priceType: course.priceType || (course.price > 0 ? 'Paid' : 'Free'),
      price: course.price || 0,
      status: course.status || 'draft',
    });
    setNewSkillInput('');
    setNewObjectiveInput('');
    setNewPrerequisiteInput('');
    setIsModalOpen(true);
  };

  // Thumbnail Image Upload Handler
  const handleThumbnailUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Thumbnail image size must be less than 3 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormState((prev) => ({ ...prev, thumbnail: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Skills tag manager
  const handleAddSkill = (skillToAdd) => {
    const target = (skillToAdd || newSkillInput).trim();
    if (!target) return;
    if (formState.skills.some((s) => s.toLowerCase() === target.toLowerCase())) {
      setNewSkillInput('');
      return;
    }
    setFormState((prev) => ({ ...prev, skills: [...prev.skills, target] }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (indexToRemove) => {
    setFormState((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Learning Objectives manager
  const handleAddLearningObjective = () => {
    const target = newObjectiveInput.trim();
    if (!target) return;
    setFormState((prev) => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, target],
    }));
    setNewObjectiveInput('');
  };

  const handleRemoveLearningObjective = (indexToRemove) => {
    setFormState((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Prerequisites manager
  const handleAddPrerequisite = () => {
    const target = newPrerequisiteInput.trim();
    if (!target) return;
    setFormState((prev) => ({
      ...prev,
      prerequisites: [...prev.prerequisites, target],
    }));
    setNewPrerequisiteInput('');
  };

  const handleRemovePrerequisite = (indexToRemove) => {
    setFormState((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Save Course (Create or Update)
  const handleSaveCourse = async (e) => {
    if (e) e.preventDefault();
    const titleVal = formState.title.trim();
    const shortDescVal = formState.shortDescription.trim();

    if (!titleVal) {
      alert('Please provide a course title');
      return;
    }
    if (!shortDescVal) {
      alert('Please provide a description for the course');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: titleVal,
        shortDescription: shortDescVal,
        detailedDescription: shortDescVal,
        description: shortDescVal,
        thumbnail: formState.thumbnail,
        category: formState.category,
        skills: formState.skills,
        learningObjectives: formState.learningObjectives,
        prerequisites: formState.prerequisites,
        difficulty: formState.difficulty,
        duration: formState.duration,
        language: formState.language,
        priceType: formState.priceType,
        price: formState.priceType === 'Paid' ? Math.max(0, Number(formState.price) || 0) : 0,
        status: formState.status,
      };

      let res;
      if (editingCourseId) {
        res = await api.put(`/mentor/courses/${editingCourseId}`, payload);
      } else {
        res = await api.post('/mentor/courses', payload);
      }

      if (res.data && res.data.success) {
        setSuccessMsg(
          editingCourseId
            ? 'Course updated successfully!'
            : `Course successfully created and saved as ${payload.status === 'draft' ? 'Draft' : 'Published'}!`
        );
        setIsModalOpen(false);
        fetchCourses();
        if (onCoursesUpdated) onCoursesUpdated();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(res.data?.message || 'Failed to save course');
      }
    } catch (err) {
      console.error('Save course error:', err);
      alert(err.response?.data?.message || 'Failed to save course to server');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Published / Draft Status
  const handleToggleStatus = async (course) => {
    try {
      const targetStatus = course.status === 'published' ? 'draft' : 'published';
      const res = await api.patch(`/mentor/courses/${course._id}/status`, { status: targetStatus });
      if (res.data && res.data.success) {
        const newStatus = res.data.data.status || targetStatus;
        setCourses((prev) =>
          prev.map((c) => (c._id === course._id ? { ...c, status: newStatus } : c))
        );
        setSuccessMsg(`Course status updated to ${newStatus}`);
        setTimeout(() => setSuccessMsg(null), 3000);
        if (onCoursesUpdated) onCoursesUpdated();
      }
    } catch (err) {
      console.error('Error toggling course status:', err);
      alert(err.response?.data?.message || 'Failed to update course status');
    }
  };

  // Delete Course
  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/mentor/courses/${deletingCourse._id}`);
      if (res.data && res.data.success) {
        setSuccessMsg(`Course "${deletingCourse.title}" deleted successfully`);
        setDeletingCourse(null);
        fetchCourses();
        if (onCoursesUpdated) onCoursesUpdated();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      alert(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  // ================= MODULE MANAGEMENT HANDLERS =================

  // Fetch modules for active course
  const fetchModules = useCallback(async (courseId) => {
    setModulesLoading(true);
    try {
      const res = await api.get(`/mentor/courses/${courseId}/modules`);
      if (res.data && res.data.success) {
        const fetchedMods = res.data.data.modules || [];
        setModules(fetchedMods);
        fetchedMods.forEach((m) => {
          fetchLessonsForModule(courseId, m._id);
        });
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    } finally {
      setModulesLoading(false);
    }
  }, []);

  // Open Module Management Modal
  const handleOpenModuleModal = (course) => {
    setActiveModuleCourse(course);
    setIsModuleModalOpen(true);
    fetchModules(course._id);
  };

  // Open Add Module Form Modal
  const handleOpenAddModuleForm = () => {
    setEditingModule(null);
    setModuleFormState({ title: '', description: '' });
    setIsModuleFormOpen(true);
  };

  // Open Edit Module Form Modal
  const handleOpenEditModuleForm = (mod) => {
    setEditingModule(mod);
    setModuleFormState({ title: mod.title || '', description: mod.description || '' });
    setIsModuleFormOpen(true);
  };

  // Save Module (Add or Update)
  const handleSaveModule = async (e) => {
    if (e) e.preventDefault();
    if (!moduleFormState.title.trim()) {
      alert('Module title is required');
      return;
    }

    if (!activeModuleCourse) return;

    setModuleSaving(true);
    try {
      let res;
      if (editingModule) {
        res = await api.put(
          `/mentor/courses/${activeModuleCourse._id}/modules/${editingModule._id}`,
          moduleFormState
        );
      } else {
        res = await api.post(`/mentor/courses/${activeModuleCourse._id}/modules`, {
          ...moduleFormState,
          order: modules.length + 1,
        });
      }

      if (res.data && res.data.success) {
        setIsModuleFormOpen(false);
        fetchModules(activeModuleCourse._id);
        fetchCourses();
      } else {
        alert(res.data?.message || 'Failed to save module');
      }
    } catch (err) {
      console.error('Error saving module:', err);
      alert(err.response?.data?.message || 'Failed to save module');
    } finally {
      setModuleSaving(false);
    }
  };

  // Delete Module
  const handleDeleteModule = async () => {
    if (!deletingModule || !activeModuleCourse) return;
    setIsDeletingModule(true);
    try {
      const res = await api.delete(
        `/mentor/courses/${activeModuleCourse._id}/modules/${deletingModule._id}`
      );
      if (res.data && res.data.success) {
        setDeletingModule(null);
        fetchModules(activeModuleCourse._id);
        fetchCourses();
      }
    } catch (err) {
      console.error('Error deleting module:', err);
      alert(err.response?.data?.message || 'Failed to delete module');
    } finally {
      setIsDeletingModule(false);
    }
  };

  // Move Module Up or Down (Reorder)
  const handleMoveModule = async (index, direction) => {
    if (!activeModuleCourse) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const newModules = [...modules];
    const temp = newModules[index];
    newModules[index] = newModules[targetIndex];
    newModules[targetIndex] = temp;

    const reorderedPayload = newModules.map((m, idx) => ({
      _id: m._id,
      order: idx + 1,
    }));

    setModules(newModules.map((m, idx) => ({ ...m, order: idx + 1 })));

    try {
      await api.put(`/mentor/courses/${activeModuleCourse._id}/modules/reorder`, {
        modules: reorderedPayload,
      });
    } catch (err) {
      console.error('Error reordering modules:', err);
      fetchModules(activeModuleCourse._id);
    }
  };

  // ================= LESSON MANAGEMENT HANDLERS =================

  // Fetch lessons for a specific module
  const fetchLessonsForModule = async (courseId, moduleId) => {
    setLessonsLoadingMap((prev) => ({ ...prev, [moduleId]: true }));
    try {
      const res = await api.get(`/mentor/courses/${courseId}/modules/${moduleId}/lessons`);
      if (res.data && res.data.success) {
        setModuleLessonsMap((prev) => ({
          ...prev,
          [moduleId]: res.data.data.lessons || [],
        }));
      }
    } catch (err) {
      console.error(`Error fetching lessons for module ${moduleId}:`, err);
    } finally {
      setLessonsLoadingMap((prev) => ({ ...prev, [moduleId]: false }));
    }
  };

  // Toggle Module Lessons Expansion
  const handleToggleExpandModule = (moduleId) => {
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
    } else {
      setExpandedModuleId(moduleId);
      if (activeModuleCourse) {
        fetchLessonsForModule(activeModuleCourse._id, moduleId);
      }
    }
  };

  // Open Add Lesson Modal
  const handleOpenAddLessonModal = (mod) => {
    setTargetModuleForLesson(mod);
    setEditingLesson(null);
    setLessonFormState({
      title: '',
      content: `# Lesson Introduction\n\nProvide clear text explanation of concepts here...\n\n### Key Concepts\n- Concept 1\n- Concept 2\n\n> 💡 **Example:**\n> Sample code or practical demonstration.\n\n> 🎯 **Key Takeaways:**\n> - Takeaway 1\n> - Takeaway 2`,
      duration: '10 min',
    });
    setLessonTab('write');
    setIsLessonModalOpen(true);
  };

  // Open Edit Lesson Modal
  const handleOpenEditLessonModal = (mod, les) => {
    setTargetModuleForLesson(mod);
    setEditingLesson(les);
    setLessonFormState({
      title: les.title || '',
      content: les.content || '',
      duration: les.duration || '10 min',
    });
    setLessonTab('write');
    setIsLessonModalOpen(true);
  };

  // Insert Rich Text Formatting Snippet
  const handleInsertFormat = (formatType) => {
    const textarea = lessonTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = lessonFormState.content;
    const selectedText = text.substring(start, end);

    let snippet = '';

    switch (formatType) {
      case 'h1':
        snippet = `\n# ${selectedText || 'Heading 1'}\n`;
        break;
      case 'h2':
        snippet = `\n## ${selectedText || 'Heading 2'}\n`;
        break;
      case 'h3':
        snippet = `\n### ${selectedText || 'Heading 3'}\n`;
        break;
      case 'bold':
        snippet = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        snippet = `*${selectedText || 'italic text'}*`;
        break;
      case 'bullet':
        snippet = `\n- ${selectedText || 'List item 1'}\n- List item 2\n`;
        break;
      case 'number':
        snippet = `\n1. ${selectedText || 'First item'}\n2. Second item\n`;
        break;
      case 'link':
        snippet = `[${selectedText || 'Link Title'}](https://example.com)`;
        break;
      case 'image':
        snippet = `![${selectedText || 'Image Description'}](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800)`;
        break;
      case 'table':
        snippet = `\n| Topic | Description | Output |\n| :--- | :--- | :--- |\n| Topic 1 | Explanation | Result 1 |\n| Topic 2 | Explanation | Result 2 |\n`;
        break;
      case 'code':
        snippet = `\n\`\`\`javascript\n// Text-based Code Snippet\nfunction example() {\n  console.log("CareerPilot AI Text Lesson");\n}\n\`\`\`\n`;
        break;
      case 'example':
        snippet = `\n> 💡 **Example:**\n> ${selectedText || 'Write a practical text example here.'}\n`;
        break;
      case 'note':
        snippet = `\n> 📌 **Note:**\n> ${selectedText || 'Important note for students to remember.'}\n`;
        break;
      case 'takeaway':
        snippet = `\n> 🎯 **Key Takeaways:**\n> - ${selectedText || 'Key takeaway 1'}\n> - Key takeaway 2\n`;
        break;
      default:
        break;
    }

    const newContent = text.substring(0, start) + snippet + text.substring(end);
    setLessonFormState((prev) => ({ ...prev, content: newContent }));
  };

  // Save Lesson
  const handleSaveLesson = async (e) => {
    if (e) e.preventDefault();
    if (!lessonFormState.title.trim()) {
      alert('Lesson title is required');
      return;
    }
    if (!activeModuleCourse || !targetModuleForLesson) return;

    setLessonSaving(true);
    try {
      const currentLessons = moduleLessonsMap[targetModuleForLesson._id] || [];
      let res;

      if (editingLesson) {
        res = await api.put(
          `/mentor/courses/${activeModuleCourse._id}/modules/${targetModuleForLesson._id}/lessons/${editingLesson._id}`,
          lessonFormState
        );
      } else {
        res = await api.post(
          `/mentor/courses/${activeModuleCourse._id}/modules/${targetModuleForLesson._id}/lessons`,
          {
            ...lessonFormState,
            order: currentLessons.length + 1,
          }
        );
      }

      if (res.data && res.data.success) {
        setIsLessonModalOpen(false);
        fetchLessonsForModule(activeModuleCourse._id, targetModuleForLesson._id);
      } else {
        alert(res.data?.message || 'Failed to save lesson');
      }
    } catch (err) {
      console.error('Error saving lesson:', err);
      alert(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setLessonSaving(false);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async () => {
    if (!deletingLesson || !activeModuleCourse || !targetModuleForLesson) return;
    setIsDeletingLesson(true);
    try {
      const res = await api.delete(
        `/mentor/courses/${activeModuleCourse._id}/modules/${targetModuleForLesson._id}/lessons/${deletingLesson._id}`
      );
      if (res.data && res.data.success) {
        setDeletingLesson(null);
        fetchLessonsForModule(activeModuleCourse._id, targetModuleForLesson._id);
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
      alert(err.response?.data?.message || 'Failed to delete lesson');
    } finally {
      setIsDeletingLesson(false);
    }
  };

  // Move Lesson Up or Down (Reorder)
  const handleMoveLesson = async (modId, index, direction) => {
    if (!activeModuleCourse) return;
    const currentLessons = moduleLessonsMap[modId] || [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentLessons.length) return;

    const newLessons = [...currentLessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    const reorderedPayload = newLessons.map((l, idx) => ({
      _id: l._id,
      order: idx + 1,
    }));

    setModuleLessonsMap((prev) => ({
      ...prev,
      [modId]: newLessons.map((l, idx) => ({ ...l, order: idx + 1 })),
    }));

    try {
      await api.put(
        `/mentor/courses/${activeModuleCourse._id}/modules/${modId}/lessons/reorder`,
        { lessons: reorderedPayload }
      );
    } catch (err) {
      console.error('Error reordering lessons:', err);
      fetchLessonsForModule(activeModuleCourse._id, modId);
    }
  };

  // ================= PDF RESOURCE MANAGEMENT HANDLERS =================

  // Fetch PDF Resources for a course
  const fetchPDFResources = useCallback(async (courseId) => {
    setPdfLoading(true);
    try {
      const res = await api.get(`/mentor/courses/${courseId}/pdf-resources`);
      if (res.data && res.data.success) {
        setPdfResources(res.data.data.pdfResources || []);
      }
    } catch (err) {
      console.error('Error fetching PDF resources:', err);
    } finally {
      setPdfLoading(false);
    }
  }, []);

  // Fetch Modules for PDF selection
  const fetchPDFModules = useCallback(async (courseId) => {
    try {
      const res = await api.get(`/mentor/courses/${courseId}/modules`);
      if (res.data && res.data.success) {
        setPdfModulesList(res.data.data.modules || []);
      }
    } catch (err) {
      console.error('Error fetching PDF modules:', err);
    }
  }, []);

  // Fetch Lessons for selected Module in PDF form
  const fetchPDFLessonsForModule = async (courseId, moduleId) => {
    if (!moduleId) {
      setPdfLessonsList([]);
      return;
    }
    try {
      const res = await api.get(`/mentor/courses/${courseId}/modules/${moduleId}/lessons`);
      if (res.data && res.data.success) {
        setPdfLessonsList(res.data.data.lessons || []);
      }
    } catch (err) {
      console.error('Error fetching lessons for PDF module:', err);
      setPdfLessonsList([]);
    }
  };

  // Open PDF Resource Manager Modal
  const handleOpenPDFModal = (course) => {
    setActivePDFCourse(course);
    setIsPDFModalOpen(true);
    fetchPDFResources(course._id);
    fetchPDFModules(course._id);
  };

  // Open Upload PDF Form Modal
  const handleOpenUploadPDFModal = () => {
    setEditingPDF(null);
    setSelectedPDFFile(null);
    setPdfBase64Data('');
    const defaultModId = pdfModulesList[0]?._id || '';
    setPdfFormState({
      title: '',
      description: '',
      moduleId: defaultModId,
      lessonId: '',
    });
    if (defaultModId && activePDFCourse) {
      fetchPDFLessonsForModule(activePDFCourse._id, defaultModId);
    }
    setIsPDFFormOpen(true);
  };

  // Open Edit / Replace PDF Form Modal
  const handleOpenEditPDFModal = (pdf) => {
    setEditingPDF(pdf);
    setSelectedPDFFile(null);
    setPdfBase64Data('');
    const modId = pdf.moduleId?._id || pdf.moduleId || '';
    const lesId = pdf.lessonId?._id || pdf.lessonId || '';
    setPdfFormState({
      title: pdf.title || '',
      description: pdf.description || '',
      moduleId: modId,
      lessonId: lesId,
    });
    if (modId && activePDFCourse) {
      fetchPDFLessonsForModule(activePDFCourse._id, modId);
    }
    setIsPDFFormOpen(true);
  };

  // PDF File Selection Handler
  const handlePDFFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.pdf$/i) && file.type !== 'application/pdf') {
      alert('Only PDF documents (.pdf) are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('PDF file size must be less than 10 MB.');
      return;
    }

    setSelectedPDFFile(file);

    // Also read as Base64 string for reliable cross-env transport
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result.split(',')[1] || reader.result;
      setPdfBase64Data(base64Str);
    };
    reader.readAsDataURL(file);

    // Auto-fill PDF title if empty
    if (!pdfFormState.title) {
      const nameWithoutExt = file.name.replace(/\.pdf$/i, '');
      setPdfFormState((prev) => ({ ...prev, title: nameWithoutExt }));
    }
  };

  // Handle Module Select Change in PDF Form
  const handlePDFModuleChange = (newModId) => {
    setPdfFormState((prev) => ({ ...prev, moduleId: newModId, lessonId: '' }));
    if (activePDFCourse && newModId) {
      fetchPDFLessonsForModule(activePDFCourse._id, newModId);
    } else {
      setPdfLessonsList([]);
    }
  };

  // Save PDF Resource (Upload or Update/Replace)
  const handleSavePDFResource = async (e) => {
    if (e) e.preventDefault();
    if (!pdfFormState.title.trim()) {
      alert('PDF title is required');
      return;
    }
    if (!pdfFormState.moduleId) {
      alert('Module selection is required');
      return;
    }
    if (!editingPDF && !selectedPDFFile && !pdfBase64Data) {
      alert('Please select a PDF file to upload');
      return;
    }

    if (!activePDFCourse) return;

    setPdfSaving(true);
    try {
      const payload = {
        title: pdfFormState.title.trim(),
        description: pdfFormState.description.trim(),
        moduleId: pdfFormState.moduleId,
        lessonId: pdfFormState.lessonId || null,
      };

      if (selectedPDFFile && pdfBase64Data) {
        payload.pdfBase64 = pdfBase64Data;
        payload.originalName = selectedPDFFile.name;
      }

      let res;
      if (editingPDF) {
        res = await api.put(
          `/mentor/courses/${activePDFCourse._id}/pdf-resources/${editingPDF._id}`,
          payload
        );
      } else {
        res = await api.post(
          `/mentor/courses/${activePDFCourse._id}/pdf-resources`,
          payload
        );
      }

      if (res.data && res.data.success) {
        setIsPDFFormOpen(false);
        fetchPDFResources(activePDFCourse._id);
        setSuccessMsg(editingPDF ? 'PDF resource updated successfully' : 'PDF resource uploaded successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(res.data?.message || 'Failed to save PDF resource');
      }
    } catch (err) {
      console.error('Error saving PDF resource:', err);
      alert(err.response?.data?.message || 'Failed to save PDF resource');
    } finally {
      setPdfSaving(false);
    }
  };

  // Delete PDF Resource
  const handleDeletePDFResource = async () => {
    if (!deletingPDF || !activePDFCourse) return;
    setIsDeletingPDF(true);
    try {
      const res = await api.delete(
        `/mentor/courses/${activePDFCourse._id}/pdf-resources/${deletingPDF._id}`
      );
      if (res.data && res.data.success) {
        setDeletingPDF(null);
        fetchPDFResources(activePDFCourse._id);
        setSuccessMsg('PDF resource deleted successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting PDF resource:', err);
      alert(err.response?.data?.message || 'Failed to delete PDF resource');
    } finally {
      setIsDeletingPDF(false);
    }
  };

  // ================= TEXT RESOURCE HANDLERS =================
  const fetchTextResources = async (courseId) => {
    setTextLoading(true);
    try {
      const res = await api.get(`/mentor/courses/${courseId}/text-resources`);
      if (res.data && res.data.success) {
        setTextResources(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching text resources:', err);
    } finally {
      setTextLoading(false);
    }
  };

  const fetchTextModules = async (courseId) => {
    try {
      const res = await api.get(`/mentor/courses/${courseId}/modules`);
      if (res.data && res.data.success) {
        setTextModulesList(res.data.data.modules || []);
      }
    } catch (err) {
      console.error('Error fetching text resource modules:', err);
    }
  };

  const fetchTextLessonsForModule = async (courseId, moduleId) => {
    if (!moduleId) {
      setTextLessonsList([]);
      return;
    }
    try {
      const res = await api.get(`/mentor/courses/${courseId}/modules/${moduleId}/lessons`);
      if (res.data && res.data.success) {
        setTextLessonsList(res.data.data.lessons || []);
      }
    } catch (err) {
      console.error('Error fetching lessons for text resource module:', err);
      setTextLessonsList([]);
    }
  };

  const handleOpenTextModal = (course) => {
    setActiveTextCourse(course);
    setIsTextModalOpen(true);
    fetchTextResources(course._id);
    fetchTextModules(course._id);
  };

  const handleTextModuleChange = (moduleId) => {
    setTextFormState((prev) => ({ ...prev, moduleId, lessonId: '' }));
    if (activeTextCourse) {
      fetchTextLessonsForModule(activeTextCourse._id, moduleId);
    }
  };

  const handleOpenAddTextModal = () => {
    setEditingText(null);
    const defaultModId = textModulesList[0]?._id || '';
    setTextFormState({
      title: '',
      description: '',
      type: 'reference_link',
      url: '',
      content: '',
      moduleId: defaultModId,
      lessonId: '',
    });
    if (defaultModId && activeTextCourse) {
      fetchTextLessonsForModule(activeTextCourse._id, defaultModId);
    }
    setIsTextFormOpen(true);
  };

  const handleOpenEditTextModal = (resItem) => {
    setEditingText(resItem);
    const modId = resItem.moduleId?._id || resItem.moduleId || '';
    const lesId = resItem.lessonId?._id || resItem.lessonId || '';
    setTextFormState({
      title: resItem.title || '',
      description: resItem.description || '',
      type: resItem.type || 'reference_link',
      url: resItem.url || '',
      content: resItem.content || '',
      moduleId: modId,
      lessonId: lesId,
    });
    if (modId && activeTextCourse) {
      fetchTextLessonsForModule(activeTextCourse._id, modId);
    }
    setIsTextFormOpen(true);
  };

  const handleSaveTextResource = async (e) => {
    e.preventDefault();
    if (!activeTextCourse) return;

    if (!textFormState.title.trim()) {
      alert('Please enter a resource title.');
      return;
    }

    if (!textFormState.moduleId) {
      alert('Please select a course module.');
      return;
    }

    setTextSaving(true);
    try {
      const payload = { ...textFormState };
      let res;
      if (editingText) {
        res = await api.put(`/mentor/courses/${activeTextCourse._id}/text-resources/${editingText._id}`, payload);
      } else {
        res = await api.post(`/mentor/courses/${activeTextCourse._id}/text-resources`, payload);
      }

      if (res.data && res.data.success) {
        setIsTextFormOpen(false);
        fetchTextResources(activeTextCourse._id);
        setSuccessMsg(editingText ? 'Text resource updated successfully' : 'Text resource created successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(res.data?.message || 'Failed to save text resource');
      }
    } catch (err) {
      console.error('Error saving text resource:', err);
      alert(err.response?.data?.message || 'Failed to save text resource');
    } finally {
      setTextSaving(false);
    }
  };

  const handleDeleteTextResource = async () => {
    if (!deletingText || !activeTextCourse) return;
    setIsDeletingText(true);
    try {
      const res = await api.delete(
        `/mentor/courses/${activeTextCourse._id}/text-resources/${deletingText._id}`
      );
      if (res.data && res.data.success) {
        setDeletingText(null);
        fetchTextResources(activeTextCourse._id);
        setSuccessMsg('Text resource deleted successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting text resource:', err);
      alert(err.response?.data?.message || 'Failed to delete text resource');
    } finally {
      setIsDeletingText(false);
    }
  };

  // ================= QUIZ HANDLERS =================
  const fetchCourseQuizzes = async (courseId) => {
    setQuizzesLoading(true);
    try {
      const res = await api.get(`/mentor/courses/${courseId}/quizzes`);
      if (res.data && res.data.success) {
        setQuizzes(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching course quizzes:', err);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const fetchQuizModules = async (courseId) => {
    try {
      const res = await api.get(`/mentor/courses/${courseId}/modules`);
      if (res.data && res.data.success) {
        setQuizModulesList(res.data.data.modules || []);
      }
    } catch (err) {
      console.error('Error fetching quiz modules:', err);
    }
  };

  const handleOpenQuizModal = (course) => {
    setActiveQuizCourse(course);
    setIsQuizModalOpen(true);
    fetchCourseQuizzes(course._id);
    fetchQuizModules(course._id);
  };

  const handleOpenAddQuizModal = () => {
    setEditingQuiz(null);
    const defaultModId = quizModulesList[0]?._id || '';
    setQuizFormState({
      title: '',
      description: '',
      moduleId: defaultModId,
      status: 'draft',
      questions: [
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          explanation: '',
          marks: 1,
        },
      ],
    });
    setIsQuizFormOpen(true);
  };

  const handleOpenEditQuizModal = (quizItem) => {
    setEditingQuiz(quizItem);
    const modId = quizItem.moduleId?._id || quizItem.moduleId || '';
    setQuizFormState({
      title: quizItem.title || '',
      description: quizItem.description || '',
      moduleId: modId,
      status: quizItem.status || 'draft',
      questions:
        quizItem.questions && quizItem.questions.length > 0
          ? quizItem.questions.map((q) => ({
              questionText: q.questionText || '',
              options: Array.isArray(q.options) && q.options.length >= 2 ? [...q.options] : ['', '', '', ''],
              correctOptionIndex: Number(q.correctOptionIndex || 0),
              explanation: q.explanation || '',
              marks: Number(q.marks || 1),
            }))
          : [
              {
                questionText: '',
                options: ['', '', '', ''],
                correctOptionIndex: 0,
                explanation: '',
                marks: 1,
              },
            ],
    });
    setIsQuizFormOpen(true);
  };

  const handleAddQuestionToQuizForm = () => {
    setQuizFormState((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          explanation: '',
          marks: 1,
        },
      ],
    }));
  };

  const handleRemoveQuestionFromQuizForm = (qIdx) => {
    setQuizFormState((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIdx),
    }));
  };

  const handleQuestionFieldChange = (qIdx, field, val) => {
    setQuizFormState((prev) => {
      const updatedQs = [...prev.questions];
      updatedQs[qIdx] = { ...updatedQs[qIdx], [field]: val };
      return { ...prev, questions: updatedQs };
    });
  };

  const handleOptionFieldChange = (qIdx, optIdx, val) => {
    setQuizFormState((prev) => {
      const updatedQs = [...prev.questions];
      const updatedOpts = [...updatedQs[qIdx].options];
      updatedOpts[optIdx] = val;
      updatedQs[qIdx] = { ...updatedQs[qIdx], options: updatedOpts };
      return { ...prev, questions: updatedQs };
    });
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!activeQuizCourse) return;

    if (!quizFormState.title.trim()) {
      alert('Please enter a quiz title.');
      return;
    }

    if (!quizFormState.moduleId) {
      alert('Please select a target module.');
      return;
    }

    if (quizFormState.questions.length === 0) {
      alert('Quiz must contain at least 1 question.');
      return;
    }

    // Validate questions
    for (let i = 0; i < quizFormState.questions.length; i++) {
      const q = quizFormState.questions[i];
      if (!q.questionText.trim()) {
        alert(`Question #${i + 1} is missing question text.`);
        return;
      }
      const validOptions = q.options.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        alert(`Question #${i + 1} must have at least 2 non-empty option choices.`);
        return;
      }
    }

    setQuizSaving(true);
    try {
      const payload = { ...quizFormState };
      let res;
      if (editingQuiz) {
        res = await api.put(`/mentor/courses/${activeQuizCourse._id}/quizzes/${editingQuiz._id}`, payload);
      } else {
        res = await api.post(`/mentor/courses/${activeQuizCourse._id}/quizzes`, payload);
      }

      if (res.data && res.data.success) {
        setIsQuizFormOpen(false);
        fetchCourseQuizzes(activeQuizCourse._id);
        setSuccessMsg(editingQuiz ? 'Course quiz updated successfully' : 'Course quiz created successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(res.data?.message || 'Failed to save course quiz');
      }
    } catch (err) {
      console.error('Error saving course quiz:', err);
      alert(err.response?.data?.message || 'Failed to save course quiz');
    } finally {
      setQuizSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deletingQuiz || !activeQuizCourse) return;
    setIsDeletingQuiz(true);
    try {
      const res = await api.delete(
        `/mentor/courses/${activeQuizCourse._id}/quizzes/${deletingQuiz._id}`
      );
      if (res.data && res.data.success) {
        setDeletingQuiz(null);
        fetchCourseQuizzes(activeQuizCourse._id);
        setSuccessMsg('Course quiz deleted successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting course quiz:', err);
      alert(err.response?.data?.message || 'Failed to delete course quiz');
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  // ================= COURSE PREVIEW HANDLERS =================
  const handleOpenPreviewModal = async (course) => {
    const targetId = typeof course === 'object' ? course._id || course.id : course;
    if (!targetId) return;

    setPreviewState({
      isOpen: true,
      loading: true,
      courseData: null,
      expandedModules: {},
      activeLesson: null,
      activeNote: null,
      activePDF: null,
      activeQuiz: null,
    });

    try {
      const res = await api.get(`/mentor/courses/${targetId}/preview`);
      if (res.data && res.data.success) {
        const cData = res.data.data;
        const initialExpanded = {};
        if (cData.modules && cData.modules.length > 0) {
          initialExpanded[cData.modules[0]._id] = true;
        }
        setPreviewState((prev) => ({
          ...prev,
          loading: false,
          courseData: cData,
          expandedModules: initialExpanded,
        }));
      } else {
        alert(res.data?.message || 'Failed to load course preview');
        setPreviewState((prev) => ({ ...prev, isOpen: false, loading: false }));
      }
    } catch (err) {
      console.error('Error fetching course preview:', err);
      alert(err.response?.data?.message || 'Failed to load course preview');
      setPreviewState((prev) => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const togglePreviewModuleExpand = (moduleId) => {
    setPreviewState((prev) => ({
      ...prev,
      expandedModules: {
        ...prev.expandedModules,
        [moduleId]: !prev.expandedModules[moduleId],
      },
    }));
  };

  const handleToggleStatusInPreview = async () => {
    if (!previewState.courseData) return;
    const currentCourse = previewState.courseData;
    const targetStatus = currentCourse.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.patch(`/mentor/courses/${currentCourse._id}/status`, { status: targetStatus });
      if (res.data && res.data.success) {
        setPreviewState((prev) => ({
          ...prev,
          courseData: {
            ...prev.courseData,
            status: targetStatus,
          },
        }));
        setCourses((prev) =>
          prev.map((c) => (c._id === currentCourse._id ? { ...c, status: targetStatus } : c))
        );
        setSuccessMsg(`Course status updated to ${targetStatus}`);
        setTimeout(() => setSuccessMsg(null), 3000);
        if (onCoursesUpdated) onCoursesUpdated();
      }
    } catch (err) {
      console.error('Error updating status in preview:', err);
      alert(err.response?.data?.message || 'Failed to update course status');
    }
  };

  // Filtered Courses calculation
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.detailedDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.skills && c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;

  return (
    <div className="space-y-8">
      {/* Toast Alert Message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-xs z-[80] relative"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-bold">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner & Stats Overview */}
      <div className="rounded-[28px] bg-white p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
                <BookOpen size={22} />
              </div>
              <h1 className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight">
                Course Management
              </h1>
            </div>
            <p className="text-sm text-[#5A6C66] font-medium leading-relaxed">
              Create, customize, and publish text-based courses, modules, rich lesson content, and PDF materials.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Create New Course</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#9FB2AC]/50">
          <div className="p-4 bg-[#FFF9EB]/60 rounded-2xl border border-[#9FB2AC]/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#5A6C66] uppercase">Total Courses</span>
              <div className="text-2xl font-extrabold text-[#5D0D1A]">{courses.length}</div>
            </div>
            <Layers className="text-[#5D0D1A]" size={24} />
          </div>

          <div className="p-4 bg-[#FFF9EB]/60 rounded-2xl border border-[#9FB2AC]/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#5A6C66] uppercase">Published</span>
              <div className="text-2xl font-extrabold text-emerald-700">{publishedCount}</div>
            </div>
            <Eye className="text-emerald-700" size={24} />
          </div>

          <div className="p-4 bg-[#FFF9EB]/60 rounded-2xl border border-[#9FB2AC]/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#5A6C66] uppercase">Drafts</span>
              <div className="text-2xl font-extrabold text-amber-700">{draftCount}</div>
            </div>
            <EyeOff className="text-amber-700" size={24} />
          </div>
        </div>
      </div>

      {/* Search & Filtering Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
          <input
            type="text"
            placeholder="Search by title, description or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] font-medium transition-all shadow-2xs"
          />
        </div>

        {/* Category & Status Filter Selectors */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-white border border-[#9FB2AC] px-3 py-1.5 rounded-xl shadow-2xs w-full md:w-auto">
            <Filter size={14} className="text-[#5D0D1A]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#5D0D1A] focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#9FB2AC] px-3 py-1.5 rounded-xl shadow-2xs w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#5D0D1A] focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Course Grid / Loading / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-[#9FB2AC]/20 rounded-[22px] border border-[#9FB2AC]/30" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-[22px] p-10 md:p-14 border border-[#9FB2AC] shadow-xs text-center space-y-4 my-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC] shadow-2xs">
            <BookOpen size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-[#5D0D1A]">No Courses Found</h3>
            <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
              {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
                ? 'No courses match your current search and filter criteria.'
                : 'You have not created any courses yet. Click below to launch your first course!'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all"
          >
            <Plus size={16} />
            <span>Create Your First Course</span>
          </button>
        </div>
      ) : (
        /* Course Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isPublished = course.status === 'published';
            const isPaid = course.priceType === 'Paid' && course.price > 0;
            const displayDesc = course.shortDescription || course.description || course.detailedDescription || '';

            return (
              <motion.div
                key={course._id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-[22px] bg-white border border-[#9FB2AC] shadow-xs overflow-hidden flex flex-col justify-between transition-all"
              >
                {/* Top Image Thumbnail Container */}
                <div className="relative w-full overflow-hidden bg-[#f5f5f5] flex items-center justify-center border-b border-[#9FB2AC]/30">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-auto max-h-[260px] object-contain object-center block"
                    />
                  ) : (
                    <div className="w-full h-44 flex flex-col items-center justify-center text-[#FFF9EB]/80 p-4 text-center bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424]">
                      <BookOpen size={36} className="mb-1 text-[#FFF9EB]" />
                      <span className="text-xs font-bold uppercase tracking-wider">{course.category}</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm border ${
                      isPublished
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isPublished ? 'Published' : 'Draft'}
                  </span>

                  {/* Price Tag */}
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold bg-[#5D0D1A] text-[#FFF9EB] shadow-sm border border-[#FFF9EB]/30 flex items-center gap-0.5">
                    {isPaid ? (
                      <>
                        <IndianRupee size={12} />
                        <span>{course.price.toLocaleString('en-IN')}</span>
                      </>
                    ) : (
                      'FREE'
                    )}
                  </span>
                </div>

                {/* Course Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#5A6C66]">
                      <span className="bg-[#FFF9EB] text-[#5D0D1A] px-2 py-0.5 rounded-md border border-[#9FB2AC]/60">
                        {course.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {course.duration || '4 Weeks'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#5D0D1A] line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-xs text-[#5A6C66] font-medium leading-relaxed line-clamp-2">
                      {displayDesc}
                    </p>
                  </div>

                  {/* Language & Difficulty Meta */}
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#5A6C66]">
                    <span className="flex items-center gap-1">
                      <Globe size={12} className="text-[#5D0D1A]" />
                      {course.language || 'English'}
                    </span>
                    <span>
                      Level: <strong className="text-[#5D0D1A]">{course.difficulty || 'All Levels'}</strong>
                    </span>
                  </div>

                  {/* Manage Modules, PDF Resources, Text Resources & Quizzes Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <button
                      onClick={() => handleOpenModuleModal(course)}
                      className="py-2 px-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] border border-[#9FB2AC] text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all"
                      title="Manage Curriculum Modules & Text Lessons"
                    >
                      <ListOrdered size={13} className="shrink-0" />
                      <span className="truncate">Modules & Text</span>
                    </button>

                    <button
                      onClick={() => handleOpenPDFModal(course)}
                      className="py-2 px-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] border border-[#9FB2AC] text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all"
                      title="Manage PDF Learning Resources"
                    >
                      <FileText size={13} className="shrink-0" />
                      <span className="truncate">PDF Resources</span>
                    </button>

                    <button
                      onClick={() => handleOpenTextModal(course)}
                      className="py-2 px-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] border border-[#9FB2AC] text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all"
                      title="Manage Articles, Docs, Links & Notes"
                    >
                      <LinkIcon size={13} className="shrink-0" />
                      <span className="truncate">Links & Notes</span>
                    </button>

                    <button
                      onClick={() => handleOpenQuizModal(course)}
                      className="py-2 px-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] border border-[#9FB2AC] text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all"
                      title="Manage Multiple Choice Quizzes"
                    >
                      <HelpCircle size={13} className="shrink-0" />
                      <span className="truncate">Module Quizzes</span>
                    </button>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#9FB2AC]/40">
                    {/* Preview Course Button */}
                    <button
                      onClick={() => handleOpenPreviewModal(course)}
                      className="py-2 px-3 rounded-xl text-xs font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#F7EED8] transition-all flex items-center justify-center gap-1.5"
                      title="Preview Course as Student"
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>

                    {/* Toggle Status / Publish / Draft Button */}
                    <button
                      onClick={() => handleToggleStatus(course)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all border flex items-center justify-center gap-1.5 ${
                        isPublished
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] hover:bg-[#7A1424]'
                      }`}
                      title={isPublished ? 'Revert to Draft' : 'Publish Course'}
                    >
                      {isPublished ? <EyeOff size={14} /> : <Sparkles size={14} />}
                      <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(course)}
                      className="p-2 rounded-xl bg-white text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#FFF9EB] transition-colors"
                      title="Edit Course"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingCourse(course)}
                      className="p-2 rounded-xl bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ================= COURSE PDF RESOURCE MANAGEMENT MODAL ================= */}
      <AnimatePresence>
        {isPDFModalOpen && activePDFCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#9FB2AC]/70 flex items-center justify-between bg-[#FFF9EB]/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#5D0D1A]">
                      PDF Learning Resources
                    </h2>
                    <p className="text-xs text-[#5A6C66] font-medium truncate max-w-md">
                      Course: <strong>{activePDFCourse.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenUploadPDFModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                  >
                    <Upload size={15} />
                    <span>Upload PDF</span>
                  </button>

                  <button
                    onClick={() => setIsPDFModalOpen(false)}
                    className="p-2 text-[#5A6C66] hover:text-[#5D0D1A] rounded-xl hover:bg-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* PDF Resources List Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {pdfLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-[#9FB2AC]/20 rounded-2xl border border-[#9FB2AC]/30" />
                    ))}
                  </div>
                ) : pdfResources.length === 0 ? (
                  <div className="p-8 text-center bg-[#FFF9EB]/50 rounded-2xl border border-[#9FB2AC]/60 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
                      <FileText size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-[#5D0D1A]">No PDF Resources Uploaded Yet</h4>
                      <p className="text-xs text-[#5A6C66] font-medium max-w-sm mx-auto">
                        Upload PDF reference guides, worksheets, or cheat sheets for your course modules and lessons.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenUploadPDFModal}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                    >
                      <Upload size={15} />
                      <span>Upload First PDF</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pdfResources.map((pdf) => (
                      <motion.div
                        key={pdf._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-[#FFF9EB]/60 hover:bg-[#FFF9EB] border border-[#9FB2AC]/70 flex items-start justify-between gap-4 transition-colors shadow-2xs"
                      >
                        {/* PDF Metadata Details */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] border border-[#9FB2AC]/70 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText size={20} />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-[#5D0D1A] truncate">
                                {pdf.title}
                              </h4>
                              <span className="text-[10px] font-extrabold bg-[#5D0D1A] text-[#FFF9EB] px-2 py-0.5 rounded-md shrink-0">
                                {formatFileSize(pdf.fileSize)}
                              </span>
                            </div>

                            {pdf.description && (
                              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed line-clamp-2">
                                {pdf.description}
                              </p>
                            )}

                            {/* Linked Module & Lesson Badges */}
                            <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] font-semibold text-[#5A6C66]">
                              <span className="bg-white px-2 py-0.5 rounded-md border border-[#9FB2AC]/60 text-[#5D0D1A] font-bold">
                                Module: {pdf.moduleId?.title || 'Course Level'}
                              </span>

                              {pdf.lessonId && (
                                <span className="bg-white px-2 py-0.5 rounded-md border border-[#9FB2AC]/60 text-[#5D0D1A]">
                                  Lesson: {pdf.lessonId?.title || 'Specific Lesson'}
                                </span>
                              )}

                              <span className="text-[10px] text-[#5A6C66]/80 flex items-center gap-1">
                                <Paperclip size={11} />
                                {pdf.originalName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Controls (Replace, Edit Metadata, Delete) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Replace PDF */}
                          <button
                            onClick={() => handleOpenEditPDFModal(pdf)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#5D0D1A] border border-[#9FB2AC] text-xs font-extrabold hover:bg-[#FFF9EB] transition-colors"
                            title="Replace PDF File or Edit Metadata"
                          >
                            <RefreshCw size={13} />
                            <span>Replace / Edit</span>
                          </button>

                          {/* Delete PDF */}
                          <button
                            onClick={() => setDeletingPDF(pdf)}
                            className="p-1.5 rounded-xl text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors"
                            title="Delete PDF Resource"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= UPLOAD / EDIT PDF RESOURCE FORM MODAL ================= */}
      <AnimatePresence>
        {isPDFFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-xl w-full shadow-2xl space-y-5 my-auto"
            >
              {/* Form Modal Header */}
              <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <FileText size={20} className="text-[#5D0D1A]" />
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">
                    {editingPDF ? 'Edit / Replace PDF Resource' : 'Upload PDF Resource'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsPDFFormOpen(false)}
                  className="p-1.5 text-[#5A6C66] hover:text-[#5D0D1A] rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSavePDFResource} className="space-y-4">
                {/* PDF File Input Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">
                    {editingPDF ? 'Replace PDF Document (.pdf optional)' : 'Upload PDF Document (.pdf) *'}
                  </label>
                  <div className="p-4 rounded-xl bg-[#FFF9EB] border border-dashed border-[#9FB2AC] flex flex-col items-center justify-center gap-2 text-center">
                    <FileType size={28} className="text-[#5D0D1A]" />
                    <div>
                      <button
                        type="button"
                        onClick={() => pdfFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#9FB2AC] text-[#5D0D1A] text-xs font-bold hover:bg-[#FFF9EB] transition-colors"
                      >
                        <Upload size={14} />
                        <span>{selectedPDFFile ? 'Choose Different File' : 'Select PDF File'}</span>
                      </button>
                      <input
                        ref={pdfFileInputRef}
                        type="file"
                        accept="application/pdf, .pdf"
                        onChange={handlePDFFileSelect}
                        className="hidden"
                      />
                    </div>
                    {selectedPDFFile ? (
                      <p className="text-xs font-extrabold text-[#5D0D1A]">
                        Selected: {selectedPDFFile.name} ({formatFileSize(selectedPDFFile.size)})
                      </p>
                    ) : editingPDF ? (
                      <p className="text-[11px] text-[#5A6C66] font-medium">
                        Current File: <strong>{editingPDF.originalName}</strong> ({formatFileSize(editingPDF.fileSize)})
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#5A6C66] font-medium">
                        PDF format up to 10 MB.
                      </p>
                    )}
                  </div>
                </div>

                {/* PDF Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">PDF Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. React Hooks Cheat Sheet & Reference Guide"
                    value={pdfFormState.title}
                    onChange={(e) => setPdfFormState({ ...pdfFormState, title: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                  />
                </div>

                {/* PDF Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">PDF Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the material included in this PDF resource..."
                    value={pdfFormState.description}
                    onChange={(e) => setPdfFormState({ ...pdfFormState, description: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-3 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                  />
                </div>

                {/* Module & Lesson Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Module Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Select Module *</label>
                    <select
                      required
                      value={pdfFormState.moduleId}
                      onChange={(e) => handlePDFModuleChange(e.target.value)}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium cursor-pointer"
                    >
                      <option value="" disabled>-- Choose Module --</option>
                      {pdfModulesList.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Lesson Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Optionally Select Lesson</label>
                    <select
                      value={pdfFormState.lessonId}
                      onChange={(e) => setPdfFormState({ ...pdfFormState, lessonId: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium cursor-pointer"
                      disabled={!pdfFormState.moduleId || pdfLessonsList.length === 0}
                    >
                      <option value="">-- General Module Resource (No Lesson) --</option>
                      {pdfLessonsList.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#9FB2AC]/60">
                  <button
                    type="button"
                    onClick={() => setIsPDFFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pdfSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm"
                  >
                    {pdfSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>{editingPDF ? 'Save Changes' : 'Upload PDF'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE PDF CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingPDF && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Delete PDF Resource?</h3>
              </div>

              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                Are you sure you want to delete <strong>"{deletingPDF.title}"</strong> ({deletingPDF.originalName})?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingPDF(null)}
                  disabled={isDeletingPDF}
                  className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePDFResource}
                  disabled={isDeletingPDF}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  {isDeletingPDF ? 'Deleting...' : 'Yes, Delete PDF'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= COURSE MODULE & LESSON MANAGER MODAL ================= */}
      <AnimatePresence>
        {isModuleModalOpen && activeModuleCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#9FB2AC]/70 flex items-center justify-between bg-[#FFF9EB]/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
                    <ListOrdered size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#5D0D1A]">
                      Course Curriculum & Text Lessons
                    </h2>
                    <p className="text-xs text-[#5A6C66] font-medium truncate max-w-md">
                      Course: <strong>{activeModuleCourse.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddModuleForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                  >
                    <Plus size={15} />
                    <span>Add Module</span>
                  </button>

                  <button
                    onClick={() => setIsModuleModalOpen(false)}
                    className="p-2 text-[#5A6C66] hover:text-[#5D0D1A] rounded-xl hover:bg-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Module List Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {modulesLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-[#9FB2AC]/20 rounded-2xl border border-[#9FB2AC]/30" />
                    ))}
                  </div>
                ) : modules.length === 0 ? (
                  <div className="p-8 text-center bg-[#FFF9EB]/50 rounded-2xl border border-[#9FB2AC]/60 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
                      <Layers size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-[#5D0D1A]">No Modules Added Yet</h4>
                      <p className="text-xs text-[#5A6C66] font-medium max-w-sm mx-auto">
                        Organize your course into structured learning modules (e.g. Module 1: Introduction, Module 2: Core Concepts).
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAddModuleForm}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                    >
                      <Plus size={15} />
                      <span>Add First Module</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((mod, idx) => {
                      const lessons = moduleLessonsMap[mod._id] || [];
                      const isExpanded = expandedModuleId === mod._id;
                      const lessonsLoading = lessonsLoadingMap[mod._id];

                      return (
                        <motion.div
                          key={mod._id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 overflow-hidden shadow-2xs"
                        >
                          {/* Module Header Bar */}
                          <div className="p-4 bg-white flex items-start justify-between gap-4 border-b border-[#9FB2AC]/40">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <span className="px-2.5 py-1 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] text-[11px] font-extrabold shrink-0 mt-0.5">
                                Module {idx + 1}
                              </span>
                              <div className="space-y-1 min-w-0">
                                <h4 className="text-sm font-extrabold text-[#5D0D1A] truncate">
                                  {mod.title}
                                </h4>
                                {mod.description && (
                                  <p className="text-xs text-[#5A6C66] font-medium leading-relaxed line-clamp-1">
                                    {mod.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Module Controls & Accordion Trigger */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Move Module Up */}
                              <button
                                onClick={() => handleMoveModule(idx, 'up')}
                                disabled={idx === 0}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  idx === 0
                                    ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                    : 'text-[#5D0D1A] bg-white border-[#9FB2AC] hover:bg-[#FFF9EB]'
                                }`}
                                title="Move Module Up"
                              >
                                <ArrowUp size={14} />
                              </button>

                              {/* Move Module Down */}
                              <button
                                onClick={() => handleMoveModule(idx, 'down')}
                                disabled={idx === modules.length - 1}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  idx === modules.length - 1
                                    ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                    : 'text-[#5D0D1A] bg-white border-[#9FB2AC] hover:bg-[#FFF9EB]'
                                }`}
                                title="Move Module Down"
                              >
                                <ArrowDown size={14} />
                              </button>

                              {/* Add Lesson to this Module */}
                              <button
                                onClick={() => handleOpenAddLessonModal(mod)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold hover:bg-[#7A1424] transition-colors"
                              >
                                <Plus size={13} />
                                <span>Add Lesson</span>
                              </button>

                              {/* Edit Module */}
                              <button
                                onClick={() => handleOpenEditModuleForm(mod)}
                                className="p-1.5 rounded-lg text-[#5D0D1A] bg-white border border-[#9FB2AC] hover:bg-[#FFF9EB] transition-colors"
                                title="Edit Module"
                              >
                                <Edit3 size={14} />
                              </button>

                              {/* Delete Module */}
                              <button
                                onClick={() => setDeletingModule(mod)}
                                className="p-1.5 rounded-lg text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors"
                                title="Delete Module"
                              >
                                <Trash2 size={14} />
                              </button>

                              {/* Toggle Lessons Accordion */}
                              <button
                                onClick={() => handleToggleExpandModule(mod._id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold hover:bg-[#F7EED8]"
                              >
                                <span>Lessons ({lessons.length})</span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* Accordion Body: Lessons List */}
                          {isExpanded && (
                            <div className="p-4 bg-[#FFF9EB]/40 space-y-3 border-t border-[#9FB2AC]/30">
                              {lessonsLoading ? (
                                <div className="p-4 text-center text-xs text-[#5A6C66] animate-pulse font-medium">
                                  Loading text lessons...
                                </div>
                              ) : lessons.length === 0 ? (
                                <div className="p-4 text-center bg-white rounded-xl border border-[#9FB2AC]/50 space-y-2">
                                  <p className="text-xs font-bold text-[#5D0D1A]">No text lessons added to this module yet.</p>
                                  <button
                                    onClick={() => handleOpenAddLessonModal(mod)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold hover:scale-[1.02] transition-all"
                                  >
                                    <Plus size={13} />
                                    <span>Create First Text Lesson</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5A6C66] px-1 uppercase tracking-wider">
                                    <span>Text Lessons ({lessons.length})</span>
                                    <span>100% Text Platform</span>
                                  </div>

                                  {lessons.map((les, lIdx) => (
                                    <div
                                      key={les._id}
                                      className="p-3 bg-white rounded-xl border border-[#9FB2AC]/60 flex items-center justify-between gap-3 shadow-2xs hover:border-[#5D0D1A]/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="w-6 h-6 rounded-md bg-[#FFF9EB] text-[#5D0D1A] text-[10px] font-extrabold flex items-center justify-center border border-[#9FB2AC]/60 shrink-0">
                                          {lIdx + 1}
                                        </span>
                                        <div className="min-w-0 space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <h5 className="text-xs font-extrabold text-[#5D0D1A] truncate">
                                              {les.title}
                                            </h5>
                                            <span className="text-[10px] font-semibold text-[#5A6C66] bg-[#FFF9EB] px-2 py-0.5 rounded border border-[#9FB2AC]/40 shrink-0">
                                              {les.duration || '10 min'}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-[#5A6C66] font-medium truncate">
                                            {les.content ? les.content.substring(0, 70) + '...' : 'No text content'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Lesson Reorder & Edit Controls */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => handleMoveLesson(mod._id, lIdx, 'up')}
                                          disabled={lIdx === 0}
                                          className={`p-1 rounded border transition-all ${
                                            lIdx === 0
                                              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                              : 'text-[#5D0D1A] bg-white border-[#9FB2AC] hover:bg-[#FFF9EB]'
                                          }`}
                                          title="Move Lesson Up"
                                        >
                                          <ArrowUp size={13} />
                                        </button>

                                        <button
                                          onClick={() => handleMoveLesson(mod._id, lIdx, 'down')}
                                          disabled={lIdx === lessons.length - 1}
                                          className={`p-1 rounded border transition-all ${
                                            lIdx === lessons.length - 1
                                              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                              : 'text-[#5D0D1A] bg-white border-[#9FB2AC] hover:bg-[#FFF9EB]'
                                          }`}
                                          title="Move Lesson Down"
                                        >
                                          <ArrowDown size={13} />
                                        </button>

                                        <button
                                          onClick={() => handleOpenEditLessonModal(mod, les)}
                                          className="p-1 rounded text-[#5D0D1A] bg-white border border-[#9FB2AC] hover:bg-[#FFF9EB] transition-colors"
                                          title="Edit Text Lesson"
                                        >
                                          <Edit3 size={13} />
                                        </button>

                                        <button
                                          onClick={() => {
                                            setTargetModuleForLesson(mod);
                                            setDeletingLesson(les);
                                          }}
                                          className="p-1 rounded text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors"
                                          title="Delete Lesson"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= TEXT-BASED LESSON EDITOR MODAL ================= */}
      <AnimatePresence>
        {isLessonModalOpen && targetModuleForLesson && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#9FB2AC]/70 flex items-center justify-between bg-[#FFF9EB]/90">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#5D0D1A]">
                      {editingLesson ? 'Edit Text Lesson' : 'Create Text Lesson'}
                    </h2>
                    <p className="text-xs text-[#5A6C66] font-medium">
                      Module: <strong>{targetModuleForLesson.title}</strong> • 100% Text Platform
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tab Switcher: Write vs Live Preview */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-[#9FB2AC] shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setLessonTab('write')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors ${
                        lessonTab === 'write' ? 'bg-[#5D0D1A] text-[#FFF9EB]' : 'text-[#5A6C66] hover:text-[#5D0D1A]'
                      }`}
                    >
                      Write Content
                    </button>
                    <button
                      type="button"
                      onClick={() => setLessonTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors ${
                        lessonTab === 'preview' ? 'bg-[#5D0D1A] text-[#FFF9EB]' : 'text-[#5A6C66] hover:text-[#5D0D1A]'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>

                  <button
                    onClick={() => setIsLessonModalOpen(false)}
                    className="p-2 text-[#5A6C66] hover:text-[#5D0D1A] rounded-xl hover:bg-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveLesson} className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lesson Title */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Lesson Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lesson 1: Understanding Components and Props"
                      value={lessonFormState.title}
                      onChange={(e) => setLessonFormState({ ...lessonFormState, title: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                    />
                  </div>

                  {/* Estimated Reading Duration */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Estimated Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 min read"
                      value={lessonFormState.duration}
                      onChange={(e) => setLessonFormState({ ...lessonFormState, duration: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {lessonTab === 'write' ? (
                  <div className="space-y-2">
                    {/* Rich Text Toolbar */}
                    <div className="p-2 bg-[#FFF9EB] rounded-xl border border-[#9FB2AC] flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[10px] font-extrabold uppercase text-[#5A6C66] px-2">Toolbar:</span>
                      
                      {/* Headings */}
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('h1')}
                        className="px-2 py-1 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg font-bold text-[#5D0D1A]"
                        title="Heading 1 (#)"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('h2')}
                        className="px-2 py-1 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg font-bold text-[#5D0D1A]"
                        title="Heading 2 (##)"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('h3')}
                        className="px-2 py-1 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg font-bold text-[#5D0D1A]"
                        title="Heading 3 (###)"
                      >
                        H3
                      </button>

                      <div className="h-4 w-px bg-[#9FB2AC]/60 mx-1" />

                      {/* Bold & Italic */}
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('bold')}
                        className="p-1.5 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg text-[#5D0D1A]"
                        title="Bold (**text**)"
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('italic')}
                        className="p-1.5 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg text-[#5D0D1A]"
                        title="Italic (*text*)"
                      >
                        <Italic size={14} />
                      </button>

                      <div className="h-4 w-px bg-[#9FB2AC]/60 mx-1" />

                      {/* Lists */}
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('bullet')}
                        className="p-1.5 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg text-[#5D0D1A]"
                        title="Bullet List (- item)"
                      >
                        <List size={14} />
                      </button>

                      {/* Link & Image */}
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('link')}
                        className="p-1.5 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg text-[#5D0D1A]"
                        title="Insert Link ([text](url))"
                      >
                        <LinkIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('image')}
                        className="p-1.5 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg text-[#5D0D1A]"
                        title="Insert Image (![alt](url))"
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('table')}
                        className="p-1.5 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg text-[#5D0D1A]"
                        title="Insert Table"
                      >
                        <TableIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('code')}
                        className="p-1.5 bg-white hover:bg-[#FFF9EB] border border-[#9FB2AC] rounded-lg text-[#5D0D1A]"
                        title="Insert Code Block (```js)"
                      >
                        <Code size={14} />
                      </button>

                      <div className="h-4 w-px bg-[#9FB2AC]/60 mx-1" />

                      {/* Callouts */}
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('example')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-100 text-cyan-900 border border-cyan-300 rounded-lg text-[11px] font-extrabold hover:bg-cyan-200"
                        title="Insert Example Callout"
                      >
                        <Lightbulb size={13} />
                        <span>Example</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInsertFormat('note')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-extrabold hover:bg-amber-200"
                        title="Insert Note Callout"
                      >
                        <Info size={13} />
                        <span>Note</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInsertFormat('takeaway')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5D0D1A] text-[#FFF9EB] border border-[#5D0D1A] rounded-lg text-[11px] font-extrabold hover:bg-[#7A1424]"
                        title="Insert Key Takeaway"
                      >
                        <Award size={13} />
                        <span>Takeaway</span>
                      </button>
                    </div>

                    {/* Textarea Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#5D0D1A]">Rich Text Content *</label>
                      <textarea
                        ref={lessonTextareaRef}
                        rows={12}
                        required
                        placeholder="Type text content here using Markdown or toolbar controls above..."
                        value={lessonFormState.content}
                        onChange={(e) => setLessonFormState({ ...lessonFormState, content: e.target.value })}
                        className="w-full bg-[#FFF9EB]/70 border border-[#9FB2AC] rounded-xl p-4 font-mono text-xs text-[#5D0D1A] focus:outline-none focus:bg-white leading-relaxed font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  /* Live Formatted Preview Tab */
                  <div className="p-6 rounded-2xl bg-[#FFF9EB]/40 border border-[#9FB2AC] min-h-[300px] max-h-[500px] overflow-y-auto space-y-3">
                    <div className="flex items-center justify-between border-b border-[#9FB2AC]/50 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase bg-[#5D0D1A] text-[#FFF9EB] px-2 py-0.5 rounded">
                          Live Formatted Preview
                        </span>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A] mt-1">{lessonFormState.title || 'Untitled Lesson'}</h3>
                      </div>
                      <span className="text-xs font-bold text-[#5A6C66]">{lessonFormState.duration || '10 min'}</span>
                    </div>

                    {renderFormattedLessonContent(lessonFormState.content)}
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-[#9FB2AC]/70 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLessonModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold hover:bg-[#F7EED8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={lessonSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all"
                  >
                    {lessonSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>{editingLesson ? 'Save Changes' : 'Create Text Lesson'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE LESSON CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingLesson && targetModuleForLesson && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Delete Text Lesson?</h3>
              </div>

              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                Are you sure you want to delete <strong>"{deletingLesson.title}"</strong>? Remaining lessons in this module will automatically reorder.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingLesson(null)}
                  disabled={isDeletingLesson}
                  className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLesson}
                  disabled={isDeletingLesson}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  {isDeletingLesson ? 'Deleting...' : 'Yes, Delete Lesson'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= ADD / EDIT MODULE FORM MODAL ================= */}
      <AnimatePresence>
        {isModuleFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Layers size={20} className="text-[#5D0D1A]" />
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">
                    {editingModule ? 'Edit Module' : 'Add New Module'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModuleFormOpen(false)}
                  className="p-1.5 text-[#5A6C66] hover:text-[#5D0D1A] rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveModule} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Module Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Module 1: Introduction to Components"
                    value={moduleFormState.title}
                    onChange={(e) => setModuleFormState({ ...moduleFormState, title: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Short Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief outline of key topics covered in this module..."
                    value={moduleFormState.description}
                    onChange={(e) => setModuleFormState({ ...moduleFormState, description: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-3 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModuleFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={moduleSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm"
                  >
                    {moduleSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>{editingModule ? 'Save Changes' : 'Add Module'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE MODULE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingModule && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Delete Module?</h3>
              </div>

              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                Are you sure you want to delete <strong>"{deletingModule.title}"</strong>? Remaining modules and their text lessons will automatically reorder.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingModule(null)}
                  disabled={isDeletingModule}
                  className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteModule}
                  disabled={isDeletingModule}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  {isDeletingModule ? 'Deleting...' : 'Yes, Delete Module'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CREATE / EDIT COURSE MODAL ================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#9FB2AC]/70 flex items-center justify-between bg-[#FFF9EB]/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#5D0D1A]">
                      {editingCourseId ? 'Edit Course' : 'Create New Course'}
                    </h2>
                    <p className="text-xs text-[#5A6C66] font-medium">Fill in text-based course specifications and details</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-[#5A6C66] hover:text-[#5D0D1A] rounded-xl hover:bg-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Scrollable Form Body */}
              <form onSubmit={handleSaveCourse} className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Course Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Full-Stack Web Development with React & Node"
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] font-medium"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Comprehensive explanation of topics covered, course structure, and learning outcomes..."
                    value={formState.shortDescription}
                    onChange={(e) => setFormState({ ...formState, shortDescription: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-3 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                  />
                </div>

                {/* Course Thumbnail Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#5D0D1A]">Course Thumbnail Image</label>
                    <span className="text-[11px] font-semibold text-[#5A6C66]">16:9 ratio recommended (e.g. 1280×720)</span>
                  </div>
                  <div className="border border-[#9FB2AC] rounded-2xl p-4 bg-[#FFF9EB]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Thumbnail Preview Area */}
                      <div className="relative w-full sm:w-60 rounded-xl bg-[#f5f5f5] border border-[#9FB2AC] overflow-hidden flex items-center justify-center shrink-0 shadow-xs group/thumb">
                        {formState.thumbnail ? (
                          <>
                            <img
                              src={formState.thumbnail}
                              alt="Thumbnail preview"
                              className="w-full h-auto max-h-52 object-contain object-center block"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#5D0D1A] text-[11px] font-bold shadow-xs transition-all"
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormState((prev) => ({ ...prev, thumbnail: '' }))}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-all"
                              >
                                Remove
                              </button>
                            </div>
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[#FFF9EB] text-[9px] font-bold">
                              Full Preview
                            </span>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-4 text-[#5A6C66] space-y-1 bg-[#f5f5f5] w-full min-h-[140px]">
                            <BookOpen size={28} className="text-[#5D0D1A]/60" />
                            <span className="text-[10px] font-bold text-[#5D0D1A]">No Thumbnail</span>
                            <span className="text-[9px] text-[#5A6C66]">Card Preview Area</span>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#9FB2AC] text-[#5D0D1A] text-xs font-bold hover:bg-[#FFF9EB] transition-colors shadow-2xs"
                          >
                            <Camera size={15} />
                            <span>{formState.thumbnail ? 'Replace Thumbnail' : 'Upload Thumbnail'}</span>
                          </button>
                          {formState.thumbnail && (
                            <button
                              type="button"
                              onClick={() => setFormState((prev) => ({ ...prev, thumbnail: '' }))}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                        />
                        <p className="text-[11px] text-[#5A6C66]">
                          PNG, JPG or WebP up to 3 MB. The image will fit the course card area edge-to-edge.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category & Difficulty Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Category</label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Difficulty Level</label>
                    <select
                      value={formState.difficulty}
                      onChange={(e) => setFormState({ ...formState, difficulty: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium cursor-pointer"
                    >
                      {DIFFICULTY_OPTIONS.map((diff) => (
                        <option key={diff} value={diff}>
                          {diff}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration & Language Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estimated Duration */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Estimated Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 4 Weeks, 10 Hours, 15 Modules"
                      value={formState.duration}
                      onChange={(e) => setFormState({ ...formState, duration: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium"
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Language</label>
                    <select
                      value={formState.language}
                      onChange={(e) => setFormState({ ...formState, language: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white font-medium cursor-pointer"
                    >
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing Configuration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Course Pricing</label>
                  <div className="flex items-center gap-4 bg-[#FFF9EB]/60 p-3 rounded-xl border border-[#9FB2AC]/60">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#5D0D1A] cursor-pointer">
                      <input
                        type="radio"
                        name="priceType"
                        value="Free"
                        checked={formState.priceType === 'Free'}
                        onChange={() => setFormState({ ...formState, priceType: 'Free', price: 0 })}
                      />
                      <span>Free</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#5D0D1A] cursor-pointer">
                      <input
                        type="radio"
                        name="priceType"
                        value="Paid"
                        checked={formState.priceType === 'Paid'}
                        onChange={() => setFormState({ ...formState, priceType: 'Paid' })}
                      />
                      <span>Paid (INR ₹)</span>
                    </label>

                    {formState.priceType === 'Paid' && (
                      <div className="flex-1 flex items-center gap-2 ml-4">
                        <IndianRupee size={14} className="text-[#5D0D1A]" />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Price in ₹ (e.g. 1999)"
                          value={formState.price}
                          onChange={(e) => setFormState({ ...formState, price: Math.max(0, Number(e.target.value)) })}
                          className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-1.5 text-xs text-[#5D0D1A] font-extrabold focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills Covered */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5D0D1A] flex items-center gap-1.5">
                    <Target size={14} />
                    Skills Covered
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {formState.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold"
                      >
                        {sk}
                        <button type="button" onClick={() => handleRemoveSkill(idx)} className="hover:text-red-300">
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill e.g. React hooks, Express API..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1 bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill()}
                      className="px-4 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold hover:bg-[#7A1424]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Publication Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs text-[#5D0D1A] font-extrabold focus:outline-none cursor-pointer"
                  >
                    <option value="draft">Draft (Private until published)</option>
                    <option value="published">Published (Visible to students)</option>
                  </select>
                </div>

                {/* Modal Actions Footer */}
                <div className="pt-4 border-t border-[#9FB2AC]/70 flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold hover:bg-[#F7EED8]"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Preview Button (If Editing Existing Course) */}
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={() => handleOpenPreviewModal(editingCourseId)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-extrabold hover:bg-[#F7EED8] transition-all"
                      >
                        <Eye size={15} />
                        <span>Preview Course</span>
                      </button>
                    )}

                    {/* Save as Draft Button */}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={(e) => {
                        setFormState((prev) => ({ ...prev, status: 'draft' }));
                        // Submit form with draft status
                        setTimeout(() => handleSaveCourse(e), 50);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-extrabold hover:bg-amber-100 transition-all"
                    >
                      <Save size={15} />
                      <span>Save as Draft</span>
                    </button>

                    {/* Publish Course Button */}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={(e) => {
                        setFormState((prev) => ({ ...prev, status: 'published' }));
                        setTimeout(() => handleSaveCourse(e), 50);
                      }}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      <span>Publish Course</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE COURSE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Delete Course?</h3>
              </div>

              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                Are you sure you want to delete <strong>"{deletingCourse.title}"</strong>? This will also remove all associated curriculum modules, text lessons, and PDF resources.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingCourse(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Course'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= COURSE TEXT RESOURCE MANAGEMENT MODAL ================= */}
      <AnimatePresence>
        {isTextModalOpen && activeTextCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#9FB2AC]/70 flex items-center justify-between bg-[#FFF9EB]/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
                    <LinkIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#5D0D1A]">
                      Text & Reference Resources
                    </h2>
                    <p className="text-xs text-[#5A6C66] font-medium truncate max-w-md">
                      Articles, Documentation, Practice Sites & Notes for <strong>{activeTextCourse.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddTextModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                  >
                    <Plus size={15} />
                    <span>Add Resource</span>
                  </button>

                  <button
                    onClick={() => setIsTextModalOpen(false)}
                    className="p-2 text-[#5A6C66] hover:text-[#5D0D1A] rounded-xl hover:bg-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Resource List Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {textLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-[#9FB2AC]/20 rounded-2xl border border-[#9FB2AC]/30" />
                    ))}
                  </div>
                ) : textResources.length === 0 ? (
                  <div className="p-8 text-center bg-[#FFF9EB]/50 rounded-2xl border border-[#9FB2AC]/60 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
                      <LinkIcon size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-[#5D0D1A]">No Text Resources Added Yet</h4>
                      <p className="text-xs text-[#5A6C66] font-medium max-w-sm mx-auto">
                        Add curated articles, official documentation, practice websites, or mentor notes to specific course modules.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAddTextModal}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                    >
                      <Plus size={15} />
                      <span>Add First Resource</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {textResources.map((resItem) => {
                      const typeLabels = {
                        article: 'Article',
                        documentation: 'Official Documentation',
                        practice_website: 'Practice Website',
                        reference_link: 'Reference Link',
                        note: 'Mentor Note',
                      };

                      return (
                        <div
                          key={resItem._id}
                          className="p-4 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 flex items-start justify-between gap-4 shadow-2xs hover:bg-[#FFF9EB] transition-all"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#5D0D1A] text-[#FFF9EB] text-[10px] font-black uppercase">
                                {typeLabels[resItem.type] || resItem.type}
                              </span>
                              {resItem.moduleId && (
                                <span className="px-2 py-0.5 rounded-md bg-white border border-[#9FB2AC]/60 text-[11px] font-bold text-[#5D0D1A]">
                                  Module: {resItem.moduleId?.title || 'Assigned'}
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-extrabold text-[#5D0D1A] truncate">
                              {resItem.title}
                            </h4>

                            {resItem.description && (
                              <p className="text-xs text-[#5A6C66] font-medium line-clamp-2">
                                {resItem.description}
                              </p>
                            )}

                            {resItem.url && (
                              <a
                                href={resItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5D0D1A] hover:underline truncate max-w-full"
                              >
                                <Globe size={12} />
                                <span>{resItem.url}</span>
                              </a>
                            )}

                            {resItem.content && (
                              <p className="text-[11px] text-[#2D060D] font-mono bg-white p-2 rounded-lg border border-[#9FB2AC]/40 line-clamp-2">
                                {resItem.content}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditTextModal(resItem)}
                              className="p-2 rounded-xl bg-white text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#FFF9EB] transition-colors"
                              title="Edit Resource"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingText(resItem)}
                              className="p-2 rounded-xl bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                              title="Delete Resource"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= ADD / EDIT TEXT RESOURCE FORM MODAL ================= */}
      <AnimatePresence>
        {isTextFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <LinkIcon size={20} className="text-[#5D0D1A]" />
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">
                    {editingText ? 'Edit Resource' : 'Add Text Resource'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTextFormOpen(false)}
                  className="p-1.5 text-[#5A6C66] hover:text-[#5D0D1A] rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTextResource} className="space-y-4 overflow-y-auto flex-1 p-1">
                {/* Resource Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Resource Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Official React Hooks Documentation"
                    value={textFormState.title}
                    onChange={(e) => setTextFormState({ ...textFormState, title: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] focus:outline-none font-medium"
                  />
                </div>

                {/* Resource Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Resource Type *</label>
                  <select
                    value={textFormState.type}
                    onChange={(e) => setTextFormState({ ...textFormState, type: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="reference_link">Reference Link</option>
                    <option value="article">Article</option>
                    <option value="documentation">Official Documentation</option>
                    <option value="practice_website">Practice Website</option>
                    <option value="note">Mentor Note</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Short Description</label>
                  <textarea
                    rows={2}
                    placeholder="Key concepts or guidance regarding this resource..."
                    value={textFormState.description}
                    onChange={(e) => setTextFormState({ ...textFormState, description: e.target.value })}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-3 text-xs text-[#5D0D1A] focus:outline-none font-medium"
                  />
                </div>

                {/* Module Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5D0D1A]">Target Module *</label>
                  <select
                    required
                    value={textFormState.moduleId}
                    onChange={(e) => handleTextModuleChange(e.target.value)}
                    className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>-- Select Module --</option>
                    {textModulesList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Field: URL or Content */}
                {textFormState.type === 'note' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Mentor Note Content</label>
                    <textarea
                      rows={4}
                      placeholder="Write your text note, key formulas, or reference summary..."
                      value={textFormState.content}
                      onChange={(e) => setTextFormState({ ...textFormState, content: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-3 text-xs text-[#5D0D1A] font-mono focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Resource Web URL (http:// or https://) *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://react.dev/reference/react"
                      value={textFormState.url}
                      onChange={(e) => setTextFormState({ ...textFormState, url: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#9FB2AC]/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsTextFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={textSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm"
                  >
                    {textSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>{editingText ? 'Save Changes' : 'Add Resource'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE TEXT RESOURCE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingText && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Delete Resource?</h3>
              </div>

              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                Are you sure you want to delete <strong>"{deletingText.title}"</strong>?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingText(null)}
                  disabled={isDeletingText}
                  className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTextResource}
                  disabled={isDeletingText}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  {isDeletingText ? 'Deleting...' : 'Yes, Delete Resource'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= COURSE QUIZ MANAGEMENT MODAL ================= */}
      <AnimatePresence>
        {isQuizModalOpen && activeQuizCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#9FB2AC]/70 flex items-center justify-between bg-[#FFF9EB]/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#5D0D1A]">
                      Module Quizzes & Knowledge Checks
                    </h2>
                    <p className="text-xs text-[#5A6C66] font-medium truncate max-w-md">
                      Multiple choice quizzes for <strong>{activeQuizCourse.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddQuizModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                  >
                    <Plus size={15} />
                    <span>Create Quiz</span>
                  </button>

                  <button
                    onClick={() => setIsQuizModalOpen(false)}
                    className="p-2 text-[#5A6C66] hover:text-[#5D0D1A] rounded-xl hover:bg-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Quiz List Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {quizzesLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-[#9FB2AC]/20 rounded-2xl border border-[#9FB2AC]/30" />
                    ))}
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="p-8 text-center bg-[#FFF9EB]/50 rounded-2xl border border-[#9FB2AC]/60 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
                      <HelpCircle size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-[#5D0D1A]">No Quizzes Created Yet</h4>
                      <p className="text-xs text-[#5A6C66] font-medium max-w-sm mx-auto">
                        Build multiple-choice quizzes with options, marks, and explanations for course modules.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAddQuizModal}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-all"
                    >
                      <Plus size={15} />
                      <span>Create First Quiz</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quizItem) => {
                      const isPub = quizItem.status === 'published';
                      const qCount = quizItem.questions?.length || 0;
                      const maxMarks = quizItem.questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 0;

                      return (
                        <div
                          key={quizItem._id}
                          className="p-4 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 flex items-start justify-between gap-4 shadow-2xs hover:bg-[#FFF9EB] transition-all"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isPub ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {isPub ? 'Published' : 'Draft'}
                              </span>
                              {quizItem.moduleId && (
                                <span className="px-2 py-0.5 rounded-md bg-white border border-[#9FB2AC]/60 text-[11px] font-bold text-[#5D0D1A]">
                                  Module: {quizItem.moduleId?.title || 'Assigned'}
                                </span>
                              )}
                              <span className="text-[11px] font-semibold text-[#5A6C66]">
                                {qCount} Questions • {maxMarks} Marks Total
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-[#5D0D1A] truncate">
                              {quizItem.title}
                            </h4>

                            {quizItem.description && (
                              <p className="text-xs text-[#5A6C66] font-medium line-clamp-2">
                                {quizItem.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditQuizModal(quizItem)}
                              className="p-2 rounded-xl bg-white text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#FFF9EB] transition-colors"
                              title="Edit Quiz & Questions"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingQuiz(quizItem)}
                              className="p-2 rounded-xl bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                              title="Delete Quiz"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= ADD / EDIT QUIZ & QUESTION BUILDER FORM MODAL ================= */}
      <AnimatePresence>
        {isQuizFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <HelpCircle size={20} className="text-[#5D0D1A]" />
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">
                    {editingQuiz ? 'Edit Quiz & Questions' : 'Create New Course Quiz'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsQuizFormOpen(false)}
                  className="p-1.5 text-[#5A6C66] hover:text-[#5D0D1A] rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Scroll Body */}
              <form onSubmit={handleSaveQuiz} className="space-y-6 overflow-y-auto flex-1 p-1 custom-scrollbar">
                {/* Title & Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Quiz Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. React Hooks & Lifecycle Knowledge Check"
                      value={quizFormState.title}
                      onChange={(e) => setQuizFormState({ ...quizFormState, title: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Status *</label>
                    <select
                      value={quizFormState.status}
                      onChange={(e) => setQuizFormState({ ...quizFormState, status: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="draft">Draft (Private)</option>
                      <option value="published">Published (Visible to Students)</option>
                    </select>
                  </div>
                </div>

                {/* Description & Target Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Description</label>
                    <input
                      type="text"
                      placeholder="Brief instructions for students taking this quiz..."
                      value={quizFormState.description}
                      onChange={(e) => setQuizFormState({ ...quizFormState, description: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5D0D1A]">Target Module *</label>
                    <select
                      required
                      value={quizFormState.moduleId}
                      onChange={(e) => setQuizFormState({ ...quizFormState, moduleId: e.target.value })}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled>-- Select Module --</option>
                      {quizModulesList.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Questions Builder Section */}
                <div className="space-y-4 pt-4 border-t border-[#9FB2AC]/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider">
                      Questions ({quizFormState.questions.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddQuestionToQuizForm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold hover:bg-[#7A1424] transition-all"
                    >
                      <Plus size={14} />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {quizFormState.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="bg-[#FFF9EB]/70 rounded-2xl p-5 border border-[#9FB2AC] space-y-4 shadow-2xs relative"
                    >
                      <div className="flex items-center justify-between border-b border-[#9FB2AC]/40 pb-2">
                        <span className="font-extrabold text-xs text-[#5D0D1A]">
                          Question #{qIdx + 1}
                        </span>
                        {quizFormState.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionFromQuizForm(qIdx)}
                            className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Question Text & Marks */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[11px] font-bold text-[#5D0D1A]">Question Text *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Which Hook is used to handle side effects in React functional components?"
                            value={q.questionText}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'questionText', e.target.value)}
                            className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-2 text-xs text-[#5D0D1A] font-semibold focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#5D0D1A]">Marks</label>
                          <input
                            type="number"
                            min="1"
                            value={q.marks}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'marks', Math.max(1, Number(e.target.value)))}
                            className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-2 text-xs text-[#5D0D1A] font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 4 Option Choices Grid with Radio for Correct Option */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#5D0D1A]">
                          Options & Correct Answer (Select radio button for correct option):
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = Number(q.correctOptionIndex) === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-[#9FB2AC]/60'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-opt-${qIdx}`}
                                  checked={isCorrect}
                                  onChange={() => handleQuestionFieldChange(qIdx, 'correctOptionIndex', optIdx)}
                                  className="accent-[#5D0D1A] w-4 h-4 cursor-pointer"
                                />
                                <span className="font-bold text-xs text-[#5D0D1A] w-4">{String.fromCharCode(65 + optIdx)}</span>
                                <input
                                  type="text"
                                  required
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  value={opt}
                                  onChange={(e) => handleOptionFieldChange(qIdx, optIdx, e.target.value)}
                                  className="flex-1 bg-transparent text-xs font-semibold text-[#2D060D] outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#5D0D1A]">Mentor Explanation (Shown to students after submission)</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. useEffect is specifically designed to perform side effects such as data fetching and DOM mutations in function components."
                          value={q.explanation}
                          onChange={(e) => handleQuestionFieldChange(qIdx, 'explanation', e.target.value)}
                          className="w-full bg-white border border-[#9FB2AC] rounded-xl p-2.5 text-xs text-[#5D0D1A] font-medium focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#9FB2AC]/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsQuizFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quizSaving}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm"
                  >
                    {quizSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>{editingQuiz ? 'Save Quiz Changes' : 'Save Quiz'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE QUIZ CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingQuiz && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2D060D]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Delete Course Quiz?</h3>
              </div>

              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                Are you sure you want to delete <strong>"{deletingQuiz.title}"</strong>? This will also remove all student attempt records for this quiz.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingQuiz(null)}
                  disabled={isDeletingQuiz}
                  className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQuiz}
                  disabled={isDeletingQuiz}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  {isDeletingQuiz ? 'Deleting...' : 'Yes, Delete Quiz'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= FULL STUDENT-VIEW COURSE PREVIEW MODAL ================= */}
      <AnimatePresence>
        {previewState.isOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#2D060D]/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Top Banner Bar with Status & Actions */}
              <div className="p-5 bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-between border-b border-[#7A1424] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB]/15 text-[#FFF9EB] flex items-center justify-center border border-[#FFF9EB]/20">
                    <Eye size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#FFF9EB]/80">
                        Student View Preview Mode
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          previewState.courseData?.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                            : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                        }`}
                      >
                        Status: {previewState.courseData?.status === 'published' ? 'Published (Live)' : 'Draft (Private)'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#FFF9EB] truncate max-w-md mt-0.5">
                      {previewState.courseData?.title || 'Course Preview'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleStatusInPreview}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 ${
                      previewState.courseData?.status === 'published'
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        : 'bg-[#FFF9EB] text-[#5D0D1A] hover:bg-[#F7EED8]'
                    }`}
                  >
                    {previewState.courseData?.status === 'published' ? (
                      <>
                        <EyeOff size={14} />
                        <span>Revert to Draft</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Publish Course</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setPreviewState((prev) => ({ ...prev, isOpen: false }))}
                    className="p-2 rounded-xl bg-[#FFF9EB]/10 hover:bg-[#FFF9EB]/20 text-[#FFF9EB] transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              {previewState.loading || !previewState.courseData ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-[#5D0D1A]">Loading course preview...</p>
                </div>
              ) : (
                <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                  {/* Course Header Banner */}
                  <div className="bg-[#FFF9EB]/50 rounded-[24px] p-6 border border-[#9FB2AC] space-y-6">
                    {previewState.courseData.thumbnail && (
                      <div className="w-full max-h-72 rounded-2xl overflow-hidden border border-[#9FB2AC] shadow-xs bg-[#f5f5f5] flex items-center justify-center">
                        <img
                          src={previewState.courseData.thumbnail}
                          alt={previewState.courseData.title}
                          className="w-full h-auto max-h-72 object-contain object-center block"
                        />
                      </div>
                    )}
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold">
                            {previewState.courseData.category}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white text-[#5D0D1A] text-xs font-bold border border-[#9FB2AC]">
                            {previewState.courseData.difficulty}
                          </span>
                          {previewState.courseData.language && (
                            <span className="px-3 py-1 rounded-full bg-[#9FB2AC]/20 text-[#2D060D] text-xs font-bold">
                              {previewState.courseData.language}
                            </span>
                          )}
                        </div>

                        <h2 className="text-2xl font-black text-[#5D0D1A]">
                          {previewState.courseData.title}
                        </h2>

                        <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                          {previewState.courseData.detailedDescription || previewState.courseData.shortDescription || previewState.courseData.description}
                        </p>
                      </div>

                      {/* Stats & Mentor Tag */}
                      <div className="bg-white rounded-2xl p-4 border border-[#9FB2AC] space-y-3 min-w-[220px] shrink-0">
                        <h4 className="text-[11px] font-black text-[#5D0D1A] uppercase tracking-wider">Instructor Overview</h4>
                        <div className="flex items-center gap-2.5">
                          {previewState.courseData.mentorId?.profilePhoto ? (
                            <img
                              src={previewState.courseData.mentorId.profilePhoto}
                              alt="Mentor"
                              className="w-9 h-9 rounded-full object-cover border border-[#9FB2AC]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center font-bold text-xs border border-[#9FB2AC]">
                              <User size={16} />
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-extrabold text-[#5D0D1A]">
                              {previewState.courseData.mentorId?.fullName || previewState.courseData.mentorId?.name || 'Mentor'}
                            </div>
                            <div className="text-[10px] text-[#5A6C66] font-semibold">
                              {previewState.courseData.mentorId?.title || previewState.courseData.mentorId?.professionalTitle || 'Course Instructor'}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-[#9FB2AC]/30 pt-2 text-xs space-y-1 font-medium text-[#5A6C66]">
                          <div>Duration: <strong>{previewState.courseData.duration || 'Flexible'}</strong></div>
                          <div>Modules: <strong>{previewState.courseData.modules?.length || 0}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Skills & Objectives */}
                    {previewState.courseData?.skills && (Array.isArray(previewState.courseData.skills) ? previewState.courseData.skills.length > 0 : (typeof previewState.courseData.skills === 'string' && previewState.courseData.skills.trim().length > 0)) && (
                      <div className="pt-3 border-t border-[#9FB2AC]/30 space-y-2">
                        <h4 className="text-xs font-bold text-[#5D0D1A]">Skills Covered:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(previewState.courseData.skills)
                            ? previewState.courseData.skills
                            : typeof previewState.courseData.skills === 'string'
                            ? previewState.courseData.skills.split(',').map((s) => s.trim()).filter(Boolean)
                            : []
                          ).map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-[#9FB2AC] text-[#5D0D1A] text-xs font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modules Curriculum Tree */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-[#5D0D1A] flex items-center gap-2">
                      <Layers size={20} />
                      <span>Curriculum Preview</span>
                    </h3>

                    {!previewState.courseData?.modules || !Array.isArray(previewState.courseData.modules) || previewState.courseData.modules.length === 0 ? (
                      <div className="p-8 bg-[#FFF9EB]/40 rounded-2xl border border-[#9FB2AC] text-center text-xs text-[#5A6C66] font-medium">
                        No modules created yet. Add modules to complete the course structure.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {previewState.courseData.modules.map((mItem, mIdx) => {
                          const isExpanded = previewState.expandedModules?.[mItem._id];
                          const lesCount = Array.isArray(mItem.lessons) ? mItem.lessons.length : 0;
                          const pdfCount = Array.isArray(mItem.pdfResources) ? mItem.pdfResources.length : 0;
                          const quizCount = Array.isArray(mItem.quizzes) ? mItem.quizzes.length : 0;
                          const textCount = Array.isArray(mItem.textResources) ? mItem.textResources.length : 0;

                          return (
                            <div key={mItem._id || mIdx} className="bg-white rounded-2xl border border-[#9FB2AC] shadow-2xs overflow-hidden">
                              <div
                                onClick={() => togglePreviewModuleExpand(mItem._id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FFF9EB]/40 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center font-bold text-xs shrink-0">
                                    {mIdx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-extrabold text-[#5D0D1A] truncate">{mItem.title}</h4>
                                    {mItem.description && (
                                      <p className="text-xs text-[#5A6C66] truncate font-medium">{mItem.description}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-[#5A6C66]">
                                    <span>{lesCount} Lessons</span>
                                    {pdfCount > 0 && <span>• {pdfCount} PDFs</span>}
                                    {quizCount > 0 && <span>• {quizCount} Quizzes</span>}
                                    {textCount > 0 && <span>• {textCount} Links/Notes</span>}
                                  </div>
                                  <ChevronDown size={18} className={`text-[#5D0D1A] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>

                              {/* Expanded Module Items */}
                              {isExpanded && (
                                <div className="p-4 border-t border-[#9FB2AC]/40 bg-[#FFF9EB]/20 space-y-4">
                                  {/* PDF Resources */}
                                  {Array.isArray(mItem.pdfResources) && mItem.pdfResources.length > 0 && (
                                    <div className="space-y-2">
                                      <h5 className="text-[11px] font-black uppercase text-[#5D0D1A] flex items-center gap-1.5">
                                        <FileText size={13} />
                                        <span>PDF Learning Resources</span>
                                      </h5>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {mItem.pdfResources.map((pdf, pIdx) => (
                                          <div key={pdf._id || pIdx} className="p-3 bg-white rounded-xl border border-[#9FB2AC] flex items-center justify-between text-xs">
                                            <span className="font-bold text-[#5D0D1A] truncate">{pdf.title}</span>
                                            <span className="text-[10px] text-[#5A6C66] font-semibold">PDF File</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Text Lessons */}
                                  {Array.isArray(mItem.lessons) && mItem.lessons.length > 0 && (
                                    <div className="space-y-2">
                                      <h5 className="text-[11px] font-black uppercase text-[#5D0D1A] flex items-center gap-1.5">
                                        <BookOpen size={13} />
                                        <span>Text Lessons</span>
                                      </h5>
                                      <div className="space-y-1.5">
                                        {mItem.lessons.map((les, lIdx) => (
                                          <div key={les._id || lIdx} className="p-3 bg-white rounded-xl border border-[#9FB2AC]/60 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                              <span className="w-5 h-5 rounded-full bg-[#FFF9EB] text-[#5D0D1A] font-bold text-[10px] flex items-center justify-center border border-[#9FB2AC]">
                                                {lIdx + 1}
                                              </span>
                                              <span className="font-bold text-[#2D060D] truncate">{les.title}</span>
                                            </div>
                                            <span className="text-[10px] font-medium text-[#5A6C66]">{les.duration || '10 min read'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Quizzes */}
                                  {Array.isArray(mItem.quizzes) && mItem.quizzes.length > 0 && (
                                    <div className="space-y-2">
                                      <h5 className="text-[11px] font-black uppercase text-[#5D0D1A] flex items-center gap-1.5">
                                        <Award size={13} />
                                        <span>Quizzes & Knowledge Checks</span>
                                      </h5>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {mItem.quizzes.map((qz, qIdx) => (
                                          <div key={qz._id || qIdx} className="p-3 bg-white rounded-xl border border-[#9FB2AC] space-y-1 text-xs">
                                            <div className="flex items-center justify-between">
                                              <span className="font-extrabold text-[#5D0D1A] truncate">{qz.title}</span>
                                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-black uppercase">
                                                {Array.isArray(qz.questions) ? qz.questions.length : 0} Questions
                                              </span>
                                            </div>
                                            {qz.description && <p className="text-[11px] text-[#5A6C66] truncate">{qz.description}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Text & Reference Resources */}
                                  {Array.isArray(mItem.textResources) && mItem.textResources.length > 0 && (
                                    <div className="space-y-2">
                                      <h5 className="text-[11px] font-black uppercase text-[#5D0D1A] flex items-center gap-1.5">
                                        <LinkIcon size={13} />
                                        <span>Articles, Documentation & Assignments</span>
                                      </h5>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {mItem.textResources.map((tr, tIdx) => (
                                          <div key={tr._id || tIdx} className="p-3 bg-white rounded-xl border border-[#9FB2AC] space-y-1 text-xs">
                                            <div className="flex items-center gap-1.5">
                                              <span className="px-2 py-0.5 rounded-full bg-[#5D0D1A] text-[#FFF9EB] text-[9px] font-black uppercase">
                                                {tr.type}
                                              </span>
                                              <span className="font-extrabold text-[#5D0D1A] truncate">{tr.title}</span>
                                            </div>
                                            {tr.description && <p className="text-[11px] text-[#5A6C66] truncate">{tr.description}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Modal Bar */}
              <div className="p-4 bg-[#FFF9EB] border-t border-[#9FB2AC]/40 flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => setPreviewState((prev) => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold shadow-xs"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};



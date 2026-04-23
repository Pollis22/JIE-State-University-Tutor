import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Calendar, CheckSquare, BarChart3, Settings, Plus, Trash2,
  Edit2, ChevronLeft, ChevronRight, GraduationCap, Sparkles,
  Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, Mail, Users, Upload, FileText, X
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO } from "date-fns";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Course {
  id: string;
  courseName: string;
  courseCode: string | null;
  instructor: string | null;
  semester: string | null;
  color: string | null;
  isActive: boolean;
  eventCount: number;
  nextDeadline: CalendarEvent | null;
}

interface CalendarEvent {
  id: string;
  courseId: string | null;
  title: string;
  eventType: string | null;
  description: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  isAllDay: boolean;
  isFromSyllabus: boolean;
  priority: string | null;
  status: string | null;
  notes: string | null;
  courseName?: string | null;
  courseColor?: string | null;
  courseCode?: string | null;
}

interface Task {
  id: string;
  courseId: string | null;
  eventId: string | null;
  title: string;
  taskType: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  notes: string | null;
  courseName?: string | null;
  courseColor?: string | null;
}

interface EngagementData {
  weekStart: string;
  sessionsCompleted: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksMissed: number;
  totalStudyMinutes: number;
  engagementScore: number;
  riskLevel: string;
  trend: string;
  streak: number;
}

interface ParentShare {
  id: string;
  parentEmail: string;
  parentName: string | null;
  shareFrequency: string | null;
  isActive: boolean;
}

interface DashboardSummary {
  upcomingEvents: number;
  pendingTasks: number;
  overdueTasks: number;
  engagementScore: number;
  riskLevel: string;
  activeCourses: number;
  pendingReminders: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Color palette for courses
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COURSE_COLORS = [
  "#C5050C", "#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2", "#be185d", "#854d0e"
];

function getStatusColor(status: string | null, dueDate: string | null) {
  const today = new Date().toISOString().split("T")[0];
  if (status === "completed") return "text-green-600";
  if (dueDate && dueDate < today && status !== "completed") return "text-red-600";
  if (dueDate && dueDate === today) return "text-amber-600";
  return "text-foreground";
}

function getRiskBadge(level: string) {
  switch (level) {
    case "on_track": return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
    case "needs_attention": return <Badge className="bg-yellow-100 text-yellow-800">Needs Attention</Badge>;
    case "at_risk": return <Badge className="bg-orange-100 text-orange-800">At Risk</Badge>;
    case "critical": return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
    default: return <Badge variant="secondary">N/A</Badge>;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AcademicDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ━━━ State ━━━
  const [activeTab, setActiveTab] = useState("courses");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showSyllabusDialog, setShowSyllabusDialog] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState<CalendarEvent | null>(null);
  const [showEditCourse, setShowEditCourse] = useState<Course | null>(null);
  const [showAddParent, setShowAddParent] = useState(false);
  const [selectedCourseForSyllabus, setSelectedCourseForSyllabus] = useState<string | null>(null);
  const [syllabusText, setSyllabusText] = useState("");
  const [taskFilter, setTaskFilter] = useState<{ courseId?: string; status?: string }>({});
  const [addCourseStep, setAddCourseStep] = useState<"info" | "syllabus">("info");
  const [newlyCreatedCourseId, setNewlyCreatedCourseId] = useState<string | null>(null);
  const [addCourseSyllabusText, setAddCourseSyllabusText] = useState("");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusUploadMode, setSyllabusUploadMode] = useState<"paste" | "file">("paste");
  const syllabusFileRef = useRef<HTMLInputElement>(null);
  const existingSyllabusFileRef = useRef<HTMLInputElement>(null);
  const [existingSyllabusFile, setExistingSyllabusFile] = useState<File | null>(null);
  const [existingSyllabusUploadMode, setExistingSyllabusUploadMode] = useState<"paste" | "file">("paste");

  // File upload mutation — uploads to /api/documents/upload so it appears in Study Materials
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, courseId }: { file: File; courseId: string }) => {
      // Step 1: Upload to documents system
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", `Syllabus: ${file.name}`);
      formData.append("subject", "syllabus");
      const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: formData, credentials: "include" });
      if (!uploadRes.ok) throw new Error("File upload failed");
      const uploadData = await uploadRes.json();

      // Step 2: Get extracted text from the uploaded document
      const contentRes = await fetch(`/api/documents/${uploadData.id}/content`, { credentials: "include" });
      if (!contentRes.ok) throw new Error("Could not read uploaded file");
      const contentData = await contentRes.json();
      const extractedText = contentData.content || contentData.text || "";

      if (!extractedText || extractedText.length < 20) {
        throw new Error("Could not extract enough text from the file. Try pasting the syllabus text instead.");
      }

      // Step 3: Process with syllabus AI parser
      const parseRes = await apiRequest("POST", `/api/academic/courses/${courseId}/syllabus`, { syllabusText: extractedText });
      return parseRes.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowSyllabusDialog(false);
      setShowAddCourse(false);
      setAddCourseStep("info");
      setSyllabusFile(null);
      setExistingSyllabusFile(null);
      toast({ title: "Syllabus processed!", description: `Created ${data.eventsCreated} events and ${data.tasksCreated} study tasks. File saved to Study Materials.` });
    },
    onError: (err: Error) => toast({ title: "Error processing file", description: err.message, variant: "destructive" }),
  });

  // Form state
  const [courseForm, setCourseForm] = useState({ courseName: "", courseCode: "", instructor: "", semester: "", color: COURSE_COLORS[0] });
  const [eventForm, setEventForm] = useState({ courseId: "", title: "", eventType: "custom", startDate: "", startTime: "", endTime: "", description: "", location: "", priority: "medium" });
  const [taskForm, setTaskForm] = useState({ courseId: "", title: "", taskType: "custom", dueDate: "", priority: "medium", estimatedMinutes: "", notes: "" });
  const [parentForm, setParentForm] = useState({ parentEmail: "", parentName: "", shareFrequency: "weekly" });

  // ━━━ Queries ━━━
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/academic/dashboard-summary"],
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/academic/courses"],
  });

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/academic/events"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/academic/tasks"],
  });

  const { data: engagement } = useQuery<EngagementData>({
    queryKey: ["/api/academic/engagement/current"],
  });

  const { data: engagementHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/academic/engagement"],
  });

  const { data: parentShares = [] } = useQuery<ParentShare[]>({
    queryKey: ["/api/academic/parent-shares"],
  });

  // ━━━ Mutations ━━━
  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/academic/courses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      setShowAddCourse(false);
      setCourseForm({ courseName: "", courseCode: "", instructor: "", semester: "", color: COURSE_COLORS[courses.length % COURSE_COLORS.length] });
      toast({ title: "Course added" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/academic/courses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/courses"] });
      setShowEditCourse(null);
      toast({ title: "Course updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/academic/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      toast({ title: "Course removed" });
    },
  });

  const processSyllabusMutation = useMutation({
    mutationFn: async ({ courseId, syllabusText }: { courseId: string; syllabusText: string }) => {
      const res = await apiRequest("POST", `/api/academic/courses/${courseId}/syllabus`, { syllabusText });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      setShowSyllabusDialog(false);
      setSyllabusText("");
      toast({ title: "Syllabus processed!", description: `Created ${data.eventsCreated} events and ${data.tasksCreated} study tasks.` });
    },
    onError: (err: Error) => toast({ title: "Error processing syllabus", description: err.message, variant: "destructive" }),
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/academic/events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      setShowAddEvent(false);
      setEventForm({ courseId: "", title: "", eventType: "custom", startDate: "", startTime: "", endTime: "", description: "", location: "", priority: "medium" });
      toast({ title: "Event created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/academic/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/events"] });
      setShowEventDetail(null);
      toast({ title: "Event updated" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/academic/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      setShowEventDetail(null);
      toast({ title: "Event deleted" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/academic/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      setShowAddTask(false);
      setTaskForm({ courseId: "", title: "", taskType: "custom", dueDate: "", priority: "medium", estimatedMinutes: "", notes: "" });
      toast({ title: "Task created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/academic/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic/engagement/current"] });
    },
  });

  const addParentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/academic/parent-shares", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/parent-shares"] });
      setShowAddParent(false);
      setParentForm({ parentEmail: "", parentName: "", shareFrequency: "weekly" });
      toast({ title: "Parent added" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeParentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/academic/parent-shares/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic/parent-shares"] });
      toast({ title: "Parent removed" });
    },
  });

  // ━━━ Calendar helpers ━━━
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 = Sunday

  function getEventsForDay(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter(e => e.startDate === dateStr);
  }

  // ━━━ Filtered tasks ━━━
  const filteredTasks = tasks.filter(t => {
    if (taskFilter.courseId && t.courseId !== taskFilter.courseId) return false;
    if (taskFilter.status && t.status !== taskFilter.status) return false;
    return true;
  });

  const today = new Date().toISOString().split("T")[0];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-8 w-8" style={{ color: "#C5050C" }} />
              Student Relationship Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage your courses, calendar, and study plan</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/academic-dashboard/notifications")}>
            🔔 Notifications
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Active Courses</div>
              <div className="text-2xl font-bold">{summaryLoading ? <Skeleton className="h-8 w-12" /> : summary?.activeCourses || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Upcoming Events</div>
              <div className="text-2xl font-bold">{summaryLoading ? <Skeleton className="h-8 w-12" /> : summary?.upcomingEvents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Pending Tasks</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {summaryLoading ? <Skeleton className="h-8 w-12" /> : summary?.pendingTasks || 0}
                {(summary?.overdueTasks || 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">{summary?.overdueTasks} overdue</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Engagement</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {summaryLoading ? <Skeleton className="h-8 w-12" /> : (
                  <>
                    <span style={{ color: (summary?.engagementScore || 0) >= 70 ? "#16a34a" : (summary?.engagementScore || 0) >= 50 ? "#ca8a04" : "#dc2626" }}>
                      {Math.round(summary?.engagementScore || 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="courses" className="gap-1"><BookOpen className="h-4 w-4" /> Courses</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1"><Calendar className="h-4 w-4" /> Calendar</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1"><CheckSquare className="h-4 w-4" /> Tasks</TabsTrigger>
            <TabsTrigger value="engagement" className="gap-1"><BarChart3 className="h-4 w-4" /> Engagement</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings className="h-4 w-4" /> Sharing</TabsTrigger>
          </TabsList>

          {/* ━━━ COURSES TAB ━━━ */}
          <TabsContent value="courses">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Courses</h2>
              <Button onClick={() => { setCourseForm({ ...courseForm, color: COURSE_COLORS[courses.length % COURSE_COLORS.length] }); setShowAddCourse(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Course
              </Button>
            </div>

            {coursesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                  <p className="text-muted-foreground mb-4">Add a course and upload your syllabus to get started</p>
                  <Button onClick={() => setShowAddCourse(true)}><Plus className="h-4 w-4 mr-1" /> Add Your First Course</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: course.color || "#666" }} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{course.courseName}</CardTitle>
                          {course.courseCode && <CardDescription>{course.courseCode}</CardDescription>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowEditCourse(course)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCourseMutation.mutate(course.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {course.instructor && <p className="text-sm text-muted-foreground mb-1">Instructor: {course.instructor}</p>}
                      {course.semester && <p className="text-sm text-muted-foreground mb-2">{course.semester}</p>}
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span>{course.eventCount} events</span>
                        {course.nextDeadline && (
                          <span className="text-amber-600">Next: {course.nextDeadline.title} ({course.nextDeadline.startDate})</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => { setSelectedCourseForSyllabus(course.id); setShowSyllabusDialog(true); }}
                      >
                        <Sparkles className="h-4 w-4 mr-1" /> Upload Syllabus
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ━━━ CALENDAR TAB ━━━ */}
          <TabsContent value="calendar">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {format(calendarMonth, "MMMM yyyy")}
                </h2>
                <Button variant="outline" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setShowAddEvent(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Event
              </Button>
            </div>

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="grid grid-cols-7 gap-px bg-muted">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="bg-background p-2 text-center text-sm font-medium text-muted-foreground">
                      {d}
                    </div>
                  ))}
                  {/* Empty cells for offset */}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-background p-2 min-h-[80px]" />
                  ))}
                  {daysInMonth.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentDay = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`bg-background p-1 sm:p-2 min-h-[80px] ${isCurrentDay ? "ring-2 ring-primary ring-inset" : ""}`}
                      >
                        <div className={`text-xs sm:text-sm mb-1 ${isCurrentDay ? "font-bold text-primary" : ""}`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((evt) => {
                            const color = evt.courseColor || "#666";
                            const isOverdue = evt.status !== "completed" && evt.startDate < today;
                            const isDueToday = evt.startDate === today;
                            return (
                              <div
                                key={evt.id}
                                className={`text-xs rounded px-1 py-0.5 truncate cursor-pointer hover:opacity-80 ${
                                  evt.status === "completed" ? "line-through opacity-60" : ""
                                }`}
                                style={{
                                  background: isOverdue ? "#fecaca" : isDueToday ? "#fef3c7" : `${color}20`,
                                  color: isOverdue ? "#dc2626" : isDueToday ? "#92400e" : color,
                                  borderLeft: `3px solid ${isOverdue ? "#dc2626" : isDueToday ? "#d97706" : color}`,
                                }}
                                onClick={() => setShowEventDetail(evt)}
                              >
                                {evt.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Agenda List */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {events.filter(e => e.startDate >= today && e.status === "upcoming").length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No upcoming events</p>
                ) : (
                  <div className="space-y-2">
                    {events
                      .filter(e => e.startDate >= today && e.status === "upcoming")
                      .slice(0, 10)
                      .map((evt) => (
                        <div key={evt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => setShowEventDetail(evt)}>
                          <div className="w-1 h-10 rounded" style={{ background: evt.courseColor || "#666" }} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{evt.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {evt.startDate}{evt.startTime ? ` at ${evt.startTime}` : ""} {evt.courseName ? `- ${evt.courseName}` : ""}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">{evt.eventType}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ━━━ TASKS TAB ━━━ */}
          <TabsContent value="tasks">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Study Tasks</h2>
              <div className="flex gap-2 flex-wrap">
                <Select value={taskFilter.courseId || "all"} onValueChange={v => setTaskFilter(f => ({ ...f, courseId: v === "all" ? undefined : v }))}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Courses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={taskFilter.status || "all"} onValueChange={v => setTaskFilter(f => ({ ...f, status: v === "all" ? undefined : v }))}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowAddTask(true)}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tasks found. Upload a syllabus to auto-generate study tasks.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < today && task.status !== "completed" && task.status !== "skipped";
                  return (
                    <Card key={task.id} className={`${task.status === "completed" ? "opacity-60" : ""}`}>
                      <CardContent className="flex items-center gap-3 py-3 px-4">
                        <input
                          type="checkbox"
                          checked={task.status === "completed"}
                          onChange={() => {
                            updateTaskMutation.mutate({
                              id: task.id,
                              status: task.status === "completed" ? "pending" : "completed",
                            });
                          }}
                          className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                        />
                        <div className="w-1 h-8 rounded" style={{ background: task.courseColor || "#666" }} />
                        <div className="flex-1">
                          <div className={`font-medium ${task.status === "completed" ? "line-through" : ""} ${isOverdue ? "text-red-600" : ""}`}>
                            {task.title}
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            {task.courseName && <span>{task.courseName}</span>}
                            {task.dueDate && <span>Due: {task.dueDate}</span>}
                            {task.estimatedMinutes && <span>{task.estimatedMinutes} min</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                          {task.priority === "high" && <Badge className="bg-red-100 text-red-800 text-xs">High</Badge>}
                          {task.status === "in_progress" && <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>}
                          <Button variant="outline" size="sm" onClick={() => setLocation("/tutor")}>
                            Study Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ━━━ ENGAGEMENT TAB ━━━ */}
          <TabsContent value="engagement">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="md:col-span-1">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">This Week's Score</div>
                  <div className="text-5xl font-bold" style={{
                    color: (engagement?.engagementScore || 0) >= 70 ? "#16a34a" : (engagement?.engagementScore || 0) >= 50 ? "#ca8a04" : "#dc2626"
                  }}>
                    {Math.round(engagement?.engagementScore || 0)}
                  </div>
                  <div className="text-lg text-muted-foreground">/100</div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {engagement?.trend === "improving" && <><TrendingUp className="h-4 w-4 text-green-600" /><span className="text-sm text-green-600">Improving</span></>}
                    {engagement?.trend === "declining" && <><TrendingDown className="h-4 w-4 text-red-600" /><span className="text-sm text-red-600">Declining</span></>}
                    {engagement?.trend === "stable" && <><Minus className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Stable</span></>}
                  </div>
                  <div className="mt-3">
                    {engagement?.riskLevel && getRiskBadge(engagement.riskLevel)}
                  </div>
                  {(engagement?.streak || 0) > 0 && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      {engagement?.streak} week streak
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">This Week's Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Sessions Completed</div>
                      <div className="text-2xl font-bold">{engagement?.sessionsCompleted || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tasks Completed</div>
                      <div className="text-2xl font-bold">{engagement?.tasksCompleted || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Study Minutes</div>
                      <div className="text-2xl font-bold">{engagement?.totalStudyMinutes || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tasks Pending</div>
                      <div className="text-2xl font-bold">{engagement?.tasksPending || 0}</div>
                      {(engagement?.tasksMissed || 0) > 0 && (
                        <div className="text-xs text-red-600">{engagement?.tasksMissed} missed</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly History</CardTitle>
              </CardHeader>
              <CardContent>
                {engagementHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No history yet. Keep studying to build your streak!</p>
                ) : (
                  <div className="flex gap-2 items-end h-40">
                    {engagementHistory.slice().reverse().map((entry: any, i: number) => {
                      const score = Number(entry.engagementScore);
                      const height = Math.max(score, 5);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">{Math.round(score)}</span>
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${height}%`,
                              background: score >= 70 ? "#16a34a" : score >= 50 ? "#ca8a04" : score >= 30 ? "#ea580c" : "#dc2626",
                            }}
                          />
                          <span className="text-xs text-muted-foreground">{entry.weekStart?.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ━━━ SETTINGS/SHARING TAB ━━━ */}
          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Parent/Guardian Sharing</CardTitle>
                  <CardDescription>Share your progress with parents or guardians (up to 3)</CardDescription>
                </CardHeader>
                <CardContent>
                  {parentShares.filter(p => p.isActive).length === 0 ? (
                    <p className="text-muted-foreground text-sm mb-4">No parent emails added yet.</p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {parentShares.filter(p => p.isActive).map((share) => (
                        <div key={share.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                          <div>
                            <div className="font-medium text-sm">{share.parentEmail}</div>
                            {share.parentName && <div className="text-xs text-muted-foreground">{share.parentName}</div>}
                            <Badge variant="outline" className="text-xs mt-1">{share.shareFrequency}</Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeParentMutation.mutate(share.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {parentShares.filter(p => p.isActive).length < 3 && (
                    <Button variant="outline" onClick={() => setShowAddParent(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Parent Email
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Reminder Preferences</CardTitle>
                  <CardDescription>Control how you receive SRM reminders</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Reminders are automatically generated based on your calendar events:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Exam reminders: 7, 3, and 1 day before</li>
                    <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Assignment reminders: 3 and 1 day before</li>
                    <li className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-blue-500" /> Study task reminders: morning of due date</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ━━━ DIALOGS ━━━ */}

      {/* Add Course Dialog — 2-step: course info → optional syllabus */}
      <Dialog open={showAddCourse} onOpenChange={(open) => { setShowAddCourse(open); if (!open) { setAddCourseStep("info"); setSyllabusFile(null); setAddCourseSyllabusText(""); setSyllabusUploadMode("paste"); } }}>
        <DialogContent className={addCourseStep === "syllabus" ? "max-w-2xl" : ""}>
          <DialogHeader>
            <DialogTitle>{addCourseStep === "info" ? "Add Course" : "Upload Syllabus (Optional)"}</DialogTitle>
            <DialogDescription>
              {addCourseStep === "info"
                ? "Add a new course to your SRM planner"
                : "Upload a file or paste your syllabus text. Your tutor will extract all dates, exams, and assignments automatically."}
            </DialogDescription>
          </DialogHeader>

          {addCourseStep === "info" ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Course Name *</Label>
                  <Input value={courseForm.courseName} onChange={e => setCourseForm(f => ({ ...f, courseName: e.target.value }))} placeholder="e.g. Organic Chemistry II" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Course Code</Label>
                    <Input value={courseForm.courseCode} onChange={e => setCourseForm(f => ({ ...f, courseCode: e.target.value }))} placeholder="e.g. CHEM 344" />
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Input value={courseForm.semester} onChange={e => setCourseForm(f => ({ ...f, semester: e.target.value }))} placeholder="e.g. Spring 2026" />
                  </div>
                </div>
                <div>
                  <Label>Instructor</Label>
                  <Input value={courseForm.instructor} onChange={e => setCourseForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Professor name" />
                </div>
              </div>
              <DialogFooter>
                <div className="flex w-full justify-between gap-2">
                  <Button variant="outline" onClick={() => setShowAddCourse(false)}>Cancel</Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => createCourseMutation.mutate(courseForm)}
                      disabled={!courseForm.courseName || createCourseMutation.isPending}
                    >
                      {createCourseMutation.isPending ? "Adding..." : "Skip Syllabus"}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!courseForm.courseName) return;
                        try {
                          const res = await apiRequest("POST", "/api/academic/courses", courseForm);
                          const newCourse = await res.json();
                          queryClient.invalidateQueries({ queryKey: ["/api/academic/courses"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/academic/dashboard-summary"] });
                          setNewlyCreatedCourseId(newCourse.id);
                          setAddCourseStep("syllabus");
                          toast({ title: "Course created! Now add your syllabus." });
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        }
                      }}
                      disabled={!courseForm.courseName || createCourseMutation.isPending}
                    >
                      <Sparkles className="h-4 w-4 mr-1" /> Next: Add Syllabus
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4">
                {/* Toggle: Paste vs Upload */}
                <div className="flex gap-2">
                  <Button variant={syllabusUploadMode === "paste" ? "default" : "outline"} size="sm" onClick={() => setSyllabusUploadMode("paste")}>
                    <FileText className="h-4 w-4 mr-1" /> Paste Text
                  </Button>
                  <Button variant={syllabusUploadMode === "file" ? "default" : "outline"} size="sm" onClick={() => setSyllabusUploadMode("file")}>
                    <Upload className="h-4 w-4 mr-1" /> Upload File
                  </Button>
                </div>

                {syllabusUploadMode === "paste" ? (
                  <>
                    <Textarea
                      value={addCourseSyllabusText}
                      onChange={e => setAddCourseSyllabusText(e.target.value)}
                      placeholder="Paste your full syllabus text here — include all dates, assignments, exams, and deadlines..."
                      className="min-h-[250px] font-mono text-sm"
                    />
                    {addCourseSyllabusText && (
                      <p className="text-xs text-muted-foreground">{addCourseSyllabusText.length.toLocaleString()} characters</p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => syllabusFileRef.current?.click()}
                    >
                      {syllabusFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-6 w-6 text-primary" />
                          <span className="font-medium">{syllabusFile.name}</span>
                          <span className="text-sm text-muted-foreground">({(syllabusFile.size / 1024).toFixed(0)} KB)</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSyllabusFile(null); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                          <p className="font-medium">Click to upload syllabus</p>
                          <p className="text-sm text-muted-foreground mt-1">PDF, Word, PowerPoint, Text, Images, or Excel</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={syllabusFileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp"
                      onChange={(e) => { if (e.target.files?.[0]) setSyllabusFile(e.target.files[0]); }}
                    />
                    <p className="text-xs text-muted-foreground">File will also be saved to your Study Materials for use during tutoring sessions.</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <div className="flex w-full justify-between gap-2">
                  <Button variant="outline" onClick={() => { setShowAddCourse(false); setAddCourseStep("info"); setAddCourseSyllabusText(""); setSyllabusFile(null); setCourseForm({ courseName: "", courseCode: "", instructor: "", semester: "", color: COURSE_COLORS[courses.length % COURSE_COLORS.length] }); }}>
                    Skip — I'll Add Later
                  </Button>
                  {syllabusUploadMode === "paste" ? (
                    <Button
                      onClick={() => {
                        if (newlyCreatedCourseId && addCourseSyllabusText) {
                          processSyllabusMutation.mutate({ courseId: newlyCreatedCourseId, syllabusText: addCourseSyllabusText });
                          setAddCourseStep("info");
                          setAddCourseSyllabusText("");
                          setCourseForm({ courseName: "", courseCode: "", instructor: "", semester: "", color: COURSE_COLORS[courses.length % COURSE_COLORS.length] });
                        }
                      }}
                      disabled={!addCourseSyllabusText || processSyllabusMutation.isPending}
                    >
                      {processSyllabusMutation.isPending ? (
                        <><Sparkles className="h-4 w-4 mr-1 animate-pulse" /> Processing...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-1" /> Process with Tutor</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (newlyCreatedCourseId && syllabusFile) {
                          uploadFileMutation.mutate({ file: syllabusFile, courseId: newlyCreatedCourseId });
                        }
                      }}
                      disabled={!syllabusFile || uploadFileMutation.isPending}
                    >
                      {uploadFileMutation.isPending ? (
                        <><Sparkles className="h-4 w-4 mr-1 animate-pulse" /> Uploading &amp; Processing...</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-1" /> Upload &amp; Process</>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={!!showEditCourse} onOpenChange={() => setShowEditCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {showEditCourse && (
            <div className="space-y-4">
              <div>
                <Label>Course Name</Label>
                <Input defaultValue={showEditCourse.courseName} id="edit-courseName" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Course Code</Label>
                  <Input defaultValue={showEditCourse.courseCode || ""} id="edit-courseCode" />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Input defaultValue={showEditCourse.semester || ""} id="edit-semester" />
                </div>
              </div>
              <div>
                <Label>Instructor</Label>
                <Input defaultValue={showEditCourse.instructor || ""} id="edit-instructor" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCourse(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!showEditCourse) return;
              updateCourseMutation.mutate({
                id: showEditCourse.id,
                courseName: (document.getElementById("edit-courseName") as HTMLInputElement)?.value,
                courseCode: (document.getElementById("edit-courseCode") as HTMLInputElement)?.value,
                semester: (document.getElementById("edit-semester") as HTMLInputElement)?.value,
                instructor: (document.getElementById("edit-instructor") as HTMLInputElement)?.value,
              });
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Syllabus Upload Dialog */}
      <Dialog open={showSyllabusDialog} onOpenChange={(open) => { setShowSyllabusDialog(open); if (!open) { setSyllabusText(""); setExistingSyllabusFile(null); setExistingSyllabusUploadMode("paste"); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Syllabus</DialogTitle>
            <DialogDescription>
              Upload a file or paste your syllabus text. Your tutor will extract all dates, exams, assignments, and create your calendar and study plan automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toggle: Paste vs Upload */}
            <div className="flex gap-2">
              <Button variant={existingSyllabusUploadMode === "paste" ? "default" : "outline"} size="sm" onClick={() => setExistingSyllabusUploadMode("paste")}>
                <FileText className="h-4 w-4 mr-1" /> Paste Text
              </Button>
              <Button variant={existingSyllabusUploadMode === "file" ? "default" : "outline"} size="sm" onClick={() => setExistingSyllabusUploadMode("file")}>
                <Upload className="h-4 w-4 mr-1" /> Upload File
              </Button>
            </div>

            {existingSyllabusUploadMode === "paste" ? (
              <>
                <Textarea
                  value={syllabusText}
                  onChange={e => setSyllabusText(e.target.value)}
                  placeholder="Paste your full syllabus text here..."
                  className="min-h-[280px] font-mono text-sm"
                />
                {syllabusText && (
                  <p className="text-xs text-muted-foreground">{syllabusText.length.toLocaleString()} characters</p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => existingSyllabusFileRef.current?.click()}
                >
                  {existingSyllabusFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-6 w-6 text-primary" />
                      <span className="font-medium">{existingSyllabusFile.name}</span>
                      <span className="text-sm text-muted-foreground">({(existingSyllabusFile.size / 1024).toFixed(0)} KB)</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setExistingSyllabusFile(null); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium">Click to upload syllabus</p>
                      <p className="text-sm text-muted-foreground mt-1">PDF, Word, PowerPoint, Text, Images, or Excel</p>
                    </>
                  )}
                </div>
                <input
                  ref={existingSyllabusFileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp"
                  onChange={(e) => { if (e.target.files?.[0]) setExistingSyllabusFile(e.target.files[0]); }}
                />
                <p className="text-xs text-muted-foreground">File will also be saved to your Study Materials for use during tutoring sessions.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex w-full justify-between gap-2">
              <Button variant="outline" onClick={() => { setShowSyllabusDialog(false); setSyllabusText(""); setExistingSyllabusFile(null); }}>Cancel</Button>
              {existingSyllabusUploadMode === "paste" ? (
                <Button
                  onClick={() => {
                    if (selectedCourseForSyllabus && syllabusText) {
                      processSyllabusMutation.mutate({ courseId: selectedCourseForSyllabus, syllabusText });
                    }
                  }}
                  disabled={!syllabusText || processSyllabusMutation.isPending}
                >
                  {processSyllabusMutation.isPending ? (
                    <><Sparkles className="h-4 w-4 mr-1 animate-pulse" /> Processing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-1" /> Process with Tutor</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (selectedCourseForSyllabus && existingSyllabusFile) {
                      uploadFileMutation.mutate({ file: existingSyllabusFile, courseId: selectedCourseForSyllabus });
                    }
                  }}
                  disabled={!existingSyllabusFile || uploadFileMutation.isPending}
                >
                  {uploadFileMutation.isPending ? (
                    <><Sparkles className="h-4 w-4 mr-1 animate-pulse" /> Uploading &amp; Processing...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-1" /> Upload &amp; Process</>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Course</Label>
                <Select value={eventForm.courseId || "none"} onValueChange={v => setEventForm(f => ({ ...f, courseId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Personal / No Course</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Event Type</Label>
                <Select value={eventForm.eventType} onValueChange={v => setEventForm(f => ({ ...f, eventType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="study_session">Study Session</SelectItem>
                    <SelectItem value="office_hours">Office Hours</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={eventForm.startDate} onChange={e => setEventForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={eventForm.startTime} onChange={e => setEventForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={eventForm.endTime} onChange={e => setEventForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} placeholder="Room or building" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={eventForm.priority} onValueChange={v => setEventForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEvent(false)}>Cancel</Button>
            <Button onClick={() => createEventMutation.mutate(eventForm)} disabled={!eventForm.title || !eventForm.startDate || createEventMutation.isPending}>
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={!!showEventDetail} onOpenChange={() => setShowEventDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showEventDetail?.title}</DialogTitle>
          </DialogHeader>
          {showEventDetail && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge variant="outline">{showEventDetail.eventType}</Badge>
                {showEventDetail.priority === "high" && <Badge className="bg-red-100 text-red-800">High Priority</Badge>}
                <Badge variant={showEventDetail.status === "completed" ? "default" : "secondary"}>{showEventDetail.status}</Badge>
              </div>
              {showEventDetail.courseName && <p className="text-sm"><strong>Course:</strong> {showEventDetail.courseName}</p>}
              <p className="text-sm"><strong>Date:</strong> {showEventDetail.startDate}{showEventDetail.startTime ? ` at ${showEventDetail.startTime}` : ""}{showEventDetail.endTime ? ` - ${showEventDetail.endTime}` : ""}</p>
              {showEventDetail.location && <p className="text-sm"><strong>Location:</strong> {showEventDetail.location}</p>}
              {showEventDetail.description && <p className="text-sm">{showEventDetail.description}</p>}
              {showEventDetail.notes && <p className="text-sm text-muted-foreground">{showEventDetail.notes}</p>}
            </div>
          )}
          <DialogFooter>
            {showEventDetail && showEventDetail.status !== "completed" && (
              <Button variant="outline" onClick={() => {
                updateEventMutation.mutate({ id: showEventDetail.id, status: "completed" });
              }}>
                Mark Complete
              </Button>
            )}
            {showEventDetail && (
              <Button variant="destructive" onClick={() => deleteEventMutation.mutate(showEventDetail.id)}>
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Course</Label>
                <Select value={taskForm.courseId || "none"} onValueChange={v => setTaskForm(f => ({ ...f, courseId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Course</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={taskForm.taskType} onValueChange={v => setTaskForm(f => ({ ...f, taskType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="project_work">Project Work</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Est. Minutes</Label>
                <Input type="number" value={taskForm.estimatedMinutes} onChange={e => setTaskForm(f => ({ ...f, estimatedMinutes: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button onClick={() => createTaskMutation.mutate({
              ...taskForm,
              courseId: taskForm.courseId || null,
              estimatedMinutes: taskForm.estimatedMinutes ? parseInt(taskForm.estimatedMinutes) : null,
            })} disabled={!taskForm.title || createTaskMutation.isPending}>
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Parent Dialog */}
      <Dialog open={showAddParent} onOpenChange={setShowAddParent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Parent/Guardian Email</DialogTitle>
            <DialogDescription>They will receive progress updates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Parent Email *</Label>
              <Input type="email" value={parentForm.parentEmail} onChange={e => setParentForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="parent@email.com" />
            </div>
            <div>
              <Label>Parent Name</Label>
              <Input value={parentForm.parentName} onChange={e => setParentForm(f => ({ ...f, parentName: e.target.value }))} placeholder="Name (optional)" />
            </div>
            <div>
              <Label>Update Frequency</Label>
              <Select value={parentForm.shareFrequency} onValueChange={v => setParentForm(f => ({ ...f, shareFrequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_event">Per Event</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddParent(false)}>Cancel</Button>
            <Button onClick={() => addParentMutation.mutate(parentForm)} disabled={!parentForm.parentEmail || addParentMutation.isPending}>
              Add Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

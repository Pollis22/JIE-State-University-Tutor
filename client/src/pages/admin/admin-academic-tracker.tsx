import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Users, AlertTriangle, BarChart3, Download, Mail, Search,
  ChevronRight, TrendingUp, TrendingDown, Minus, Calendar, CheckSquare,
  Clock, Eye
} from "lucide-react";

// Types
interface StudentRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  studentName: string | null;
  courseCount: number;
  courseNames: string[];
  engagementScore: number | null;
  riskLevel: string | null;
  trend: string | null;
  lastSessionDate: string | null;
  upcomingDeadlines: number;
  taskCompletionRate: number;
}

interface Alert {
  type: string;
  student: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    studentName: string | null;
  };
  details: string;
}

interface Reporting {
  avgEngagement: number;
  activeUsersThisWeek: number;
  totalStudyHours: number;
  riskDistribution: Array<{ riskLevel: string; count: number }>;
  courseEngagement: Array<{ courseId: string; courseName: string; avgScore: number }>;
}

function getRiskBadge(level: string | null) {
  switch (level) {
    case "on_track": return <Badge className="bg-green-100 text-green-800 border-green-200">On Track</Badge>;
    case "needs_attention": return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Needs Attention</Badge>;
    case "at_risk": return <Badge className="bg-orange-100 text-orange-800 border-orange-200">At Risk</Badge>;
    case "critical": return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
    default: return <Badge variant="secondary">No Data</Badge>;
  }
}

function getAlertIcon(type: string) {
  switch (type) {
    case "no_activity": return <Clock className="h-4 w-4 text-orange-500" />;
    case "declining_engagement": return <TrendingDown className="h-4 w-4 text-red-500" />;
    case "missed_deadlines": return <CheckSquare className="h-4 w-4 text-red-500" />;
    case "exam_unprepared": return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
}

function getAlertLabel(type: string) {
  switch (type) {
    case "no_activity": return "No Activity";
    case "declining_engagement": return "Declining Engagement";
    case "missed_deadlines": return "Missed Deadlines";
    case "exam_unprepared": return "Exam Unprepared";
    default: return type;
  }
}

export default function AdminAcademicTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("engagement");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showNudgeDialog, setShowNudgeDialog] = useState<{ email: string; name: string } | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeSubject, setNudgeSubject] = useState("");

  // Queries
  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ students: StudentRow[]; total: number }>({
    queryKey: ["/api/academic/admin/students", { search, riskLevel: riskFilter, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (riskFilter) params.set("riskLevel", riskFilter);
      if (sortBy) params.set("sortBy", sortBy);
      const res = await fetch(`/api/academic/admin/students?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const { data: alertsData } = useQuery<{ alerts: Alert[]; total: number }>({
    queryKey: ["/api/academic/admin/alerts"],
  });

  const { data: reporting } = useQuery<Reporting>({
    queryKey: ["/api/academic/admin/reporting"],
  });

  const { data: studentDetail } = useQuery<any>({
    queryKey: ["/api/academic/admin/students", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return null;
      const res = await fetch(`/api/academic/admin/students/${selectedStudent}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch student detail");
      return res.json();
    },
    enabled: !!selectedStudent,
  });

  // Mutations
  const nudgeMutation = useMutation({
    mutationFn: async (data: { studentEmail: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/academic/admin/nudge", data);
      return res.json();
    },
    onSuccess: () => {
      setShowNudgeDialog(null);
      setNudgeMessage("");
      setNudgeSubject("");
      toast({ title: "Nudge sent successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const students = studentsData?.students || [];
  const alerts = alertsData?.alerts || [];

  const getName = (s: { firstName?: string | null; lastName?: string | null; studentName?: string | null; email: string }) =>
    s.studentName || `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">SRM Tracker</h2>
            <p className="text-muted-foreground">Monitor student engagement and progress</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              window.open("/api/academic/admin/reporting/export", "_blank");
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Avg Engagement</div>
              <div className="text-2xl font-bold" style={{
                color: (reporting?.avgEngagement || 0) >= 70 ? "#16a34a" : (reporting?.avgEngagement || 0) >= 50 ? "#ca8a04" : "#dc2626"
              }}>
                {Math.round(reporting?.avgEngagement || 0)}/100
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Active This Week</div>
              <div className="text-2xl font-bold">{reporting?.activeUsersThisWeek || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Study Hours (Week)</div>
              <div className="text-2xl font-bold">{reporting?.totalStudyHours || 0}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Active Alerts</div>
              <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="students" className="gap-1"><Users className="h-4 w-4" /> Students</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1"><AlertTriangle className="h-4 w-4" /> Alerts ({alerts.length})</TabsTrigger>
            <TabsTrigger value="reporting" className="gap-1"><BarChart3 className="h-4 w-4" /> Reporting</TabsTrigger>
          </TabsList>

          {/* ━━━ STUDENTS TAB ━━━ */}
          <TabsContent value="students">
            {selectedStudent && studentDetail ? (
              // Student Detail View
              <div>
                <Button variant="ghost" className="mb-4" onClick={() => setSelectedStudent(null)}>
                  &larr; Back to all students
                </Button>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>{getName(studentDetail.student)}</CardTitle>
                      <CardDescription>{studentDetail.student.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Courses:</strong> {studentDetail.courses?.length || 0}</p>
                        <p className="text-sm"><strong>Events:</strong> {studentDetail.events?.length || 0}</p>
                        <p className="text-sm"><strong>Tasks:</strong> {studentDetail.tasks?.length || 0}</p>
                        {studentDetail.engagement?.[0] && (
                          <div>
                            <p className="text-sm"><strong>Latest Score:</strong> {studentDetail.engagement[0].engagementScore}</p>
                            {getRiskBadge(studentDetail.engagement[0].riskLevel)}
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => setShowNudgeDialog({ email: studentDetail.student.email, name: getName(studentDetail.student) })}
                      >
                        <Mail className="h-4 w-4 mr-1" /> Send Nudge
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentDetail.courses?.length === 0 ? (
                        <p className="text-muted-foreground">No courses loaded</p>
                      ) : (
                        <div className="space-y-2">
                          {studentDetail.courses?.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 p-2 rounded bg-muted">
                              <div className="w-2 h-8 rounded" style={{ background: c.color || "#666" }} />
                              <div>
                                <div className="font-medium text-sm">{c.courseName}</div>
                                <div className="text-xs text-muted-foreground">{c.courseCode} {c.instructor ? `- ${c.instructor}` : ""}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Upcoming Events</CardTitle></CardHeader>
                    <CardContent>
                      {(studentDetail.events || []).filter((e: any) => e.status === "upcoming").slice(0, 10).map((evt: any) => (
                        <div key={evt.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                          <Badge variant="outline" className="text-xs">{evt.eventType}</Badge>
                          <span className="text-sm flex-1">{evt.title}</span>
                          <span className="text-xs text-muted-foreground">{evt.startDate}</span>
                        </div>
                      ))}
                      {(studentDetail.events || []).filter((e: any) => e.status === "upcoming").length === 0 && (
                        <p className="text-muted-foreground text-sm">No upcoming events</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Task Status</CardTitle></CardHeader>
                    <CardContent>
                      {(studentDetail.tasks || []).slice(0, 10).map((task: any) => (
                        <div key={task.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                          <Badge className={`text-xs ${task.status === "completed" ? "bg-green-100 text-green-800" : task.status === "pending" ? "bg-gray-100" : "bg-blue-100 text-blue-800"}`}>
                            {task.status}
                          </Badge>
                          <span className="text-sm flex-1">{task.title}</span>
                          {task.dueDate && <span className="text-xs text-muted-foreground">{task.dueDate}</span>}
                        </div>
                      ))}
                      {(studentDetail.tasks || []).length === 0 && (
                        <p className="text-muted-foreground text-sm">No tasks</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Engagement History */}
                {studentDetail.engagement && studentDetail.engagement.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader><CardTitle className="text-lg">Engagement History</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex gap-2 items-end h-32">
                        {studentDetail.engagement.slice().reverse().map((entry: any, i: number) => {
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
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Students Table View
              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={riskFilter || "all"} onValueChange={v => setRiskFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="on_track">On Track</SelectItem>
                      <SelectItem value="needs_attention">Needs Attention</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="lastActive">Last Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {studentsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
                      </div>
                    ) : students.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">No students found</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-4 py-3 text-sm font-medium">Student</th>
                              <th className="text-left px-4 py-3 text-sm font-medium">Courses</th>
                              <th className="text-left px-4 py-3 text-sm font-medium">Engagement</th>
                              <th className="text-left px-4 py-3 text-sm font-medium">Risk</th>
                              <th className="text-left px-4 py-3 text-sm font-medium">Last Session</th>
                              <th className="text-left px-4 py-3 text-sm font-medium">Deadlines</th>
                              <th className="text-left px-4 py-3 text-sm font-medium">Tasks</th>
                              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((s) => (
                              <tr key={s.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedStudent(s.id)}>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-sm">{getName(s)}</div>
                                  <div className="text-xs text-muted-foreground">{s.email}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">{s.courseCount}</td>
                                <td className="px-4 py-3">
                                  {s.engagementScore !== null ? (
                                    <span className="font-medium" style={{
                                      color: s.engagementScore >= 70 ? "#16a34a" : s.engagementScore >= 50 ? "#ca8a04" : "#dc2626"
                                    }}>
                                      {Math.round(s.engagementScore)}
                                    </span>
                                  ) : <span className="text-muted-foreground">--</span>}
                                </td>
                                <td className="px-4 py-3">{getRiskBadge(s.riskLevel)}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {s.lastSessionDate ? new Date(s.lastSessionDate).toLocaleDateString() : "Never"}
                                </td>
                                <td className="px-4 py-3 text-sm">{s.upcomingDeadlines}</td>
                                <td className="px-4 py-3 text-sm">{s.taskCompletionRate}%</td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedStudent(s.id)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNudgeDialog({ email: s.email, name: getName(s) })}>
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ━━━ ALERTS TAB ━━━ */}
          <TabsContent value="alerts">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No active intervention alerts. All students are on track!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {["no_activity", "declining_engagement", "missed_deadlines", "exam_unprepared"].map(type => {
                  const typeAlerts = alerts.filter(a => a.type === type);
                  if (typeAlerts.length === 0) return null;
                  return (
                    <Card key={type}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getAlertIcon(type)}
                          {getAlertLabel(type)} ({typeAlerts.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {typeAlerts.map((alert, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                              <div>
                                <div className="font-medium text-sm">{getName(alert.student)}</div>
                                <div className="text-xs text-muted-foreground">{alert.details}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setSelectedStudent(alert.student.id); setActiveTab("students"); }}>
                                  <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowNudgeDialog({ email: alert.student.email, name: getName(alert.student) })}>
                                  <Mail className="h-3 w-3 mr-1" /> Nudge
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ━━━ REPORTING TAB ━━━ */}
          <TabsContent value="reporting">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {reporting?.riskDistribution && reporting.riskDistribution.length > 0 ? (
                    <div className="space-y-3">
                      {reporting.riskDistribution.map((entry) => {
                        const total = reporting.riskDistribution.reduce((a, b) => a + Number(b.count), 0);
                        const pct = total > 0 ? Math.round((Number(entry.count) / total) * 100) : 0;
                        const colors: Record<string, string> = {
                          on_track: "#16a34a",
                          needs_attention: "#ca8a04",
                          at_risk: "#ea580c",
                          critical: "#dc2626",
                        };
                        return (
                          <div key={entry.riskLevel} className="flex items-center gap-3">
                            <div className="w-32 text-sm">{getRiskBadge(entry.riskLevel)}</div>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: colors[entry.riskLevel || ""] || "#666",
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-16 text-right">{entry.count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No engagement data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Course Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  {reporting?.courseEngagement && reporting.courseEngagement.length > 0 ? (
                    <div className="space-y-3">
                      {reporting.courseEngagement.map((course) => (
                        <div key={course.courseId} className="flex items-center justify-between">
                          <span className="text-sm">{course.courseName}</span>
                          <span className="font-medium" style={{
                            color: Number(course.avgScore) >= 70 ? "#16a34a" : Number(course.avgScore) >= 50 ? "#ca8a04" : "#dc2626"
                          }}>
                            {Math.round(Number(course.avgScore))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No course data yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Nudge Dialog */}
      <Dialog open={!!showNudgeDialog} onOpenChange={() => setShowNudgeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Nudge to {showNudgeDialog?.name}</DialogTitle>
            <DialogDescription>Send an encouraging email to help this student get back on track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={nudgeSubject}
                onChange={e => setNudgeSubject(e.target.value)}
                placeholder="A message from your academic advisor — State University AI Tutor"
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={nudgeMessage}
                onChange={e => setNudgeMessage(e.target.value)}
                placeholder="Hi! We noticed you haven't been active recently. Your State University AI Tutor is here to help you succeed..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNudgeDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (showNudgeDialog && nudgeMessage) {
                  nudgeMutation.mutate({
                    studentEmail: showNudgeDialog.email,
                    subject: nudgeSubject || "A message from your academic advisor — State University AI Tutor",
                    message: nudgeMessage,
                  });
                }
              }}
              disabled={!nudgeMessage || nudgeMutation.isPending}
            >
              {nudgeMutation.isPending ? "Sending..." : "Send Nudge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

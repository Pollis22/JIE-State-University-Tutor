import { Router } from "express";
import { db } from "../db";
import {
  studentCourses,
  studentCalendarEvents,
  studentTasks,
  studentReminders,
  studentEngagementScores,
  studentParentShares,
  users,
  learningSessions,
} from "@shared/schema";
import { eq, and, desc, asc, gte, lte, sql, or, ne, count, isNull } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "../middleware/admin-auth";
import { EmailService } from "../services/email-service";

const router = Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Auth check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function requireAuth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return (req.user as any).id;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Generate study tasks for a calendar event
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateStudyTasks(
  userId: string,
  courseId: string | null,
  event: { id: string; title: string; eventType: string | null; startDate: string }
) {
  const eventDate = new Date(event.startDate);
  const now = new Date();
  const tasks: Array<{
    userId: string;
    courseId: string | null;
    eventId: string;
    title: string;
    taskType: "study" | "review";
    dueDate: string;
    priority: "high" | "medium" | "low";
    estimatedMinutes: number;
  }> = [];

  function addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  }

  function isFuture(dateStr: string): boolean {
    return new Date(dateStr) >= now;
  }

  const type = event.eventType;
  if (type === "exam") {
    const t7 = addDays(eventDate, 7);
    const t5 = addDays(eventDate, 5);
    const t3 = addDays(eventDate, 3);
    const t1 = addDays(eventDate, 1);
    if (isFuture(t7)) tasks.push({ userId, courseId, eventId: event.id, title: `Begin reviewing for ${event.title}`, taskType: "study", dueDate: t7, priority: "medium", estimatedMinutes: 45 });
    if (isFuture(t5)) tasks.push({ userId, courseId, eventId: event.id, title: `Continue review: ${event.title}`, taskType: "review", dueDate: t5, priority: "medium", estimatedMinutes: 60 });
    if (isFuture(t3)) tasks.push({ userId, courseId, eventId: event.id, title: `Intensive review for ${event.title}`, taskType: "review", dueDate: t3, priority: "high", estimatedMinutes: 90 });
    if (isFuture(t1)) tasks.push({ userId, courseId, eventId: event.id, title: `Final review: ${event.title} tomorrow`, taskType: "review", dueDate: t1, priority: "high", estimatedMinutes: 60 });
  } else if (type === "assignment" || type === "project") {
    const t5 = addDays(eventDate, 5);
    const t3 = addDays(eventDate, 3);
    const t1 = addDays(eventDate, 1);
    if (isFuture(t5)) tasks.push({ userId, courseId, eventId: event.id, title: `Start working on ${event.title}`, taskType: "study", dueDate: t5, priority: "medium", estimatedMinutes: 60 });
    if (isFuture(t3)) tasks.push({ userId, courseId, eventId: event.id, title: `Continue ${event.title} — due in 3 days`, taskType: "study", dueDate: t3, priority: "high", estimatedMinutes: 60 });
    if (isFuture(t1)) tasks.push({ userId, courseId, eventId: event.id, title: `Finish ${event.title} — due tomorrow`, taskType: "study", dueDate: t1, priority: "high", estimatedMinutes: 45 });
  } else if (type === "quiz") {
    const t3 = addDays(eventDate, 3);
    const t1 = addDays(eventDate, 1);
    if (isFuture(t3)) tasks.push({ userId, courseId, eventId: event.id, title: `Review for ${event.title}`, taskType: "review", dueDate: t3, priority: "medium", estimatedMinutes: 30 });
    if (isFuture(t1)) tasks.push({ userId, courseId, eventId: event.id, title: `Quick review: ${event.title} tomorrow`, taskType: "review", dueDate: t1, priority: "high", estimatedMinutes: 20 });
  }

  if (tasks.length > 0) {
    await db.insert(studentTasks).values(tasks);
  }

  return tasks;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Generate reminders for a calendar event
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateReminders(
  userId: string,
  event: { id: string; title: string; eventType: string | null; startDate: string }
) {
  const eventDate = new Date(event.startDate);
  const now = new Date();
  const reminders: Array<{
    userId: string;
    eventId: string;
    reminderType: "exam_7day" | "exam_3day" | "exam_1day" | "assignment_3day" | "assignment_1day" | "study_reminder";
    reminderDate: string;
    reminderTime: string;
    message: string;
    deliveryMethod: "in_app" | "email" | "both";
  }> = [];

  function subDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  }

  function isFuture(dateStr: string): boolean {
    return new Date(dateStr) >= now;
  }

  const type = event.eventType;
  if (type === "exam") {
    const d7 = subDays(eventDate, 7);
    const d3 = subDays(eventDate, 3);
    const d1 = subDays(eventDate, 1);
    if (isFuture(d7)) reminders.push({ userId, eventId: event.id, reminderType: "exam_7day", reminderDate: d7, reminderTime: "09:00", message: `${event.title} is in 7 days — start reviewing!`, deliveryMethod: "both" });
    if (isFuture(d3)) reminders.push({ userId, eventId: event.id, reminderType: "exam_3day", reminderDate: d3, reminderTime: "09:00", message: `${event.title} is in 3 days — time for intensive review`, deliveryMethod: "both" });
    if (isFuture(d1)) reminders.push({ userId, eventId: event.id, reminderType: "exam_1day", reminderDate: d1, reminderTime: "09:00", message: `${event.title} is tomorrow — final review time!`, deliveryMethod: "both" });
  } else if (type === "assignment" || type === "project") {
    const d3 = subDays(eventDate, 3);
    const d1 = subDays(eventDate, 1);
    if (isFuture(d3)) reminders.push({ userId, eventId: event.id, reminderType: "assignment_3day", reminderDate: d3, reminderTime: "09:00", message: `${event.title} is due in 3 days`, deliveryMethod: "in_app" });
    if (isFuture(d1)) reminders.push({ userId, eventId: event.id, reminderType: "assignment_1day", reminderDate: d1, reminderTime: "09:00", message: `${event.title} is due tomorrow!`, deliveryMethod: "both" });
  } else if (type === "quiz") {
    const d3 = subDays(eventDate, 3);
    const d1 = subDays(eventDate, 1);
    if (isFuture(d3)) reminders.push({ userId, eventId: event.id, reminderType: "study_reminder", reminderDate: d3, reminderTime: "09:00", message: `${event.title} is in 3 days — review time`, deliveryMethod: "in_app" });
    if (isFuture(d1)) reminders.push({ userId, eventId: event.id, reminderType: "study_reminder", reminderDate: d1, reminderTime: "09:00", message: `${event.title} is tomorrow!`, deliveryMethod: "both" });
  }

  if (reminders.length > 0) {
    await db.insert(studentReminders).values(reminders);
  }

  return reminders;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COURSES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// POST /api/academic/courses — create course
router.post("/courses", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { courseName, courseCode, instructor, semester, color } = req.body;
    if (!courseName) return res.status(400).json({ error: "courseName is required" });
    const [course] = await db.insert(studentCourses).values({
      userId,
      courseName,
      courseCode: courseCode || null,
      instructor: instructor || null,
      semester: semester || null,
      color: color || null,
    }).returning();
    res.json(course);
  } catch (error: any) {
    console.error("[Academic] Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// GET /api/academic/courses — list user's courses
router.get("/courses", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const courses = await db.select().from(studentCourses)
      .where(and(eq(studentCourses.userId, userId), eq(studentCourses.isActive, true)))
      .orderBy(desc(studentCourses.createdAt));

    // Enrich with event count and next deadline
    const enriched = await Promise.all(courses.map(async (course) => {
      const events = await db.select().from(studentCalendarEvents)
        .where(and(
          eq(studentCalendarEvents.courseId, course.id),
          eq(studentCalendarEvents.status, "upcoming"),
          gte(studentCalendarEvents.startDate, new Date().toISOString().split("T")[0])
        ))
        .orderBy(asc(studentCalendarEvents.startDate))
        .limit(1);
      const eventCountResult = await db.select({ count: count() }).from(studentCalendarEvents)
        .where(eq(studentCalendarEvents.courseId, course.id));
      return {
        ...course,
        eventCount: eventCountResult[0]?.count || 0,
        nextDeadline: events[0] || null,
      };
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error("[Academic] Error listing courses:", error);
    res.status(500).json({ error: "Failed to list courses" });
  }
});

// PUT /api/academic/courses/:id — update course
router.put("/courses/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    const { courseName, courseCode, instructor, semester, color, isActive } = req.body;
    const [updated] = await db.update(studentCourses)
      .set({
        ...(courseName !== undefined && { courseName }),
        ...(courseCode !== undefined && { courseCode }),
        ...(instructor !== undefined && { instructor }),
        ...(semester !== undefined && { semester }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(and(eq(studentCourses.id, id), eq(studentCourses.userId, userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Course not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("[Academic] Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// DELETE /api/academic/courses/:id — soft delete
router.delete("/courses/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    await db.update(studentCourses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(studentCourses.id, id), eq(studentCourses.userId, userId)));
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Academic] Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// POST /api/academic/courses/:id/syllabus — process syllabus with Claude
router.post("/courses/:id/syllabus", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    const { syllabusText } = req.body;
    if (!syllabusText) return res.status(400).json({ error: "syllabusText is required" });

    // Verify course belongs to user
    const [course] = await db.select().from(studentCourses)
      .where(and(eq(studentCourses.id, id), eq(studentCourses.userId, userId)));
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Save syllabus text
    await db.update(studentCourses)
      .set({ syllabusText, syllabusUploadedAt: new Date(), updatedAt: new Date() })
      .where(eq(studentCourses.id, id));

    // Call Claude to extract structured data
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: "You are an academic syllabus parser. Extract structured information from course syllabi. Return ONLY valid JSON, no markdown or explanation.",
      messages: [{
        role: "user",
        content: `Extract the following from this syllabus and return as JSON:
{
  "courseName": "string or null",
  "courseCode": "string or null",
  "instructor": "string or null",
  "events": [
    {
      "title": "string - descriptive name like 'Midterm Exam' or 'Problem Set 3 Due'",
      "eventType": "exam|assignment|quiz|project|lab|presentation|office_hours",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or null",
      "startTime": "HH:MM or null",
      "endTime": "HH:MM or null",
      "description": "string or null",
      "priority": "high|medium|low",
      "location": "string or null"
    }
  ]
}

Rules:
- Exams and midterms are priority "high"
- Assignments and projects are priority "medium"
- If year is not specified, assume 2026
- Include ALL dated events: exams, quizzes, homework, projects, presentations, labs
- Do NOT include weekly recurring events like lectures (only one-off events)
- For office hours, include the first occurrence only

Syllabus text:
${syllabusText}`
      }],
    });

    // Parse Claude response
    const textBlock = response.content.find((b: any) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return res.status(500).json({ error: "Failed to parse syllabus" });
    }

    let parsed: any;
    try {
      // Clean up potential markdown code blocks
      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(jsonText);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response as JSON" });
    }

    // Update course with extracted info
    if (parsed.courseName || parsed.courseCode || parsed.instructor) {
      await db.update(studentCourses).set({
        ...(parsed.courseName && !course.courseName && { courseName: parsed.courseName }),
        ...(parsed.courseCode && !course.courseCode && { courseCode: parsed.courseCode }),
        ...(parsed.instructor && !course.instructor && { instructor: parsed.instructor }),
        updatedAt: new Date(),
      }).where(eq(studentCourses.id, id));
    }

    // Create calendar events and study tasks
    const createdEvents: any[] = [];
    const createdTasks: any[] = [];

    if (parsed.events && Array.isArray(parsed.events)) {
      for (const evt of parsed.events) {
        if (!evt.title || !evt.startDate) continue;
        const [calEvent] = await db.insert(studentCalendarEvents).values({
          userId,
          courseId: id,
          title: evt.title,
          eventType: evt.eventType || "custom",
          description: evt.description || null,
          startDate: evt.startDate,
          endDate: evt.endDate || null,
          startTime: evt.startTime || null,
          endTime: evt.endTime || null,
          location: evt.location || null,
          isFromSyllabus: true,
          priority: evt.priority || "medium",
          status: "upcoming",
        }).returning();
        createdEvents.push(calEvent);

        // Auto-generate study tasks
        const tasks = await generateStudyTasks(userId, id, {
          id: calEvent.id,
          title: calEvent.title,
          eventType: calEvent.eventType,
          startDate: calEvent.startDate,
        });
        createdTasks.push(...tasks);

        // Auto-generate reminders
        await generateReminders(userId, {
          id: calEvent.id,
          title: calEvent.title,
          eventType: calEvent.eventType,
          startDate: calEvent.startDate,
        });
      }
    }

    res.json({
      extracted: parsed,
      eventsCreated: createdEvents.length,
      tasksCreated: createdTasks.length,
      events: createdEvents,
    });
  } catch (error: any) {
    console.error("[Academic] Syllabus processing error:", error);
    res.status(500).json({ error: "Failed to process syllabus" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CALENDAR EVENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/academic/events
router.get("/events", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { courseId, startDate, endDate, eventType, status } = req.query;
    const conditions = [eq(studentCalendarEvents.userId, userId)];
    if (courseId) conditions.push(eq(studentCalendarEvents.courseId, courseId as string));
    if (startDate) conditions.push(gte(studentCalendarEvents.startDate, startDate as string));
    if (endDate) conditions.push(lte(studentCalendarEvents.startDate, endDate as string));
    if (eventType) conditions.push(eq(studentCalendarEvents.eventType, eventType as any));
    if (status) conditions.push(eq(studentCalendarEvents.status, status as any));

    const events = await db.select({
      event: studentCalendarEvents,
      courseName: studentCourses.courseName,
      courseColor: studentCourses.color,
      courseCode: studentCourses.courseCode,
    })
      .from(studentCalendarEvents)
      .leftJoin(studentCourses, eq(studentCalendarEvents.courseId, studentCourses.id))
      .where(and(...conditions))
      .orderBy(asc(studentCalendarEvents.startDate));

    res.json(events.map(r => ({ ...r.event, courseName: r.courseName, courseColor: r.courseColor, courseCode: r.courseCode })));
  } catch (error: any) {
    console.error("[Academic] Error listing events:", error);
    res.status(500).json({ error: "Failed to list events" });
  }
});

// POST /api/academic/events
router.post("/events", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { courseId, title, eventType, description, startDate, endDate, startTime, endTime, location, isAllDay, priority, notes } = req.body;
    if (!title || !startDate) return res.status(400).json({ error: "title and startDate are required" });

    const [event] = await db.insert(studentCalendarEvents).values({
      userId,
      courseId: courseId || null,
      title,
      eventType: eventType || "custom",
      description: description || null,
      startDate,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      isAllDay: isAllDay || false,
      isFromSyllabus: false,
      priority: priority || "medium",
      status: "upcoming",
      notes: notes || null,
    }).returning();

    // Auto-generate tasks and reminders for eligible event types
    if (["exam", "assignment", "quiz", "project"].includes(eventType)) {
      await generateStudyTasks(userId, courseId || null, {
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        startDate: event.startDate,
      });
      await generateReminders(userId, {
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        startDate: event.startDate,
      });
    }

    res.json(event);
  } catch (error: any) {
    console.error("[Academic] Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// PUT /api/academic/events/:id
router.put("/events/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    const fields = req.body;
    const [updated] = await db.update(studentCalendarEvents)
      .set(fields)
      .where(and(eq(studentCalendarEvents.id, id), eq(studentCalendarEvents.userId, userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Event not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("[Academic] Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE /api/academic/events/:id
router.delete("/events/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    await db.delete(studentCalendarEvents)
      .where(and(eq(studentCalendarEvents.id, id), eq(studentCalendarEvents.userId, userId)));
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Academic] Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TASKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/academic/tasks
router.get("/tasks", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { courseId, status, priority, startDate, endDate } = req.query;
    const conditions = [eq(studentTasks.userId, userId)];
    if (courseId) conditions.push(eq(studentTasks.courseId, courseId as string));
    if (status) conditions.push(eq(studentTasks.status, status as any));
    if (priority) conditions.push(eq(studentTasks.priority, priority as any));
    if (startDate) conditions.push(gte(studentTasks.dueDate, startDate as string));
    if (endDate) conditions.push(lte(studentTasks.dueDate, endDate as string));

    const tasks = await db.select({
      task: studentTasks,
      courseName: studentCourses.courseName,
      courseColor: studentCourses.color,
      courseCode: studentCourses.courseCode,
    })
      .from(studentTasks)
      .leftJoin(studentCourses, eq(studentTasks.courseId, studentCourses.id))
      .where(and(...conditions))
      .orderBy(asc(studentTasks.dueDate), desc(studentTasks.priority));

    res.json(tasks.map(r => ({ ...r.task, courseName: r.courseName, courseColor: r.courseColor, courseCode: r.courseCode })));
  } catch (error: any) {
    console.error("[Academic] Error listing tasks:", error);
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

// POST /api/academic/tasks
router.post("/tasks", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { courseId, eventId, title, taskType, dueDate, priority, estimatedMinutes, notes } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const [task] = await db.insert(studentTasks).values({
      userId,
      courseId: courseId || null,
      eventId: eventId || null,
      title,
      taskType: taskType || "custom",
      dueDate: dueDate || null,
      priority: priority || "medium",
      estimatedMinutes: estimatedMinutes || null,
      notes: notes || null,
    }).returning();
    res.json(task);
  } catch (error: any) {
    console.error("[Academic] Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /api/academic/tasks/:id
router.put("/tasks/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    const fields = { ...req.body };
    // Set completedAt when marking as completed
    if (fields.status === "completed" && !fields.completedAt) {
      fields.completedAt = new Date();
    }
    const [updated] = await db.update(studentTasks)
      .set(fields)
      .where(and(eq(studentTasks.id, id), eq(studentTasks.userId, userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Task not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("[Academic] Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /api/academic/tasks/:id
router.delete("/tasks/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    await db.delete(studentTasks)
      .where(and(eq(studentTasks.id, id), eq(studentTasks.userId, userId)));
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Academic] Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REMINDERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/academic/reminders
router.get("/reminders", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const reminders = await db.select().from(studentReminders)
      .where(eq(studentReminders.userId, userId))
      .orderBy(asc(studentReminders.reminderDate));
    res.json(reminders);
  } catch (error: any) {
    console.error("[Academic] Error listing reminders:", error);
    res.status(500).json({ error: "Failed to list reminders" });
  }
});

// PUT /api/academic/reminders/:id
router.put("/reminders/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    const { deliveryMethod, delivered } = req.body;
    const [updated] = await db.update(studentReminders)
      .set({
        ...(deliveryMethod !== undefined && { deliveryMethod }),
        ...(delivered !== undefined && { delivered, deliveredAt: delivered ? new Date() : null }),
      })
      .where(and(eq(studentReminders.id, id), eq(studentReminders.userId, userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Reminder not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("[Academic] Error updating reminder:", error);
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENGAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Helper: Calculate engagement score for current week
async function calculateEngagement(userId: string, courseId?: string | null) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Sessions completed this week
  const sessionsResult = await db.select({ count: count() }).from(learningSessions)
    .where(and(
      eq(learningSessions.userId, userId),
      gte(learningSessions.createdAt, weekStart),
      eq(learningSessions.isCompleted, true)
    ));
  const sessionsCompleted = sessionsResult[0]?.count || 0;

  // Course count for target calculation
  const courseCountResult = await db.select({ count: count() }).from(studentCourses)
    .where(and(eq(studentCourses.userId, userId), eq(studentCourses.isActive, true)));
  const courseCount = Math.max(courseCountResult[0]?.count || 1, 1);
  const sessionTarget = courseCount * 3; // 3 sessions/week per course

  // Tasks this week
  const tasksAll = await db.select().from(studentTasks)
    .where(and(
      eq(studentTasks.userId, userId),
      ...(courseId ? [eq(studentTasks.courseId, courseId)] : []),
      gte(studentTasks.dueDate, weekStartStr),
      lte(studentTasks.dueDate, weekEndStr)
    ));
  const tasksCompleted = tasksAll.filter(t => t.status === "completed").length;
  const tasksPending = tasksAll.filter(t => t.status === "pending" || t.status === "in_progress").length;
  const tasksMissed = tasksAll.filter(t => {
    if (!t.dueDate) return false;
    return t.status !== "completed" && new Date(t.dueDate) < now;
  }).length;
  const totalTasks = Math.max(tasksAll.length, 1);

  // Study minutes (from sessions)
  const minutesResult = await db.select({
    total: sql<number>`COALESCE(SUM(${learningSessions.voiceMinutesUsed}), 0)`
  }).from(learningSessions)
    .where(and(
      eq(learningSessions.userId, userId),
      gte(learningSessions.createdAt, weekStart)
    ));
  const totalStudyMinutes = Number(minutesResult[0]?.total || 0);

  // Consistency: count unique days with activity
  const daysResult = await db.select({
    dayCount: sql<number>`COUNT(DISTINCT DATE(${learningSessions.createdAt}))`
  }).from(learningSessions)
    .where(and(
      eq(learningSessions.userId, userId),
      gte(learningSessions.createdAt, weekStart)
    ));
  const activeDays = Number(daysResult[0]?.dayCount || 0);

  // Calculate score components
  const sessionScore = Math.min(40, (sessionsCompleted / sessionTarget) * 40);
  const taskScore = Math.min(30, (tasksCompleted / totalTasks) * 30);
  const minuteTarget = courseCount * 60; // 60 min/week per course
  const minuteScore = Math.min(20, (totalStudyMinutes / minuteTarget) * 20);
  const consistencyScore = activeDays >= 4 ? 10 : (activeDays / 4) * 10;

  const engagementScore = Math.round((sessionScore + taskScore + minuteScore + consistencyScore) * 100) / 100;

  // Risk level
  let riskLevel: "on_track" | "needs_attention" | "at_risk" | "critical" = "on_track";
  if (engagementScore < 30) riskLevel = "critical";
  else if (engagementScore < 50) riskLevel = "at_risk";
  else if (engagementScore < 70) riskLevel = "needs_attention";

  return {
    weekStart: weekStartStr,
    sessionsCompleted,
    tasksCompleted,
    tasksPending,
    tasksMissed,
    totalStudyMinutes,
    engagementScore,
    riskLevel,
  };
}

// GET /api/academic/engagement — history
router.get("/engagement", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const scores = await db.select().from(studentEngagementScores)
      .where(eq(studentEngagementScores.userId, userId))
      .orderBy(desc(studentEngagementScores.weekStart))
      .limit(8);
    res.json(scores);
  } catch (error: any) {
    console.error("[Academic] Error listing engagement:", error);
    res.status(500).json({ error: "Failed to list engagement" });
  }
});

// GET /api/academic/engagement/current — calculate and return current week
router.get("/engagement/current", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const result = await calculateEngagement(userId);

    // Determine trend from previous week
    const prevScores = await db.select().from(studentEngagementScores)
      .where(eq(studentEngagementScores.userId, userId))
      .orderBy(desc(studentEngagementScores.weekStart))
      .limit(1);
    let trend: "improving" | "stable" | "declining" = "stable";
    if (prevScores.length > 0) {
      const prevScore = Number(prevScores[0].engagementScore);
      if (result.engagementScore > prevScore + 5) trend = "improving";
      else if (result.engagementScore < prevScore - 5) trend = "declining";
    }

    // Upsert current week score
    const existing = await db.select().from(studentEngagementScores)
      .where(and(
        eq(studentEngagementScores.userId, userId),
        eq(studentEngagementScores.weekStart, result.weekStart),
        isNull(studentEngagementScores.courseId)
      ));

    if (existing.length > 0) {
      await db.update(studentEngagementScores)
        .set({ ...result, trend })
        .where(eq(studentEngagementScores.id, existing[0].id));
    } else {
      await db.insert(studentEngagementScores).values({
        userId,
        ...result,
        trend,
      });
    }

    // Calculate streak (weeks with score > 0)
    const allScores = await db.select().from(studentEngagementScores)
      .where(and(eq(studentEngagementScores.userId, userId), isNull(studentEngagementScores.courseId)))
      .orderBy(desc(studentEngagementScores.weekStart));
    let streak = 0;
    for (const s of allScores) {
      if (Number(s.engagementScore) > 0) streak++;
      else break;
    }

    res.json({ ...result, trend, streak });
  } catch (error: any) {
    console.error("[Academic] Error calculating engagement:", error);
    res.status(500).json({ error: "Failed to calculate engagement" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARENT SHARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/academic/parent-shares
router.get("/parent-shares", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const shares = await db.select().from(studentParentShares)
      .where(eq(studentParentShares.userId, userId))
      .orderBy(desc(studentParentShares.createdAt));
    res.json(shares);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to list parent shares" });
  }
});

// POST /api/academic/parent-shares
router.post("/parent-shares", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { parentEmail, parentName, shareFrequency } = req.body;
    if (!parentEmail) return res.status(400).json({ error: "parentEmail is required" });

    // Max 3 parent shares
    const existing = await db.select({ count: count() }).from(studentParentShares)
      .where(and(eq(studentParentShares.userId, userId), eq(studentParentShares.isActive, true)));
    if ((existing[0]?.count || 0) >= 3) {
      return res.status(400).json({ error: "Maximum 3 parent shares allowed" });
    }

    const [share] = await db.insert(studentParentShares).values({
      userId,
      parentEmail,
      parentName: parentName || null,
      shareFrequency: shareFrequency || "weekly",
    }).returning();
    res.json(share);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add parent share" });
  }
});

// DELETE /api/academic/parent-shares/:id
router.delete("/parent-shares/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { id } = req.params;
    await db.update(studentParentShares)
      .set({ isActive: false })
      .where(and(eq(studentParentShares.id, id), eq(studentParentShares.userId, userId)));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to remove parent share" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get("/dashboard-summary", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const today = new Date().toISOString().split("T")[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekEndStr = weekFromNow.toISOString().split("T")[0];

    // Upcoming events (next 7 days)
    const upcomingEvents = await db.select({ count: count() }).from(studentCalendarEvents)
      .where(and(
        eq(studentCalendarEvents.userId, userId),
        eq(studentCalendarEvents.status, "upcoming"),
        gte(studentCalendarEvents.startDate, today),
        lte(studentCalendarEvents.startDate, weekEndStr)
      ));

    // Pending tasks
    const pendingTasks = await db.select({ count: count() }).from(studentTasks)
      .where(and(
        eq(studentTasks.userId, userId),
        or(eq(studentTasks.status, "pending"), eq(studentTasks.status, "in_progress"))
      ));

    // Overdue tasks
    const overdueTasks = await db.select({ count: count() }).from(studentTasks)
      .where(and(
        eq(studentTasks.userId, userId),
        ne(studentTasks.status, "completed"),
        ne(studentTasks.status, "skipped"),
        lte(studentTasks.dueDate, today)
      ));

    // Current engagement
    const engagement = await calculateEngagement(userId);

    // Active courses
    const activeCourses = await db.select({ count: count() }).from(studentCourses)
      .where(and(eq(studentCourses.userId, userId), eq(studentCourses.isActive, true)));

    // Undelivered reminders
    const pendingReminders = await db.select({ count: count() }).from(studentReminders)
      .where(and(
        eq(studentReminders.userId, userId),
        eq(studentReminders.delivered, false),
        lte(studentReminders.reminderDate, today)
      ));

    res.json({
      upcomingEvents: upcomingEvents[0]?.count || 0,
      pendingTasks: pendingTasks[0]?.count || 0,
      overdueTasks: overdueTasks[0]?.count || 0,
      engagementScore: engagement.engagementScore,
      riskLevel: engagement.riskLevel,
      activeCourses: activeCourses[0]?.count || 0,
      pendingReminders: pendingReminders[0]?.count || 0,
    });
  } catch (error: any) {
    console.error("[Academic] Dashboard summary error:", error);
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/admin/academic/students — list all students with engagement data
router.get("/admin/students", requireAdmin, async (req, res) => {
  try {
    const { search, riskLevel, sortBy } = req.query;
    const today = new Date().toISOString().split("T")[0];

    // Batch query 1: All non-admin users
    const allStudents = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      studentName: users.studentName,
      createdAt: users.createdAt,
    }).from(users)
      .where(eq(users.isAdmin, false))
      .orderBy(desc(users.createdAt));

    if (allStudents.length === 0) {
      return res.json({ students: [], total: 0 });
    }

    const studentIds = allStudents.map(s => s.id);

    // Batch query 2: Course counts and names per student (single query)
    const courseData = await db.select({
      userId: studentCourses.userId,
      courseName: studentCourses.courseName,
    }).from(studentCourses)
      .where(eq(studentCourses.isActive, true));

    const coursesByStudent = new Map<string, string[]>();
    for (const c of courseData) {
      const arr = coursesByStudent.get(c.userId) || [];
      arr.push(c.courseName);
      coursesByStudent.set(c.userId, arr);
    }

    // Batch query 3: Latest engagement scores (using DISTINCT ON for most recent per user)
    const latestScores = await db.execute(sql`
      SELECT DISTINCT ON (user_id) user_id, engagement_score, risk_level, trend, week_start
      FROM student_engagement_scores
      WHERE course_id IS NULL
      ORDER BY user_id, week_start DESC
    `);
    const scoresByStudent = new Map<string, { engagementScore: number; riskLevel: string; trend: string }>();
    for (const row of latestScores.rows as any[]) {
      scoresByStudent.set(row.user_id, {
        engagementScore: Number(row.engagement_score),
        riskLevel: row.risk_level,
        trend: row.trend,
      });
    }

    // Batch query 4: Last session per student
    const lastSessions = await db.execute(sql`
      SELECT DISTINCT ON (user_id) user_id, created_at
      FROM learning_sessions
      ORDER BY user_id, created_at DESC
    `);
    const lastSessionByStudent = new Map<string, Date>();
    for (const row of lastSessions.rows as any[]) {
      lastSessionByStudent.set(row.user_id, row.created_at);
    }

    // Batch query 5: Task counts per student (total and completed in one query)
    const taskCounts = await db.execute(sql`
      SELECT user_id,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks
      FROM student_tasks
      GROUP BY user_id
    `);
    const tasksByStudent = new Map<string, { total: number; completed: number }>();
    for (const row of taskCounts.rows as any[]) {
      tasksByStudent.set(row.user_id, {
        total: Number(row.total_tasks),
        completed: Number(row.completed_tasks),
      });
    }

    // Batch query 6: Upcoming deadline counts per student
    const deadlineCounts = await db.execute(sql`
      SELECT user_id, COUNT(*) as deadline_count
      FROM student_calendar_events
      WHERE status = 'upcoming' AND start_date >= ${today}
      GROUP BY user_id
    `);
    const deadlinesByStudent = new Map<string, number>();
    for (const row of deadlineCounts.rows as any[]) {
      deadlinesByStudent.set(row.user_id, Number(row.deadline_count));
    }

    // Assemble enriched list in memory (no per-student queries)
    let enriched = allStudents.map(student => {
      const courses = coursesByStudent.get(student.id) || [];
      const score = scoresByStudent.get(student.id);
      const tasks = tasksByStudent.get(student.id);
      const totalTaskCount = tasks?.total || 0;
      const completedTaskCount = tasks?.completed || 0;
      const taskCompletionRate = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;

      return {
        ...student,
        courseCount: courses.length,
        courseNames: courses,
        engagementScore: score?.engagementScore ?? null,
        riskLevel: score?.riskLevel || null,
        trend: score?.trend || null,
        lastSessionDate: lastSessionByStudent.get(student.id) || null,
        upcomingDeadlines: deadlinesByStudent.get(student.id) || 0,
        taskCompletionRate,
      };
    });

    // Apply filters
    if (search) {
      const s = (search as string).toLowerCase();
      enriched = enriched.filter(st =>
        (st.email || "").toLowerCase().includes(s) ||
        (st.firstName || "").toLowerCase().includes(s) ||
        (st.lastName || "").toLowerCase().includes(s) ||
        (st.studentName || "").toLowerCase().includes(s) ||
        (st.username || "").toLowerCase().includes(s)
      );
    }
    if (riskLevel) {
      enriched = enriched.filter(st => st.riskLevel === riskLevel);
    }

    // Sort
    if (sortBy === "engagement") {
      enriched.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
    } else if (sortBy === "lastActive") {
      enriched.sort((a, b) => {
        if (!a.lastSessionDate) return 1;
        if (!b.lastSessionDate) return -1;
        return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime();
      });
    }

    res.json({ students: enriched, total: enriched.length });
  } catch (error: any) {
    console.error("[Academic Admin] Error listing students:", error);
    res.status(500).json({ error: "Failed to list students" });
  }
});

// GET /api/admin/academic/students/:userId — student detail
router.get("/admin/students/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const [student] = await db.select().from(users).where(eq(users.id, userId));
    if (!student) return res.status(404).json({ error: "Student not found" });

    const courses = await db.select().from(studentCourses)
      .where(and(eq(studentCourses.userId, userId), eq(studentCourses.isActive, true)));
    const events = await db.select().from(studentCalendarEvents)
      .where(eq(studentCalendarEvents.userId, userId))
      .orderBy(asc(studentCalendarEvents.startDate));
    const tasks = await db.select().from(studentTasks)
      .where(eq(studentTasks.userId, userId))
      .orderBy(asc(studentTasks.dueDate));
    const engagement = await db.select().from(studentEngagementScores)
      .where(eq(studentEngagementScores.userId, userId))
      .orderBy(desc(studentEngagementScores.weekStart))
      .limit(8);

    res.json({
      student: {
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        studentName: student.studentName,
        createdAt: student.createdAt,
      },
      courses,
      events,
      tasks,
      engagement,
    });
  } catch (error: any) {
    console.error("[Academic Admin] Error getting student:", error);
    res.status(500).json({ error: "Failed to get student" });
  }
});

// GET /api/admin/academic/alerts — intervention alerts
router.get("/admin/alerts", requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const todayStr = today.toISOString().split("T")[0];
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];

    // All non-admin users
    const allStudents = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      studentName: users.studentName,
    }).from(users).where(eq(users.isAdmin, false));

    if (allStudents.length === 0) {
      return res.json({ alerts: [], total: 0 });
    }

    const studentMap = new Map(allStudents.map(s => [s.id, s]));

    // Batch: students with active courses (only alert those actually using system)
    const studentsWithCourses = await db.execute(sql`
      SELECT DISTINCT user_id FROM student_courses WHERE is_active = true
    `);
    const hasCoursesSet = new Set((studentsWithCourses.rows as any[]).map(r => r.user_id));

    // Batch: students with recent sessions (last 7 days)
    const recentSessions = await db.execute(sql`
      SELECT DISTINCT user_id FROM learning_sessions
      WHERE created_at >= ${sevenDaysAgo}
    `);
    const hasRecentSessionSet = new Set((recentSessions.rows as any[]).map(r => r.user_id));

    // Batch: latest engagement scores below 40
    const lowScores = await db.execute(sql`
      SELECT DISTINCT ON (user_id) user_id, engagement_score
      FROM student_engagement_scores
      WHERE course_id IS NULL
      ORDER BY user_id, week_start DESC
    `);
    const lowScoreMap = new Map<string, number>();
    for (const row of lowScores.rows as any[]) {
      const score = Number(row.engagement_score);
      if (score < 40) lowScoreMap.set(row.user_id, score);
    }

    // Batch: students with 3+ missed/overdue tasks
    const missedTaskCounts = await db.execute(sql`
      SELECT user_id, COUNT(*) as missed_count
      FROM student_tasks
      WHERE status NOT IN ('completed', 'skipped') AND due_date <= ${todayStr}
      GROUP BY user_id
      HAVING COUNT(*) >= 3
    `);
    const missedTaskMap = new Map<string, number>();
    for (const row of missedTaskCounts.rows as any[]) {
      missedTaskMap.set(row.user_id, Number(row.missed_count));
    }

    // Batch: upcoming exams within 3 days
    const upcomingExams = await db.execute(sql`
      SELECT user_id, title FROM student_calendar_events
      WHERE event_type = 'exam' AND status = 'upcoming'
        AND start_date >= ${todayStr} AND start_date <= ${threeDaysStr}
    `);
    const examsByStudent = new Map<string, string>();
    for (const row of upcomingExams.rows as any[]) {
      if (!examsByStudent.has(row.user_id)) {
        examsByStudent.set(row.user_id, row.title as string);
      }
    }

    // Assemble alerts
    const alerts: Array<{ type: string; student: any; details: string }> = [];

    for (const student of allStudents) {
      const sid = student.id;

      // No activity + has courses
      if (!hasRecentSessionSet.has(sid) && hasCoursesSet.has(sid)) {
        alerts.push({ type: "no_activity", student, details: "No tutoring sessions in 7+ days" });
      }

      // Low engagement
      if (lowScoreMap.has(sid)) {
        alerts.push({ type: "declining_engagement", student, details: `Engagement score: ${lowScoreMap.get(sid)}` });
      }

      // Missed deadlines
      if (missedTaskMap.has(sid)) {
        alerts.push({ type: "missed_deadlines", student, details: `${missedTaskMap.get(sid)} overdue tasks` });
      }

      // Exam unprepared
      if (examsByStudent.has(sid) && !hasRecentSessionSet.has(sid)) {
        alerts.push({ type: "exam_unprepared", student, details: `Exam "${examsByStudent.get(sid)}" in ≤3 days with no recent sessions` });
      }
    }

    res.json({ alerts, total: alerts.length });
  } catch (error: any) {
    console.error("[Academic Admin] Error getting alerts:", error);
    res.status(500).json({ error: "Failed to get alerts" });
  }
});

// POST /api/admin/academic/nudge — send nudge email
router.post("/admin/nudge", requireAdmin, async (req, res) => {
  try {
    const { studentEmail, subject, message } = req.body;
    if (!studentEmail || !message) {
      return res.status(400).json({ error: "studentEmail and message are required" });
    }

    const emailService = new EmailService();
    await emailService.sendEmail({
      to: studentEmail,
      subject: subject || "A message from your academic advisor — State University AI Tutor",
      html: `
        <div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #282728; padding: 20px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #C5050C;">
            <h1 style="color: white; margin: 0; font-size: 20px;">State University AI Tutor — Academic Support</h1>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
            <div style="margin-top: 24px; text-align: center;">
              <a href="${process.env.APP_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:5000'}`}/tutor"
                 style="display: inline-block; background: #C5050C; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Study with State University AI Tutor
              </a>
            </div>
          </div>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Academic Admin] Error sending nudge:", error);
    res.status(500).json({ error: "Failed to send nudge" });
  }
});

// GET /api/admin/academic/reporting — aggregate metrics
router.get("/admin/reporting", requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    // Average engagement score
    const avgScore = await db.select({
      avg: sql<number>`COALESCE(AVG(CAST(${studentEngagementScores.engagementScore} AS NUMERIC)), 0)`
    }).from(studentEngagementScores)
      .where(isNull(studentEngagementScores.courseId));

    // Active users this week
    const activeUsers = await db.select({
      count: sql<number>`COUNT(DISTINCT ${learningSessions.userId})`
    }).from(learningSessions)
      .where(gte(learningSessions.createdAt, weekStart));

    // Total study hours this week
    const totalMinutes = await db.select({
      total: sql<number>`COALESCE(SUM(${learningSessions.voiceMinutesUsed}), 0)`
    }).from(learningSessions)
      .where(gte(learningSessions.createdAt, weekStart));

    // Risk distribution
    const riskDist = await db.select({
      riskLevel: studentEngagementScores.riskLevel,
      count: count(),
    }).from(studentEngagementScores)
      .where(isNull(studentEngagementScores.courseId))
      .groupBy(studentEngagementScores.riskLevel);

    // Course engagement averages
    const courseEngagement = await db.select({
      courseId: studentEngagementScores.courseId,
      courseName: studentCourses.courseName,
      avgScore: sql<number>`AVG(CAST(${studentEngagementScores.engagementScore} AS NUMERIC))`,
    }).from(studentEngagementScores)
      .innerJoin(studentCourses, eq(studentEngagementScores.courseId, studentCourses.id))
      .groupBy(studentEngagementScores.courseId, studentCourses.courseName);

    res.json({
      avgEngagement: Math.round(Number(avgScore[0]?.avg || 0) * 100) / 100,
      activeUsersThisWeek: Number(activeUsers[0]?.count || 0),
      totalStudyHours: Math.round(Number(totalMinutes[0]?.total || 0) / 60 * 10) / 10,
      riskDistribution: riskDist,
      courseEngagement,
    });
  } catch (error: any) {
    console.error("[Academic Admin] Error getting reporting:", error);
    res.status(500).json({ error: "Failed to get reporting" });
  }
});

// GET /api/admin/academic/reporting/export — CSV export
router.get("/admin/reporting/export", requireAdmin, async (req, res) => {
  try {
    const allStudents = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      studentName: users.studentName,
    }).from(users).where(eq(users.isAdmin, false));

    // Batch: courses per student
    const courseData = await db.select({
      userId: studentCourses.userId,
      courseName: studentCourses.courseName,
    }).from(studentCourses).where(eq(studentCourses.isActive, true));
    const coursesByStudent = new Map<string, string[]>();
    for (const c of courseData) {
      const arr = coursesByStudent.get(c.userId) || [];
      arr.push(c.courseName);
      coursesByStudent.set(c.userId, arr);
    }

    // Batch: latest engagement scores
    const latestScores = await db.execute(sql`
      SELECT DISTINCT ON (user_id) user_id, engagement_score, risk_level
      FROM student_engagement_scores
      WHERE course_id IS NULL
      ORDER BY user_id, week_start DESC
    `);
    const scoresByStudent = new Map<string, { score: string; risk: string }>();
    for (const row of latestScores.rows as any[]) {
      scoresByStudent.set(row.user_id, { score: row.engagement_score, risk: row.risk_level });
    }

    // Batch: task counts
    const taskCounts = await db.execute(sql`
      SELECT user_id,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) as pending
      FROM student_tasks
      GROUP BY user_id
    `);
    const tasksByStudent = new Map<string, { completed: number; pending: number }>();
    for (const row of taskCounts.rows as any[]) {
      tasksByStudent.set(row.user_id, { completed: Number(row.completed), pending: Number(row.pending) });
    }

    // Batch: last sessions
    const lastSessions = await db.execute(sql`
      SELECT DISTINCT ON (user_id) user_id, created_at
      FROM learning_sessions
      ORDER BY user_id, created_at DESC
    `);
    const lastSessionByStudent = new Map<string, string>();
    for (const row of lastSessions.rows as any[]) {
      lastSessionByStudent.set(row.user_id, new Date(row.created_at).toISOString().split("T")[0]);
    }

    const rows: string[] = [
      "Student Name,Email,Courses,Engagement Score,Risk Level,Tasks Completed,Tasks Pending,Last Session"
    ];

    for (const student of allStudents) {
      const name = student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email;
      const courseNames = (coursesByStudent.get(student.id) || []).join("; ");
      const scoreData = scoresByStudent.get(student.id);
      const score = scoreData?.score || "N/A";
      const risk = scoreData?.risk || "N/A";
      const tasks = tasksByStudent.get(student.id);
      const lastDate = lastSessionByStudent.get(student.id) || "Never";

      rows.push(`"${name}","${student.email}","${courseNames}",${score},${risk},${tasks?.completed || 0},${tasks?.pending || 0},${lastDate}`);
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="academic-report-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(rows.join("\n"));
  } catch (error: any) {
    console.error("[Academic Admin] Error exporting:", error);
    res.status(500).json({ error: "Failed to export" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// POST /api/academic/send-reminder — send reminder email
router.post("/send-reminder", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { reminderId } = req.body;
    const [reminder] = await db.select().from(studentReminders)
      .where(and(eq(studentReminders.id, reminderId), eq(studentReminders.userId, userId)));
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const emailService = new EmailService();
    const appUrl = process.env.APP_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:5000'}`;

    await emailService.sendEmail({
      to: user.email,
      subject: `Reminder: ${reminder.message}`,
      html: `
        <div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #282728; padding: 20px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #C5050C;">
            <h1 style="color: white; margin: 0; font-size: 20px;">State University AI Tutor — Reminder</h1>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px; font-weight: 600; color: #333;">${reminder.message}</p>
            <p style="color: #666;">Date: ${reminder.reminderDate}</p>
            <div style="margin-top: 24px; text-align: center;">
              <a href="${appUrl}/tutor"
                 style="display: inline-block; background: #C5050C; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Study with State University AI Tutor
              </a>
            </div>
          </div>
        </div>
      `,
    });

    await db.update(studentReminders)
      .set({ delivered: true, deliveredAt: new Date() })
      .where(eq(studentReminders.id, reminderId));

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Academic] Error sending reminder:", error);
    res.status(500).json({ error: "Failed to send reminder" });
  }
});

// POST /api/academic/send-parent-digest — send weekly digest to parents
router.post("/send-parent-digest", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const parentShares = await db.select().from(studentParentShares)
      .where(and(eq(studentParentShares.userId, userId), eq(studentParentShares.isActive, true)));

    if (parentShares.length === 0) return res.json({ success: true, sent: 0 });

    // Gather data
    const engagement = await calculateEngagement(userId);
    const courses = await db.select().from(studentCourses)
      .where(and(eq(studentCourses.userId, userId), eq(studentCourses.isActive, true)));

    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const upcomingEvents = await db.select().from(studentCalendarEvents)
      .where(and(
        eq(studentCalendarEvents.userId, userId),
        eq(studentCalendarEvents.status, "upcoming"),
        gte(studentCalendarEvents.startDate, today),
        lte(studentCalendarEvents.startDate, nextWeekStr)
      ))
      .orderBy(asc(studentCalendarEvents.startDate));

    const studentName = user.studentName || user.firstName || user.username;
    const emailService = new EmailService();
    const appUrl = process.env.APP_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:5000'}`;

    for (const share of parentShares) {
      const deadlinesList = upcomingEvents.map(e =>
        `<li>${e.title} — ${e.startDate}${e.eventType ? ` (${e.eventType})` : ''}</li>`
      ).join('');

      await emailService.sendEmail({
        to: share.parentEmail,
        subject: `${studentName}'s Weekly Academic Summary — State University AI Tutor`,
        html: `
          <div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #282728; padding: 20px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #C5050C;">
              <h1 style="color: white; margin: 0; font-size: 20px;">State University AI Tutor — Weekly Digest</h1>
            </div>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333;">${studentName}'s Academic Summary</h2>

              <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px; color: #555;">Engagement Score</h3>
                <p style="font-size: 36px; font-weight: 700; color: ${engagement.engagementScore >= 70 ? '#16a34a' : engagement.engagementScore >= 50 ? '#ca8a04' : '#dc2626'}; margin: 0;">
                  ${engagement.engagementScore}/100
                </p>
              </div>

              <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px; color: #555;">Courses (${courses.length})</h3>
                <p style="color: #333;">${courses.map(c => c.courseName).join(', ') || 'None loaded yet'}</p>
              </div>

              <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px; color: #555;">This Week</h3>
                <p style="color: #333;">Sessions: ${engagement.sessionsCompleted} | Tasks completed: ${engagement.tasksCompleted} | Study time: ${engagement.totalStudyMinutes} min</p>
              </div>

              ${upcomingEvents.length > 0 ? `
              <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px; color: #555;">Upcoming Deadlines</h3>
                <ul style="color: #333;">${deadlinesList}</ul>
              </div>` : ''}

              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
                This summary was shared by ${studentName} via <a href="${appUrl}">State University AI Tutor</a>
              </p>
            </div>
          </div>
        `,
      });
    }

    res.json({ success: true, sent: parentShares.length });
  } catch (error: any) {
    console.error("[Academic] Error sending parent digest:", error);
    res.status(500).json({ error: "Failed to send parent digest" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Voice Tutor Academic Context — exported for use in custom-voice-ws.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getAcademicContextForVoice(userId: string): Promise<string> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysStr = sevenDays.toISOString().split("T")[0];

    // Upcoming exams within 7 days
    const upcomingExams = await db.select({
      event: studentCalendarEvents,
      courseName: studentCourses.courseName,
    })
      .from(studentCalendarEvents)
      .leftJoin(studentCourses, eq(studentCalendarEvents.courseId, studentCourses.id))
      .where(and(
        eq(studentCalendarEvents.userId, userId),
        eq(studentCalendarEvents.eventType, "exam"),
        eq(studentCalendarEvents.status, "upcoming"),
        gte(studentCalendarEvents.startDate, today),
        lte(studentCalendarEvents.startDate, sevenDaysStr)
      ))
      .orderBy(asc(studentCalendarEvents.startDate));

    // Overdue or due-today assignments
    const overdueOrDueToday = await db.select({
      event: studentCalendarEvents,
      courseName: studentCourses.courseName,
    })
      .from(studentCalendarEvents)
      .leftJoin(studentCourses, eq(studentCalendarEvents.courseId, studentCourses.id))
      .where(and(
        eq(studentCalendarEvents.userId, userId),
        or(eq(studentCalendarEvents.eventType, "assignment"), eq(studentCalendarEvents.eventType, "project")),
        eq(studentCalendarEvents.status, "upcoming"),
        lte(studentCalendarEvents.startDate, today)
      ))
      .orderBy(asc(studentCalendarEvents.startDate));

    // Active study tasks
    const activeTasks = await db.select({
      task: studentTasks,
      courseName: studentCourses.courseName,
    })
      .from(studentTasks)
      .leftJoin(studentCourses, eq(studentTasks.courseId, studentCourses.id))
      .where(and(
        eq(studentTasks.userId, userId),
        or(eq(studentTasks.status, "pending"), eq(studentTasks.status, "in_progress")),
        lte(studentTasks.dueDate, sevenDaysStr)
      ))
      .orderBy(asc(studentTasks.dueDate))
      .limit(5);

    if (upcomingExams.length === 0 && overdueOrDueToday.length === 0 && activeTasks.length === 0) {
      return "";
    }

    let context = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 STUDENT ACADEMIC CONTEXT (from their syllabus calendar):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    if (upcomingExams.length > 0) {
      context += `\n\nUPCOMING EXAMS (next 7 days):`;
      for (const e of upcomingExams) {
        context += `\n- ${e.event.title} (${e.courseName || 'General'}) — ${e.event.startDate}`;
      }
    }

    if (overdueOrDueToday.length > 0) {
      context += `\n\nOVERDUE/DUE TODAY:`;
      for (const e of overdueOrDueToday) {
        context += `\n- ${e.event.title} (${e.courseName || 'General'}) — due ${e.event.startDate}`;
      }
    }

    if (activeTasks.length > 0) {
      context += `\n\nACTIVE STUDY TASKS:`;
      for (const t of activeTasks) {
        context += `\n- ${t.task.title} (${t.courseName || 'General'})${t.task.dueDate ? ` — due ${t.task.dueDate}` : ''}`;
      }
    }

    context += `\n\nUSE THIS CONTEXT TO:
- Proactively suggest reviewing for upcoming exams (e.g., "I see you have an exam in 3 days...")
- Remind about overdue assignments
- Guide study sessions toward the most urgent topics
- Do NOT read out a full list unprompted — mention the most relevant 1-2 items naturally
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return context;
  } catch (error) {
    console.error("[Academic] Error getting voice context:", error);
    return "";
  }
}

export default router;

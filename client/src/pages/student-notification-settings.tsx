/**
 * Student Notification Settings (State University)
 * -----------------------------------------------
 * A page where a student opts in parents, advisors, or their own email to receive
 * digest emails of upcoming coursework. OFF by default — no recipient is added
 * unless the student explicitly adds one here.
 *
 * Accessible at /academic-dashboard/notifications
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Trash2, Mail, Plus } from "lucide-react";

interface NotificationPref {
  id: string;
  userId: string;
  childId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  recipientRole: 'self' | 'parent' | 'admin';
  frequency: 'off' | 'daily' | 'weekly';
  horizonDays: number;
  dayOfWeek: number;
  hourLocal: number;
  timezone: string;
  atRiskAlerts: boolean;
  isActive: boolean;
  lastSentAt: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
}));

export default function StudentNotificationSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: prefsData, isLoading } = useQuery<{ preferences: NotificationPref[] }>({
    queryKey: ["/api/notifications/prefs"],
  });

  const prefs = prefsData?.preferences || [];

  const createMutation = useMutation({
    mutationFn: async (body: Partial<NotificationPref>) => {
      const res = await apiRequest("POST", "/api/notifications/prefs", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/prefs"] });
      toast({ title: "Added", description: "Notification preference created." });
    },
    onError: (err: any) => {
      toast({
        title: "Could not add",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NotificationPref> }) => {
      const res = await apiRequest("PATCH", `/api/notifications/prefs/${id}`, patch);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/prefs"] });
    },
    onError: (err: any) => {
      toast({
        title: "Could not save",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/notifications/prefs/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/prefs"] });
      toast({ title: "Removed", description: "Notification preference deleted." });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/notifications/prefs/${id}/preview`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preview sent",
        description: "Check the recipient's inbox in a moment.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Preview failed",
        description: err?.message || "Could not send preview email.",
        variant: "destructive",
      });
    },
  });

  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<'self' | 'parent' | 'admin'>('self');

  const handleAdd = () => {
    if (!newEmail.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      recipientEmail: newEmail.trim(),
      recipientName: newName.trim() || null,
      recipientRole: newRole,
      frequency: 'off',
    });
    setNewEmail("");
    setNewName("");
    setNewRole('self');
    setAdding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/academic-dashboard")}>
            ← Back to Academic Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-6 h-6" style={{ color: "#C5050C" }} />
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>
          <p className="text-muted-foreground">
            Get an email digest of your upcoming assignments, quizzes, and tests.
            You can also send digests to a parent, advisor, or coach.
            Off by default — add a recipient to turn it on.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <div className="text-muted-foreground">Loading…</div>}

            {!isLoading && prefs.length === 0 && !adding && (
              <div className="text-sm text-muted-foreground">
                No recipients configured yet.
              </div>
            )}

            {prefs.map(pref => (
              <PrefRow
                key={pref.id}
                pref={pref}
                onUpdate={(patch) => updateMutation.mutate({ id: pref.id, patch })}
                onDelete={() => {
                  if (confirm("Remove this recipient?")) deleteMutation.mutate(pref.id);
                }}
                onPreview={() => previewMutation.mutate(pref.id)}
                isSaving={updateMutation.isPending}
                isPreviewing={previewMutation.isPending}
              />
            ))}

            {adding ? (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div>
                  <Label htmlFor="new-email">Recipient email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="new-name">Name (optional)</Label>
                  <Input
                    id="new-name"
                    placeholder="Mom, Dad, Advisor Smith"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Myself</SelectItem>
                      <SelectItem value="parent">Parent / guardian</SelectItem>
                      <SelectItem value="admin">Advisor / coach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={createMutation.isPending}>
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => { setAdding(false); setNewEmail(""); setNewName(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setAdding(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add recipient
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PrefRow({
  pref,
  onUpdate,
  onDelete,
  onPreview,
  isSaving,
  isPreviewing,
}: {
  pref: NotificationPref;
  onUpdate: (patch: Partial<NotificationPref>) => void;
  onDelete: () => void;
  onPreview: () => void;
  isSaving: boolean;
  isPreviewing: boolean;
}) {
  const isOn = pref.frequency !== 'off' && pref.isActive;

  const roleLabel =
    pref.recipientRole === 'parent' ? 'Parent' :
    pref.recipientRole === 'admin'  ? 'Advisor' :
    'Self';

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{pref.recipientEmail}</div>
            <div className="text-xs text-muted-foreground">
              {pref.recipientName ? `${pref.recipientName} · ` : ''}{roleLabel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${pref.id}`} className="text-sm text-muted-foreground">
            {isOn ? "On" : "Off"}
          </Label>
          <Switch
            id={`active-${pref.id}`}
            checked={isOn}
            onCheckedChange={(checked) => {
              onUpdate({
                isActive: checked,
                frequency: checked ? (pref.frequency === 'off' ? 'weekly' : pref.frequency) : 'off',
              });
            }}
            disabled={isSaving}
          />
        </div>
      </div>

      {isOn && (
        <div className="grid gap-3 pt-2 border-t sm:grid-cols-2">
          <div>
            <Label>Frequency</Label>
            <Select
              value={pref.frequency}
              onValueChange={(v) => onUpdate({ frequency: v as 'daily' | 'weekly' })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pref.frequency === 'weekly' && (
            <div>
              <Label>Day of week</Label>
              <Select
                value={String(pref.dayOfWeek)}
                onValueChange={(v) => onUpdate({ dayOfWeek: Number(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Time of day</Label>
            <Select
              value={String(pref.hourLocal)}
              onValueChange={(v) => onUpdate({ hourLocal: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map(h => (
                  <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Look-ahead</Label>
            <Select
              value={String(pref.horizonDays)}
              onValueChange={(v) => onUpdate({ horizonDays: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Next 3 days</SelectItem>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="14">Next 14 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2 pt-2 border-t">
            <Switch
              id={`atrisk-${pref.id}`}
              checked={pref.atRiskAlerts}
              onCheckedChange={(checked) => onUpdate({ atRiskAlerts: checked })}
            />
            <Label htmlFor={`atrisk-${pref.id}`} className="text-sm">
              Also alert if falling behind (3+ overdue tasks, low engagement, or a test in 48h with no prep)
            </Label>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          disabled={isPreviewing}
        >
          <Mail className="w-3 h-3 mr-1" />
          {isPreviewing ? "Sending…" : "Send preview"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive ml-auto">
          <Trash2 className="w-3 h-3 mr-1" /> Remove
        </Button>
      </div>

      {pref.lastSentAt && (
        <div className="text-xs text-muted-foreground">
          Last sent: {new Date(pref.lastSentAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

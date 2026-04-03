import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, ChevronDown, Settings } from "lucide-react";

interface Student {
  id: string;
  name: string;
  grade?: string;
  avatarUrl?: string;
  avatarType?: 'default' | 'preset' | 'upload';
}

interface StudentSwitcherProps {
  selectedStudentId?: string;
  onSelectStudent: (studentId: string | null) => void;
  onOpenProfile: (studentId?: string) => void;
}

const LAST_STUDENT_KEY = 'jie-last-selected-student';

export function StudentSwitcher({ 
  selectedStudentId, 
  onSelectStudent, 
  onOpenProfile 
}: StudentSwitcherProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Auto-ensure default student profile exists on mount
  const ensureDefaultMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/students/ensure-default', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to ensure student profile');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      if (data.id && !selectedStudentId) {
        onSelectStudent(data.id);
        try { localStorage.setItem(LAST_STUDENT_KEY, data.id); } catch {}
      }
    },
  });

  // Auto-ensure on mount if no students exist
  useEffect(() => {
    if (!isLoading && students.length === 0 && !ensureDefaultMutation.isPending) {
      ensureDefaultMutation.mutate();
    }
  }, [isLoading, students.length]);

  // Auto-select student on mount
  useEffect(() => {
    if (isLoading || students.length === 0 || selectedStudentId) {
      return;
    }

    // Try to restore last selected student
    try {
      const lastSelected = localStorage.getItem(LAST_STUDENT_KEY);
      if (lastSelected && students.some(s => s.id === lastSelected)) {
        onSelectStudent(lastSelected);
        return;
      }
    } catch {}

    // Auto-select the first (and only) student
    if (students.length > 0) {
      onSelectStudent(students[0].id);
    }
  }, [students, isLoading, selectedStudentId, onSelectStudent]);

  // Save selected student to localStorage
  const handleSelectStudent = (studentId: string) => {
    try {
      localStorage.setItem(LAST_STUDENT_KEY, studentId);
    } catch {}
    onSelectStudent(studentId);
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);
  
  const displayName = currentStudent?.name || user?.studentName || user?.firstName || "Student";

  // Helper to render avatar
  const renderAvatar = (student: Student | undefined, size: 'sm' | 'md' = 'sm') => {
    if (!student?.avatarUrl) {
      return <User className={size === 'sm' ? "h-4 w-4" : "h-5 w-5"} />;
    }
    
    if (student.avatarType === 'upload') {
      return (
        <img 
          src={student.avatarUrl} 
          alt={student.name}
          className={`rounded-full object-cover ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}
        />
      );
    }
    
    return <span className={size === 'sm' ? "text-sm" : "text-base"}>{student.avatarUrl}</span>;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 ml-6"
          data-testid="button-student-switcher"
        >
          {renderAvatar(currentStudent, 'sm')}
          <span className="max-w-[150px] truncate">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>Your Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading && (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        )}
        
        {!isLoading && students.length === 0 && (
          <DropdownMenuItem disabled>Setting up your profile...</DropdownMenuItem>
        )}
        
        {currentStudent && (
          <>
            <DropdownMenuItem className="gap-2" disabled>
              <div className="w-5 h-5 flex items-center justify-center">
                {renderAvatar(currentStudent, 'md')}
              </div>
              <div className="flex flex-col">
                <span>{currentStudent.name}</span>
                {currentStudent.grade && (
                  <span className="text-xs text-muted-foreground">{currentStudent.grade}</span>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onOpenProfile(currentStudent.id)}
              className="gap-2"
              data-testid="button-edit-student"
            >
              <Settings className="h-4 w-4" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

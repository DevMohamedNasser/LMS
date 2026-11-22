import StudentFrame from "./student-frame";
import StudentDashboardClient from "./student-dashboard-client";

export default function StudentPage() {
  return (
    <StudentFrame
      render={(student) => (
        <StudentDashboardClient
          studentId={student.id}
          studentName={student.name}
        />
      )}
    />
  );
}
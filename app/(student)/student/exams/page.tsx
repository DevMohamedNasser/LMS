import StudentFrame from "../student-frame";
import ExamsClient from "./exams-client";

export default function StudentExamsPage() {
  return (
    <StudentFrame
      render={(student) => <ExamsClient studentId={student.id} />}
    />
  );
}

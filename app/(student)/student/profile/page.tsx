import StudentFrame from "../student-frame";
import ProfileClient from "./profile-client";

export default function StudentProfilePage() {
  return (
    <StudentFrame
      render={(student) => (
        <ProfileClient
          studentId={student.id}
          studentName={student.name}
          studentEmail={student.email}
        />
      )}
    />
  );
}

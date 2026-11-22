import StudentFrame from "../student-frame";
import MaterialsClient from "./materials-client";

export default function StudentMaterialsPage() {
  return (
    <StudentFrame
      render={(student) => <MaterialsClient studentId={student.id} />}
    />
  );
}

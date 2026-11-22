import StudentFrame from "../student-frame";
import ResultsClient from "./results-client";

export default function StudentResultsPage() {
  return (
    <StudentFrame
      render={(student) => <ResultsClient studentId={student.id} />}
    />
  );
}

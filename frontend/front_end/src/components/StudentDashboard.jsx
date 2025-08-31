import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const tokens = JSON.parse(localStorage.getItem("tokens"));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/student/profile/", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokens.access}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch student profile");
        }

        const data = await res.json();
        setStudent(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  if (!student) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Welcome, {student.name}</h1>
      <p><strong>Roll No:</strong> {student.role_number}</p>
      <p><strong>Email:</strong> {student.email_address}</p>
      <p><strong>Phone:</strong> {student.parent_mobile_number}</p>
      <p><strong>Department:</strong> {student.department}</p>
    </div>
  );
}

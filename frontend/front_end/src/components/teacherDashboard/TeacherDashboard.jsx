
import { useState,useEffect } from "react";
import { Outlet } from "react-router-dom";
export default function TeacherDashboard () {
  // const [teacher, setTeacher] = useState(null);
  // const tokens = JSON.parse(localStorage.getItem("tokens"));

  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       const res = await fetch("http://127.0.0.1:8000/teacher/profile/", {
  //         headers: {
  //           "Content-Type": "application/json",
  //           "Authorization": `Bearer ${tokens.access}`
  //         }
  //       });

  //       if (!res.ok) {
  //         throw new Error("Failed to fetch teacher profile");
  //       }

  //       const data = await res.json();
  //       setTeacher(data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   fetchProfile();
  // }, []);

  // if (!teacher) return <p>Loading...</p>;

  return (
    <div >
      {/* <h1 className="text-xl font-bold">Welcome, {teacher.full_name}</h1>
      
      <p><strong>Email:</strong> {teacher.email}</p>
      <p><strong>Phone:</strong> {teacher.phone_number}</p>
      <p><strong>Department:</strong> {teacher.department}</p>
      {teacher.classes && teacher.classes.length>0?(
        <div>
          <h2 className="text-lg font-semibold mt-4">Classes</h2>
          <ul>
            {teacher.classed.map((cls)=>{
              <li key={cls.id}>{cls.name}</li>
            })}
          </ul>
        </div>
      ):(<p>No classes assigned.</p>)} */}
      <Outlet/>
    </div>  
  );
}

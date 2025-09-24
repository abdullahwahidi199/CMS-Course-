import React from "react";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* About System */}
        <section className="bg-white shadow-md rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">About This System</h2>
          <p className="text-gray-600 mb-6">
            The <span className="font-semibold">Course Management System</span> is a comprehensive platform 
            designed to simplify academic management for institutions, teachers, and students. It ensures 
            secure access through <span className="font-semibold">authentication and authorization</span> 
            and provides three dedicated dashboards tailored for different users:
          </p>

          <div className="space-y-4">
            {/* Admin */}
            <div>
              <h3 className="text-xl font-semibold text-gray-700">Admin Dashboard</h3>
              <ul className="list-disc list-inside text-gray-600 ml-4">
                <li>Manage announcements (CRUD)</li>
                <li>Add and manage teachers</li>
                <li>Handle student admissions</li>
                <li>Track student attendance</li>
                <li>Manage classes, students, and their profiles</li>
                <li>Monitor student fee payments and history</li>
                <li>Allocate rooms and manage expenses with records</li>
                <li>Create and manage timetables</li>
                <li>Manage additional staff information</li>
              </ul>
            </div>

            {/* Teacher */}
            <div>
              <h3 className="text-xl font-semibold text-gray-700">Teacher Dashboard</h3>
              <ul className="list-disc list-inside text-gray-600 ml-4">
                <li>Create and manage assignments</li>
                <li>Add or update exam marks</li>
                <li>Track student submissions</li>
                <li>Evaluate and update submission marks</li>
              </ul>
            </div>

            {/* Student */}
            <div>
              <h3 className="text-xl font-semibold text-gray-700">Student Dashboard</h3>
              <ul className="list-disc list-inside text-gray-600 ml-4">
                <li>View exam marks and performance</li>
                <li>Access assignments with clear status (expired, pending, submitted)</li>
                <li>Track personal attendance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* About Developer */}
        <section className="bg-white shadow-md rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">About the Developer</h2>
          <p className="text-gray-600 mb-4">
            Hi, I’m <span className="font-semibold">Abdullah Wahidi</span>, a{" "}
            <span className="font-semibold">Full-Stack Developer</span> currently studying{" "}
            <span className="font-semibold">Software Engineering at Kabul University</span>. 
            I’m passionate about building efficient, user-friendly systems that solve real-world problems.
          </p>
          <p className="text-gray-600 mb-4">
            This project is built with the <span className="font-semibold">React + Django stack</span>, 
            combining a powerful backend with a modern, responsive frontend. Through this system, I aimed 
            to strengthen my skills in full-stack development, authentication/authorization, and 
            role-based access control.
          </p>
          <p className="text-gray-600">
            I’m continuously learning and expanding my expertise in{" "}
            <span className="font-semibold">web development, backend technologies, and AI/ML</span>. 
            You can connect with me to explore more of my projects, ideas, and collaborations.
          </p>

          {/* Social Links */}
          <div className="mt-6 flex space-x-4">
            <a
              href="https://github.com/abdullahwahidi199/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              🌐 GitHub
            </a>
            {/* <a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              🔗 LinkedIn
            </a> */}
            <a
              href="mailto:abullahwahidi875@gmail.com"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              📧 Email
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm">
          Made with ❤️ by Abdullah Wahidi
        </footer>
      </div>
    </div>
  );
}

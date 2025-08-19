import React, { useEffect, useState } from 'react';

function Timetable() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/classes/')  // Adjust the URL as needed
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch timetable');
        }
        return res.json();
      })
      .then((data) => {
        setClasses(data);
        console.log(data)
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className='flex justify-center items-center'><div id="🤚">
	<div id="👉"></div>
	<div id="👉"></div>
	<div id="👉"></div>
	<div id="👉"></div>
	<div id="🌴"></div>		
	<div id="👍"></div>
</div></div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
        {classes.length>0 &&(
            <div>
      <h1>School Timetable</h1>
      <table className='min-w-full text-sm border border-gray-300'>
        <thead className='bf-gray-150'>
          <tr>
            <th className='px-4 py-2 border'>Class Name</th>
            <th className='px-4 py-2 border'>Start Time</th>
            <th className='px-4 py-2 border'>End Time</th>
            {/* <th className='px-4 py-2 border'>Room</th> */}
            <th className='px-4 py-2 border'>Teachers</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => (
            <tr key={cls.id}>
              <td className='px-4 py-2 border text-center'>{cls.name}</td>
              <td className='px-4 py-2 border text-center'>{cls.start_time}</td>
              <td className='px-4 py-2 border text-center'>{cls.end_time}</td>
              {/* <td className='px-4 py-2 border text-center'>{cls.roomOfClass.name}</td> */}
              <td className='px-4 py-2 border text-center'>
                {cls.teachers_details.map((teacher) => teacher.full_name).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
        )}
    </div>
     
  );
}

export default Timetable;

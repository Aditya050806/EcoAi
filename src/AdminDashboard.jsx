import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

});

export default function AdminDashboard({ goBack}) {

  const [reports, setReports] = useState([]);

  // ==========================
  // FETCH REPORTS
  // ==========================
  useEffect(() => {

    const fetchReports = () => {
  
      fetch("http://127.0.0.1:8000/reports")
  
        .then((res) => res.json())
  
        .then((data) => {
  
          console.log(data);
  
          setReports(data);
  
        })
  
        .catch((err) => {
  
          console.log(err);
  
        });
  
    };
  
    // FIRST LOAD
    fetchReports();
  
    // AUTO REFRESH EVERY 3 SECONDS
    const interval = setInterval(
      fetchReports,
      3000
    );
  
    return () =>
      clearInterval(interval);
  
  }, []);
  const markAsCleaned = async (id) => {

    try {
  
      await fetch(
        `http://127.0.0.1:8000/clean/${id}`,
        {
          method: "PUT",
        }
      );
  
      setReports(
  
        reports.map((report) =>
  
          report.id === id
  
            ? {
                ...report,
                status: "Cleaned",
              }
  
            : report
  
        )
  
      );
  
    } catch (error) {
  
      console.log(error);
  
    }
  
  };
  const updateStatus = async (

    id,
    status
  
  ) => {
  
    try {
  
      await fetch(
  
        `http://127.0.0.1:8000/status/${id}`,
  
        {
          method: "PUT",
  
          headers: {
            "Content-Type":
              "application/json",
          },
  
          body: JSON.stringify({
            status,
          }),
        }
  
      );
  
      setReports(
  
        reports.map((report) =>
  
          report.id === id
  
            ? {
                ...report,
                status,
              }
  
            : report
  
        )
  
      );
  
    } catch (error) {
  
      console.log(error);
  
    }
  
  };
  const totalReports =
  reports.length;

const cleanedReports =
  reports.filter(
    (r) => r.status === "Cleaned"
  ).length;

const pendingReports =
  reports.filter(
    (r) => r.status === "Pending"
  ).length;

const totalPlastic =
  reports.reduce(
    (sum, r) =>
      sum + Number(r.plastic || 0),
    0
  );
  return (

    <div className="min-h-screen bg-gray-100 p-10">

      {/* HEADER */}
      <div className="mb-10 flex justify-between items-center">

        <div>

          <h1 className="text-5xl font-black text-emerald-600">
            Municipal Dashboard
          </h1>

          <p className="text-gray-600 text-xl mt-3">
            Live garbage reports from citizens
          </p>

        </div>

        <button
       onClick={goBack}
          className="px-6 py-3 bg-black text-white rounded-2xl"
        >
          Back
        </button>

      </div>
{/* ANALYTICS */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

  {/* TOTAL REPORTS */}
  <div className="bg-white p-6 rounded-3xl shadow-xl">

    <h2 className="text-gray-500 text-lg">
      Total Reports
    </h2>

    <h1 className="text-5xl font-black text-cyan-500 mt-3">
      {totalReports}
    </h1>

  </div>

  {/* CLEANED */}
  <div className="bg-white p-6 rounded-3xl shadow-xl">

    <h2 className="text-gray-500 text-lg">
      Cleaned
    </h2>

    <h1 className="text-5xl font-black text-emerald-500 mt-3">
      {cleanedReports}
    </h1>

  </div>

  {/* PENDING */}
  <div className="bg-white p-6 rounded-3xl shadow-xl">

    <h2 className="text-gray-500 text-lg">
      Pending
    </h2>

    <h1 className="text-5xl font-black text-red-500 mt-3">
      {pendingReports}
    </h1>

  </div>

  {/* PLASTIC */}
  <div className="bg-white p-6 rounded-3xl shadow-xl">

    <h2 className="text-gray-500 text-lg">
      Total Plastic
    </h2>

    <h1 className="text-5xl font-black text-yellow-500 mt-3">
      {Math.round(totalPlastic)}%
    </h1>

  </div>

</div>
      {/* NO REPORTS */}
      {reports.length === 0 && (

        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">

          <h2 className="text-3xl font-bold text-gray-500">
            No Reports Found
          </h2>

        </div>

      )}

      {/* REPORT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {reports.map((report) => (

          <div
            key={report.id}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >

            {/* IMAGE */}
            <img
              src={`http://127.0.0.1:8000/${report.image}`}
              alt="waste"
              className="w-full h-72 object-cover"
            />

            {/* CONTENT */}
            <div className="p-6 space-y-4">

              <div className="flex justify-between">

                <span className="font-bold text-xl">
                  Plastic
                </span>

                <span className="text-emerald-600 font-black">
                  {report.plastic}%
                </span>

              </div>

              <div className="flex justify-between">

                <span className="font-bold text-xl">
                  Metal
                </span>

                <span className="text-cyan-600 font-black">
                  {report.metal}%
                </span>

              </div>

              <div className="flex justify-between">

                <span className="font-bold text-xl">
                  Organic
                </span>

                <span className="text-yellow-500 font-black">
                  {report.organic}%
                </span>

              </div>

              <hr />

              <div>

                <p className="text-gray-500">
                  📍 Location
                </p>

                <p className="font-bold">
                  {report.location}
                </p>

              </div>

              <div>

                <p className="text-gray-500">
                  Latitude
                </p>

                <p className="font-semibold">
                  {report.latitude}
                </p>

              </div>

              <div>

                <p className="text-gray-500">
                  Longitude
                </p>

                <p className="font-semibold">
                  {report.longitude}
                </p>

              </div>
              <div className="mt-5">

  <MapContainer

    center={[
      Number(report.latitude),
      Number(report.longitude),
    ]}

    zoom={15}

    scrollWheelZoom={false}

    style={{
      height: "250px",
      width: "100%",
      borderRadius: "20px",
    }}
  >

    <TileLayer
      attribution='&copy; OpenStreetMap contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <Marker
      position={[
        Number(report.latitude),
        Number(report.longitude),
      ]}
    >

      <Popup>

        Garbage Report Location

      </Popup>

    </Marker>

  </MapContainer>

</div>

              <div>

                <p className="text-gray-500">
                  Status
                </p>

                <p
  className={`font-bold px-4 py-2 rounded-full inline-block text-white

  ${report.status === "Pending"
    ? "bg-red-500"

    : report.status === "In Progress"
    ? "bg-yellow-500"

    : "bg-emerald-500"
  }`}
>

  {report.status}

</p>

              </div>

              <div className="flex gap-3">

{/* NAVIGATE */}
<button

  onClick={() => {

    window.open(

      `https://www.google.com/maps?q=${report.latitude},${report.longitude}`,

      "_blank"

    );

  }}

  className="w-1/3 py-3 bg-cyan-500 text-white rounded-2xl font-bold"
>

  Navigate

</button>

{/* IN PROGRESS */}
<button

  onClick={() =>
    updateStatus(
      report.id,
      "In Progress"
    )
  }

  className="w-1/3 py-3 bg-yellow-500 text-white rounded-2xl font-bold"
>

  Start

</button>

{/* CLEANED */}
<button

  onClick={() =>
    updateStatus(
      report.id,
      "Cleaned"
    )
  }

  className="w-1/3 py-3 bg-emerald-500 text-white rounded-2xl font-bold"
>

  Cleaned

</button>

</div>
            </div>

          </div>

        ))}

      </div>

    </div>

  );

}
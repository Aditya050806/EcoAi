import { useState, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";

export default function App() {

  // ==========================
  // STATES
  // ==========================

  const [selectedImage, setSelectedImage] = useState(null);

  const [capturedBlob, setCapturedBlob] = useState(null);

  const [detectedImage, setDetectedImage] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [showLogin, setShowLogin] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);

  const [userName, setUserName] = useState("");

  const [city, setCity] = useState("");

  const [latitude, setLatitude] = useState("");

  const [longitude, setLongitude] = useState("");

  const [plastic, setPlastic] = useState(0);

  const [metal, setMetal] = useState(0);

  const [organic, setOrganic] = useState(0);

  const [points, setPoints] = useState(0);

  const [reports, setReports] = useState(0);

  const [garbage, setGarbage] = useState(0);

  const [cameraOn, setCameraOn] = useState(false);

  const [stream, setStream] = useState(null);

  // ==========================
  // AUTO LOGIN
  // ==========================
  useEffect(() => {

    const savedUser =
      localStorage.getItem("ecoUser");

    const savedLat =
      localStorage.getItem("latitude");

    const savedLng =
      localStorage.getItem("longitude");

    if (savedLat) {
      setLatitude(savedLat);
    }

    if (savedLng) {
      setLongitude(savedLng);
    }

    if (savedUser) {

      const user = JSON.parse(savedUser);

      if (user?.id) {

        setLoggedIn(true);

        setUserName(user.name);

        setCity(user.city);

        fetch(
          `http://127.0.0.1:8000/user/${user.id}`
        )
          .then((res) => res.json())
          .then((data) => {

            setPoints(data.points || 0);

            setReports(data.reports || 0);

            setGarbage(data.garbage || 0);

          })
          .catch((err) => {

            console.log(err);

          });

      }

    }

  }, []);

  // ==========================
  // LOGIN
  // ==========================
  const handleLogin = async () => {

    if (!userName || !city) {

      alert("Please enter name and city");

      return;

    }

    navigator.geolocation.getCurrentPosition(

      async (position) => {

        const lat =
          position.coords.latitude;

        const long =
          position.coords.longitude;

        setLatitude(lat);

        setLongitude(long);

        localStorage.setItem(
          "latitude",
          lat
        );

        localStorage.setItem(
          "longitude",
          long
        );

        try {

          const response = await fetch(
            "http://127.0.0.1:8000/register",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                name: userName,
                city: city,
              }),
            }
          );

          const data =
            await response.json();

          localStorage.setItem(
            "ecoUser",
            JSON.stringify({
              id: data.user_id,
              name: data.name,
              city: data.city,
            })
          );

          setLoggedIn(true);

          setShowLogin(false);

          setPoints(0);

          setReports(0);

          setGarbage(0);

        } catch (error) {

          console.log(error);

          alert(
            "Backend connection failed"
          );

        }

      },

      () => {

        alert(
          "Please allow location access"
        );

      }

    );

  };

  // ==========================
  // LOGOUT
  // ==========================
  const handleLogout = () => {

    localStorage.clear();

    setLoggedIn(false);

    setUserName("");

    setCity("");

    setPoints(0);

    setReports(0);

    setGarbage(0);

  };

  // ==========================
  // START CAMERA
  // ==========================
  const startCamera = async () => {

    if (!loggedIn) {

      alert("Please login first");

      setShowLogin(true);

      return;

    }

    try {

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      setStream(mediaStream);

      setCameraOn(true);

      setTimeout(() => {

        const video =
          document.getElementById(
            "video"
          );

        if (video) {

          video.srcObject =
            mediaStream;

          video.play();

        }

      }, 300);

    } catch (error) {

      console.log(error);

      alert(
        "Camera permission denied"
      );

    }

  };

  // ==========================
  // CAPTURE IMAGE
  // ==========================
  const captureImage = () => {

    const video =
      document.getElementById(
        "video"
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const ctx =
      canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {

      if (!blob) {

        alert("Image capture failed");

        return;

      }

      const imageUrl =
        URL.createObjectURL(blob);

      setSelectedImage(imageUrl);

      setCapturedBlob(blob);

    }, "image/png");

    stream
      .getTracks()
      .forEach((track) =>
        track.stop()
      );

    setCameraOn(false);

  };

  // ==========================
  // UPLOAD CAPTURED IMAGE
  // ==========================
  const uploadCapturedImage =
    async () => {

      if (!loggedIn) {

        alert("Please login first");

        setShowLogin(true);

        return;

      }

      if (!capturedBlob) {

        alert("No image captured");

        return;

      }

      const userData =
        localStorage.getItem(
          "ecoUser"
        );

      if (!userData) {

        alert(
          "Please login first"
        );

        return;

      }

      const user =
        JSON.parse(userData);

      const savedLat =
        localStorage.getItem("latitude");

      const savedLng =
        localStorage.getItem("longitude");

      const formData =
        new FormData();

      formData.append(
        "user_id",
        String(user.id)
      );

      formData.append(
        "latitude",
        savedLat || "0"
      );

      formData.append(
        "longitude",
        savedLng || "0"
      );

      formData.append(
        "file",
        capturedBlob,
        `capture_${Date.now()}.png`
      );

      try {

        const response =
          await fetch(
            "http://127.0.0.1:8000/analyze",
            {
              method: "POST",
              body: formData,
            }
          );

        const data =
          await response.json();

        console.log(data);

        if (!data.results) {

          alert("Upload Failed");

          return;

        }

        const result =
          data.results;

        setPlastic(
          result.plastic || 0
        );

        setMetal(
          result.metal || 0
        );

        setOrganic(
          result.organic || 0
        );

        setDetectedImage(
          "http://127.0.0.1:8000/" +
          result.detected_image
        );

        setPoints(
          data.stats.points
        );

        setReports(
          data.stats.reports
        );

        setGarbage(
          data.stats.garbage
        );

        alert(
          "Image Uploaded Successfully"
        );

      } catch (error) {

        console.log(error);

        alert("Upload Failed");

      }

    };

  // ==========================
  // FILE IMAGE UPLOAD
  // ==========================
  const handleImageUpload =
    async (event) => {

      if (!loggedIn) {

        alert("Please login first");

        setShowLogin(true);

        return;

      }

      const file =
        event.target.files[0];

      if (!file) return;

      setSelectedImage(
        URL.createObjectURL(file)
      );

      const userData =
        localStorage.getItem(
          "ecoUser"
        );

      const savedLat =
        localStorage.getItem("latitude");

      const savedLng =
        localStorage.getItem("longitude");

      if (!userData) {

        alert(
          "Please login first"
        );

        return;

      }

      const user =
        JSON.parse(userData);

      const formData =
        new FormData();

      formData.append(
        "user_id",
        String(user.id)
      );

      formData.append(
        "latitude",
        savedLat || "0"
      );

      formData.append(
        "longitude",
        savedLng || "0"
      );

      formData.append(
        "file",
        file
      );

      try {

        const response =
          await fetch(
            "http://127.0.0.1:8000/analyze",
            {
              method: "POST",
              body: formData,
            }
          );

        const data =
          await response.json();

        console.log(data);

        if (!data.results) {

          alert("Upload Failed");

          return;

        }

        const result =
          data.results;

        setPlastic(
          result.plastic || 0
        );

        setMetal(
          result.metal || 0
        );

        setOrganic(
          result.organic || 0
        );

        setDetectedImage(
          "http://127.0.0.1:8000/" +
          result.detected_image
        );

        setPoints(
          data.stats.points
        );

        setReports(
          data.stats.reports
        );

        setGarbage(
          data.stats.garbage
        );

        alert(
          "AI Analysis Completed"
        );

      } catch (error) {

        console.log(error);

        alert("Upload Failed");

      }

    };

  // ==========================
  // SHOW ADMIN DASHBOARD
  // ==========================
  if (showAdmin) {

    return (

      <AdminDashboard
        goBack={() =>
          setShowAdmin(false)
        }
      />

    );

  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-cyan-100 p-5">

      {/* LOGIN MODAL */}
      {showLogin && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">

            <h2 className="text-4xl font-black text-center text-emerald-600 mb-3">
              Join EcoVision AI
            </h2>

            <p className="text-center text-gray-500 mb-6">
              Help your city become cleaner.
            </p>

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Enter Name"
                value={userName}
                onChange={(e) =>
                  setUserName(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-2xl"
              />

              <input
                type="text"
                placeholder="Enter City"
                value={city}
                onChange={(e) =>
                  setCity(
                    e.target.value
                  )
                }
                className="w-full p-4 border rounded-2xl"
              />

              <button
                onClick={handleLogin}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold"
              >
                Continue
              </button>

            </div>

          </div>

        </div>

      )}

      {/* NAVBAR */}
      <nav className="bg-white rounded-3xl p-5 shadow-lg flex justify-between items-center mb-10">

        <div>

          <h1 className="text-3xl font-black text-emerald-600">
            EcoVision AI
          </h1>

          <p className="text-gray-500">
            Smart Waste Detection
          </p>

        </div>

        <div className="flex gap-4">

          <button
            onClick={() =>
              setShowAdmin(true)
            }
            className="px-5 py-3 bg-black text-white rounded-2xl"
          >
            Admin Dashboard
          </button>

          {!loggedIn ? (

            <button
              onClick={() =>
                setShowLogin(true)
              }
              className="px-5 py-3 bg-white border rounded-2xl"
            >
              Login
            </button>

          ) : (

            <>
              <div className="px-5 py-3 bg-emerald-500 text-white rounded-2xl">
                {userName} • {city}
              </div>

              <button
                onClick={handleLogout}
                className="px-5 py-3 bg-red-500 text-white rounded-2xl"
              >
                Logout
              </button>
            </>

          )}

        </div>

      </nav>

      {/* MAIN */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* LEFT */}
        <div>

          <div className="inline-block bg-emerald-200 text-emerald-700 px-4 py-2 rounded-full mb-6">
            🌍 AI Powered Smart City
          </div>

          <h1 className="text-6xl font-black leading-tight mb-6">

            Turn Garbage Photos Into

            <span className="text-emerald-500">
              {" "}Smart Reports
            </span>

          </h1>

          <p className="text-xl text-gray-600">
            Upload waste photos and help municipalities keep cities clean.
          </p>

        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-6">

            <div className="text-6xl mb-3">
              ♻️
            </div>

            <h2 className="text-3xl font-bold">
              Upload Garbage Image
            </h2>

          </div>

          {/* FILE */}
          <div className="flex justify-center mb-5">

            <label className="cursor-pointer">

              <div className="px-6 py-3 bg-emerald-500 text-white rounded-2xl">
                Choose Image
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

            </label>

          </div>

          {/* CAMERA */}
          <div className="flex flex-col items-center gap-4">

            {!cameraOn ? (

              <button
                onClick={startCamera}
                className="px-6 py-3 bg-cyan-500 text-white rounded-2xl"
              >
                Open Camera
              </button>

            ) : (

              <>
                <video
                  id="video"
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[400px] object-cover rounded-2xl bg-black"
                />

                <button
                  onClick={captureImage}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-2xl"
                >
                  Capture Image
                </button>
              </>

            )}

          </div>

          {/* IMAGE PREVIEW */}
          {selectedImage && (

            <div className="mt-6">

              <img
                src={selectedImage}
                alt="preview"
                className="w-full rounded-2xl shadow-lg"
              />

            </div>

          )}

          {/* UPLOAD BUTTON */}
          {capturedBlob && (

            <div className="flex justify-center mt-5">

              <button
                onClick={
                  uploadCapturedImage
                }
                className="px-6 py-3 bg-purple-600 text-white rounded-2xl"
              >
                Upload For AI Analysis
              </button>

            </div>

          )}

          {/* AI DETECTED IMAGE */}
          {detectedImage && (

            <div className="mt-8">

              <h2 className="text-2xl font-bold text-center text-emerald-600 mb-4">
                AI Detection Result
              </h2>

              <img
                src={detectedImage}
                alt="detected"
                className="w-full rounded-2xl shadow-2xl border-4 border-emerald-400"
              />

            </div>

          )}

        </div>

      </section>

      {/* DASHBOARD */}
      <section className="mt-24">

        <div className="text-center mb-12">

          <h2 className="text-5xl font-black mb-4">
            {userName}'s Dashboard
          </h2>

          <p className="text-gray-600 text-xl">
            Track your environmental contribution.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white p-8 rounded-3xl shadow-xl">

            <div className="text-5xl mb-4">
              🏆
            </div>

            <h3 className="text-4xl font-black text-yellow-500">
              {points}
            </h3>

            <p className="text-gray-500 mt-2">
              EcoPoints Earned
            </p>

          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl">

            <div className="text-5xl mb-4">
              ♻️
            </div>

            <h3 className="text-4xl font-black text-cyan-500">
              {reports}
            </h3>

            <p className="text-gray-500 mt-2">
              Garbage Reports
            </p>

          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl">

            <div className="text-5xl mb-4">
              🌍
            </div>

            <h3 className="text-4xl font-black text-emerald-500">
              {garbage} KG
            </h3>

            <p className="text-gray-500 mt-2">
              Waste Reported
            </p>

          </div>

        </div>

      </section>

    </div>

  );

}
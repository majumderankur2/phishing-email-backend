import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  logoutUser,
  getUserData,
  listenToAuthChanges,
  saveLoginTime,
} from "../../services/sessionService";

const DashboardSidebar = () => {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {

    saveLoginTime();

    const unsubscribe = listenToAuthChanges(
      (userData) => {

        if (userData.loggedIn) {

          setUser(userData);

        } else {

          navigate("/login");
        }
      }
    );

    return () => unsubscribe();

  }, []);

  const handleLogout = async () => {

    const success = await logoutUser();

    if (success) {

      navigate("/login");
    }
  };

  return (

    <div className="w-[300px] min-h-screen bg-[#07153d] p-5 flex flex-col justify-between fixed left-0 top-0">

      {/* LOGO */}

      <div>

        <h1 className="text-5xl font-bold text-blue-400 mb-10">

          PhishGuard AI

        </h1>

        {/* MENU */}

        <div className="space-y-5">

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-all p-5 rounded-2xl text-2xl font-bold"
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/history")}
            className="w-full bg-[#1b2b52] hover:bg-[#263b6b] transition-all p-5 rounded-2xl text-2xl"
          >
            Scan History
          </button>

          <button
            onClick={() => navigate("/reports")}
            className="w-full bg-[#1b2b52] hover:bg-[#263b6b] transition-all p-5 rounded-2xl text-2xl"
          >
            Threat Reports
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="w-full bg-[#1b2b52] hover:bg-[#263b6b] transition-all p-5 rounded-2xl text-2xl"
          >
            Settings
          </button>

        </div>

      </div>

      {/* USER INFO */}

      <div>

        <div className="bg-black p-5 rounded-2xl mb-5">

          <p className="text-gray-400 text-lg">
            Logged in as
          </p>

          <p className="text-xl font-bold break-words">

            {user?.email}

          </p>

        </div>

        {/* LOGOUT */}

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 transition-all p-5 rounded-2xl text-2xl font-bold"
        >
          Logout
        </button>

      </div>

    </div>
  );
};

export default DashboardSidebar;
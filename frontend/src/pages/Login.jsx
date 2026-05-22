import { useState } from "react";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { auth } from "../firebase";

import { useNavigate, Link } from "react-router-dom";

const provider = new GoogleAuthProvider();

const Login = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login Successful");

      navigate("/dashboard");

    } catch (error) {

      console.error(error);

      alert(error.message);
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {

    try {

      setLoading(true);

      await signInWithPopup(
        auth,
        provider
      );

      alert("Google Login Successful");

      navigate("/dashboard");

    } catch (error) {

      console.error(error);

      alert(error.message);
    }

    setLoading(false);
  };

  return (

    <div className="min-h-screen bg-[#020b24] flex justify-center items-center p-6">

      <div className="bg-[#07153d] p-10 rounded-3xl w-full max-w-xl">

        {/* TITLE */}

        <h1 className="text-5xl font-bold text-white mb-10 text-center">

          Login

        </h1>

        {/* FORM */}

        <form
          onSubmit={handleLogin}
          className="space-y-6"
        >

          {/* EMAIL */}

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full p-5 rounded-2xl bg-black border border-gray-700 text-white text-xl outline-none"
            required
          />

          {/* PASSWORD */}

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full p-5 rounded-2xl bg-black border border-gray-700 text-white text-xl outline-none"
            required
          />

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-all p-5 rounded-2xl text-2xl font-bold text-white"
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>

        {/* DIVIDER */}

        <div className="flex items-center my-8">

          <div className="flex-1 h-[1px] bg-gray-700"></div>

          <span className="px-4 text-gray-400">
            OR
          </span>

          <div className="flex-1 h-[1px] bg-gray-700"></div>

        </div>

        {/* GOOGLE LOGIN */}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-200 transition-all p-5 rounded-2xl text-2xl font-bold text-black"
        >

          Continue with Google

        </button>

        {/* SIGNUP */}

        <p className="text-center text-gray-400 mt-8 text-xl">

          Don't have an account?

          <Link
            to="/signup"
            className="text-blue-400 ml-2"
          >
            Signup
          </Link>

        </p>

      </div>

    </div>
  );
};

export default Login;
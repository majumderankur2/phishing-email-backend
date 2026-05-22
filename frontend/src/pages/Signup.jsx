import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import {
  auth,
  googleProvider,
} from "../firebase";

import { useNavigate } from "react-router-dom";

export default function Signup() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleSignup = async () => {

    try {

      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Account created successfully");

      navigate("/dashboard");

    } catch (error) {

      alert(error.message);

    }

  };

  const googleSignup = async () => {

    try {

      await signInWithPopup(
        auth,
        googleProvider
      );

      navigate("/dashboard");

    } catch (error) {

      alert(error.message);

    }

  };

  return (
    <div className="
      min-h-screen
      bg-[#020617]
      text-white
      flex
      items-center
      justify-center
      px-6
    ">

      <div className="
        w-full
        max-w-md
        bg-slate-900
        border
        border-slate-800
        rounded-3xl
        p-8
      ">

        <h1 className="
          text-4xl
          font-black
          mb-8
          text-center
        ">
          Create Account
        </h1>

        {/* Email */}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="
            w-full
            bg-slate-950
            border
            border-slate-700
            rounded-2xl
            px-5
            py-4
            mb-5
            focus:outline-none
          "
        />

        {/* Password */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="
            w-full
            bg-slate-950
            border
            border-slate-700
            rounded-2xl
            px-5
            py-4
            mb-6
            focus:outline-none
          "
        />

        {/* Signup Button */}

        <button
          onClick={handleSignup}
          className="
            w-full
            bg-blue-600
            hover:bg-blue-700
            transition
            py-4
            rounded-2xl
            font-semibold
            mb-5
          "
        >
          Sign Up
        </button>

        {/* Google */}

        <button
          onClick={googleSignup}
          className="
            w-full
            bg-white
            text-black
            py-4
            rounded-2xl
            font-semibold
          "
        >
          Continue with Google
        </button>

      </div>

    </div>
  );
}
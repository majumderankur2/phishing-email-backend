import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {

  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <nav className="
      fixed
      top-0
      left-0
      w-full
      z-50
      bg-slate-950/80
      backdrop-blur-lg
      border-b
      border-slate-800
    ">

      <div className="
        max-w-7xl
        mx-auto
        px-6
        py-4
        flex
        items-center
        justify-between
      ">

        {/* Logo */}

        <Link
          to="/"
          className="
            text-2xl
            font-black
            bg-gradient-to-r
            from-blue-400
            to-purple-500
            bg-clip-text
            text-transparent
          "
        >
          PhishGuard AI
        </Link>

        {/* Desktop Menu */}

        <div className="
          hidden
          md:flex
          items-center
          gap-8
        ">

          <a href="#features" className="text-slate-300 hover:text-white transition">
            Features
          </a>

          <a href="#pricing" className="text-slate-300 hover:text-white transition">
            Pricing
          </a>

          <a href="#testimonials" className="text-slate-300 hover:text-white transition">
            Reviews
          </a>

          <a href="#faq" className="text-slate-300 hover:text-white transition">
            FAQ
          </a>

        </div>

        {/* Desktop Buttons */}

        <div className="
          hidden
          md:flex
          items-center
          gap-4
        ">

          <Link
            to="/login"
            className="text-slate-300 hover:text-white transition"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="
              bg-blue-600
              hover:bg-blue-700
              transition
              px-5
              py-2
              rounded-xl
              font-medium
              shadow-lg
            "
          >
            Get Started
          </Link>

        </div>

        {/* Mobile Menu Button */}

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="md:hidden"
        >

          {mobileMenu ? (
            <X size={28} />
          ) : (
            <Menu size={28} />
          )}

        </button>

      </div>

      {/* Mobile Menu */}

      {mobileMenu && (

        <div className="
          md:hidden
          bg-slate-950
          border-t
          border-slate-800
          px-6
          py-6
          space-y-6
        ">

          <a href="#features" className="block text-slate-300">
            Features
          </a>

          <a href="#pricing" className="block text-slate-300">
            Pricing
          </a>

          <a href="#testimonials" className="block text-slate-300">
            Reviews
          </a>

          <Link
            to="/login"
            className="block text-slate-300"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="
              block
              bg-blue-600
              text-center
              py-3
              rounded-xl
              font-semibold
            "
          >
            Get Started
          </Link>

        </div>

      )}

    </nav>
  );
}
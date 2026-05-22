import { useState } from "react";
import axios from "axios";

import { motion } from "framer-motion";

import Navbar from "../components/layout/Navbar";

import {
  Shield,
  MailWarning,
  Globe,
  BrainCircuit,
  Star,
} from "lucide-react";

export default function LandingPage() {

  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);

  const analyze = async () => {

    try {

      const res = await axios.post(
        "https://phishing-email-backend-7a45.onrender.com/analyze",
        { email }
      );

      setResult(res.data);

    } catch (error) {

      console.error(error);
      alert("Something went wrong");

    }

  };

  return (
    <>

      <Navbar />

      <div className="
        min-h-screen
        bg-[#020617]
        text-white
        overflow-hidden
        relative
      ">

        {/* Background Glow */}

        <div className="
          absolute
          top-0
          left-0
          w-full
          h-full
          overflow-hidden
          -z-0
        ">

          <div className="
            absolute
            top-[-100px]
            left-[-100px]
            w-[500px]
            h-[500px]
            bg-blue-500/10
            blur-[150px]
            rounded-full
          " />

          <div className="
            absolute
            bottom-[-100px]
            right-[-100px]
            w-[500px]
            h-[500px]
            bg-purple-500/10
            blur-[150px]
            rounded-full
          " />

        </div>

        <div className="
          relative
          z-10
          max-w-7xl
          mx-auto
          px-6
          pt-40
          pb-20
        ">

          {/* Hero */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >

            <p className="
              text-blue-400
              uppercase
              tracking-widest
              font-semibold
              mb-6
            ">
              AI Powered Cybersecurity Platform
            </p>

            <h1 className="
              text-5xl
              md:text-7xl
              font-black
              leading-tight
              mb-8
            ">

              Detect

              <span className="
                bg-gradient-to-r
                from-blue-400
                to-purple-500
                bg-clip-text
                text-transparent
              ">
                {" "}Phishing Emails{" "}
              </span>

              Instantly

            </h1>

            <p className="
              text-slate-400
              text-lg
              md:text-xl
              max-w-3xl
              mx-auto
              leading-relaxed
              mb-10
            ">
              Protect users and organizations using AI-powered
              cybersecurity threat analysis systems.
            </p>

            <div className="
              flex
              flex-col
              sm:flex-row
              items-center
              justify-center
              gap-5
            ">

              <button className="
                bg-blue-600
                hover:bg-blue-700
                transition
                px-8
                py-4
                rounded-2xl
                font-semibold
                text-lg
                shadow-2xl
              ">
                Start Scanning
              </button>

              <button className="
                border
                border-slate-700
                hover:border-slate-500
                transition
                px-8
                py-4
                rounded-2xl
                font-semibold
                text-lg
                bg-slate-900/60
              ">
                Watch Demo
              </button>

            </div>

          </motion.div>

          {/* Scanner */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="
              bg-slate-900
              border
              border-slate-800
              rounded-3xl
              p-8
              shadow-2xl
              mb-24
            "
          >

            <h2 className="text-3xl font-bold mb-6">
              Scan Suspicious Email
            </h2>

            <textarea
              rows="10"
              placeholder="Paste suspicious email here..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                bg-slate-950
                border
                border-slate-700
                rounded-2xl
                p-5
                text-white
                placeholder-slate-500
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

            <button
              onClick={analyze}
              className="
                mt-6
                bg-blue-600
                hover:bg-blue-700
                transition
                px-8
                py-4
                rounded-2xl
                font-semibold
                text-lg
              "
            >
              Analyze Email
            </button>

            {result && (

              <div className="
                mt-8
                bg-slate-950
                border
                border-slate-700
                rounded-2xl
                p-6
              ">

                <h2 className="text-2xl font-bold mb-3">

                  Prediction:

                  <span className="text-blue-400 ml-2">
                    {result.prediction}
                  </span>

                </h2>

                <h3 className="text-xl">

                  Confidence:

                  <span className="text-green-400 ml-2">
                    {result.confidence}%
                  </span>

                </h3>

              </div>

            )}

          </motion.div>

          {/* Features */}

          <div
            id="features"
            className="grid md:grid-cols-2 gap-8 mb-24"
          >

            {[
              {
                icon: <Shield className="text-blue-400" size={28} />,
                title: "AI Threat Detection",
                text: "Advanced ML-powered phishing threat detection.",
              },
              {
                icon: <MailWarning className="text-purple-400" size={28} />,
                title: "Email Risk Analysis",
                text: "Detect spoofing attempts and scam indicators.",
              },
              {
                icon: <Globe className="text-cyan-400" size={28} />,
                title: "URL & Domain Scanning",
                text: "Analyze malicious domains in real time.",
              },
              {
                icon: <BrainCircuit className="text-green-400" size={28} />,
                title: "AI Security Intelligence",
                text: "Generate AI-powered cybersecurity insights.",
              },
            ].map((card, index) => (

              <motion.div
                key={index}
                whileHover={{ y: -8 }}
                className="
                  bg-slate-900
                  border
                  border-slate-800
                  rounded-3xl
                  p-8
                "
              >

                <div className="
                  w-14
                  h-14
                  rounded-2xl
                  bg-slate-800
                  flex
                  items-center
                  justify-center
                  mb-6
                ">
                  {card.icon}
                </div>

                <h3 className="text-2xl font-bold mb-4">
                  {card.title}
                </h3>

                <p className="text-slate-400 leading-relaxed">
                  {card.text}
                </p>

              </motion.div>

            ))}

          </div>

          {/* Pricing */}

          <div
            id="pricing"
            className="mb-24"
          >

            <div className="text-center mb-16">

              <h2 className="
                text-5xl
                font-black
                mb-6
              ">
                Pricing Plans
              </h2>

              <p className="
                text-slate-400
                text-lg
              ">
                Choose the perfect cybersecurity plan
              </p>

            </div>

            <div className="
              grid
              md:grid-cols-3
              gap-8
            ">

              {[
                {
                  title: "Starter",
                  price: "$0",
                  features: [
                    "Basic phishing scans",
                    "Limited analytics",
                    "Community support",
                  ],
                },
                {
                  title: "Pro",
                  price: "$29",
                  features: [
                    "Advanced AI analysis",
                    "Threat dashboard",
                    "Priority support",
                  ],
                },
                {
                  title: "Enterprise",
                  price: "$99",
                  features: [
                    "Unlimited scanning",
                    "Custom analytics",
                    "24/7 monitoring",
                  ],
                },
              ].map((plan, index) => (

                <div
                  key={index}
                  className="
                    bg-slate-900
                    border
                    border-slate-800
                    rounded-3xl
                    p-8
                  "
                >

                  <h3 className="
                    text-3xl
                    font-bold
                    mb-4
                  ">
                    {plan.title}
                  </h3>

                  <h4 className="
                    text-5xl
                    font-black
                    text-blue-400
                    mb-8
                  ">
                    {plan.price}
                  </h4>

                  <div className="space-y-4 mb-8">

                    {plan.features.map((feature, i) => (

                      <p
                        key={i}
                        className="text-slate-400"
                      >
                        • {feature}
                      </p>

                    ))}

                  </div>

                  <button className="
                    w-full
                    bg-blue-600
                    hover:bg-blue-700
                    transition
                    py-4
                    rounded-2xl
                    font-semibold
                  ">
                    Choose Plan
                  </button>

                </div>

              ))}

            </div>

          </div>

          {/* Testimonials */}

          <div
            id="testimonials"
            className="mb-24"
          >

            <div className="text-center mb-16">

              <h2 className="
                text-5xl
                font-black
                mb-6
              ">
                Trusted by Security Teams
              </h2>

            </div>

            <div className="
              grid
              md:grid-cols-3
              gap-8
            ">

              {[1,2,3].map((item) => (

                <div
                  key={item}
                  className="
                    bg-slate-900
                    border
                    border-slate-800
                    rounded-3xl
                    p-8
                  "
                >

                  <div className="
                    flex
                    gap-1
                    mb-6
                  ">

                    {[1,2,3,4,5].map((star) => (
                      <Star
                        key={star}
                        className="text-yellow-400"
                        size={18}
                        fill="currentColor"
                      />
                    ))}

                  </div>

                  <p className="
                    text-slate-400
                    leading-relaxed
                    mb-6
                  ">
                    PhishGuard AI transformed our cybersecurity
                    monitoring workflow completely.
                  </p>

                  <h4 className="font-bold">
                    Security Analyst
                  </h4>

                </div>

              ))}

            </div>

          </div>

          {/* Footer */}

          <footer className="
            border-t
            border-slate-800
            pt-10
            text-center
          ">

            <h3 className="
              text-3xl
              font-black
              mb-4
              bg-gradient-to-r
              from-blue-400
              to-purple-500
              bg-clip-text
              text-transparent
            ">
              PhishGuard AI
            </h3>

            <p className="text-slate-500">
              © 2026 PhishGuard AI. All rights reserved.
            </p>

          </footer>

        </div>

      </div>

    </>
  );
}
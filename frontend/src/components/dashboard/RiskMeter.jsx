const RiskMeter = ({ phishing }) => {

  let level = "LOW";
  let color = "bg-green-500";

  if (phishing >= 3) {

    level = "MEDIUM";
    color = "bg-yellow-500";
  }

  if (phishing >= 5) {

    level = "HIGH";
    color = "bg-red-500";
  }

  return (

    <div className="bg-[#07153d] p-8 rounded-3xl">

      <h2 className="text-3xl font-bold mb-8">

        Threat Risk Level

      </h2>

      <div className="w-full bg-gray-800 rounded-full h-10 overflow-hidden">

        <div
          className={`${color} h-full transition-all`}
          style={{
            width: `${Math.min(
              phishing * 15,
              100
            )}%`,
          }}
        />

      </div>

      <p className="mt-6 text-4xl font-bold">

        {level}

      </p>

    </div>
  );
};

export default RiskMeter;
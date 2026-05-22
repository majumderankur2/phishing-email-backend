const RecentActivity = ({ history = [] }) => {

  return (

    <div className="bg-[#07153d] p-8 rounded-3xl">

      <h2 className="text-4xl font-bold mb-8">

        Recent Activity

      </h2>

      {history.length === 0 ? (

        <p className="text-gray-400 text-xl">

          No scans yet

        </p>

      ) : (

        <div className="space-y-5">

          {history.slice(0, 5).map(
            (scan, index) => (

              <div
                key={index}
                className="bg-black p-5 rounded-2xl border border-gray-800"
              >

                <div className="flex justify-between items-center mb-3">

                  <span
                    className={`px-4 py-2 rounded-xl font-bold ${
                      scan.label === "Suspicious"
                        ? "bg-red-600"
                        : "bg-green-600"
                    }`}
                  >
                    {scan.label}
                  </span>

                  <span className="text-gray-400">

                    {scan.score}%

                  </span>

                </div>

                <p className="text-gray-300 line-clamp-2">

                  {scan.emailText}

                </p>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
};

export default RecentActivity;
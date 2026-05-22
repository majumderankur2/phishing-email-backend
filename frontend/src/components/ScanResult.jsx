// ScanResult.jsx
const ScanResult = ({ result }) => {
  return (
    <div className="bg-[#07153d] rounded-3xl p-10">

      {/* HEADER ROW */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-6xl font-bold">Scan Result</h1>
        <div
          className={`px-10 py-4 rounded-3xl text-3xl font-bold ${
            result.label === "Suspicious" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {result.label}
        </div>
      </div>

      {/* VOTES BADGE */}
      {result.votes && (
        <div className="mb-8">
          <span className="bg-blue-800 text-blue-200 px-6 py-2 rounded-full text-xl font-semibold">
            🤖 {result.votes}
          </span>
        </div>
      )}

      {/* SCORE */}
      <h2 className="text-3xl mb-4">Phishing Score</h2>
      <h1 className="text-8xl font-bold mb-8">{result.score}%</h1>
      <div className="w-full bg-gray-700 rounded-full h-10 mb-4">
        <div
          className={`h-10 rounded-full transition-all duration-700 ${
            result.label === "Suspicious" ? "bg-red-500" : "bg-green-500"
          }`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* CONFIDENCE */}
      {result.confidence !== undefined && (
        <p className="text-gray-400 text-xl mb-12">
          Verdict confidence: {Math.round(result.confidence * 100)}%
        </p>
      )}

      {/* ENGINE BREAKDOWN */}
      {result.engine_breakdown &&
        Object.keys(result.engine_breakdown).length > 0 && (
          <div className="bg-black rounded-3xl p-8 mb-8">
            <h2 className="text-4xl font-bold mb-6">AI Engine Votes</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(result.engine_breakdown).map(
                ([engine, data]) => (
                  <div
                    key={engine}
                    className={`p-4 rounded-2xl border text-center ${
                      data.is_phishing
                        ? "border-red-500 bg-red-900/20"
                        : "border-green-500 bg-green-900/20"
                    }`}
                  >
                    <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">
                      {engine}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        data.is_phishing
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {data.is_phishing ? "⚠ Phishing" : "✓ Safe"}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      {Math.round(data.confidence * 100)}% sure
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {/* GROQ AI EXPLANATION */}
      <div className="bg-black rounded-3xl p-8 mb-8">
        <h2 className="text-4xl font-bold mb-6">Groq AI Analysis</h2>
        <p className="text-2xl leading-relaxed whitespace-pre-wrap text-gray-200">
          {result.explanation || "No explanation available."}
        </p>
      </div>

      {/* DETECTED INDICATORS */}
      <div className="bg-black rounded-3xl p-8">
        <h2 className="text-4xl font-bold mb-6">Detected Indicators</h2>
        {result.indicators && result.indicators.length > 0 ? (
          <div className="space-y-4">
            {result.indicators.map((indicator, index) => (
              <div
                key={index}
                className="flex items-center gap-4 text-2xl"
              >
                <span className="text-red-400 text-2xl">⚠</span>
                <span className="text-gray-200">{indicator}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-xl">No indicators detected.</p>
        )}
      </div>

    </div>
  );
};

export default ScanResult;
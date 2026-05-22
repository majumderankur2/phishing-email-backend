import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ThreatPieChart = ({
  phishing,
  safe,
}) => {

  const data = [
    {
      name: "Phishing",
      value: phishing,
    },
    {
      name: "Safe",
      value: safe,
    },
  ];

  const COLORS = [
    "#ef4444",
    "#22c55e",
  ];

  return (

    <div className="bg-[#07153d] p-8 rounded-3xl h-[400px]">

      <h2 className="text-3xl font-bold mb-6 text-white">

        Threat Distribution

      </h2>

      <ResponsiveContainer width="100%" height="100%">

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            outerRadius={120}
            label
          >

            {data.map((entry, index) => (

              <Cell
                key={index}
                fill={COLORS[index]}
              />

            ))}

          </Pie>

          <Tooltip />

        </PieChart>

      </ResponsiveContainer>

    </div>
  );
};

export default ThreatPieChart;
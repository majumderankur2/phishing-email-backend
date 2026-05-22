import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const ThreatChart = ({ history }) => {

  const data = history.map(
    (item, index) => ({

      name: `Scan ${index + 1}`,

      score: item.score,
    })
  );

  return (

    <div className="bg-[#07153d] p-8 rounded-3xl">

      <h2 className="text-4xl font-bold mb-8">

        Threat Analytics

      </h2>

      <ResponsiveContainer
        width="100%"
        height={400}
      >

        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={4}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
};

export default ThreatChart;
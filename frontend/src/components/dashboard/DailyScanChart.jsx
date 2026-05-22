import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const DailyScanChart = ({
  history,
}) => {

  const groupedData = {};

  history.forEach((scan) => {

    const date = new Date(
      scan.createdAt?.seconds
        ? scan.createdAt.seconds * 1000
        : scan.createdAt
    ).toLocaleDateString();

    if (!groupedData[date]) {

      groupedData[date] = 0;
    }

    groupedData[date]++;
  });

  const chartData = Object.keys(groupedData)
    .map((date) => ({
      date,
      scans: groupedData[date],
    }));

  return (

    <div className="bg-[#07153d] p-8 rounded-3xl h-[400px]">

      <h2 className="text-3xl font-bold mb-6 text-white">

        Daily Scan Activity

      </h2>

      <ResponsiveContainer width="100%" height="100%">

        <LineChart data={chartData}>

          <CartesianGrid stroke="#333" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="scans"
            stroke="#3b82f6"
            strokeWidth={4}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
};

export default DailyScanChart;
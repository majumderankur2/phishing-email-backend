export default function StatsCard({
  title,
  value,
  change,
}) {

  return (

    <div className="
      bg-slate-900
      border
      border-slate-800
      rounded-3xl
      p-6
    ">

      <p className="
        text-slate-400
        mb-3
      ">
        {title}
      </p>

      <h2 className="
        text-4xl
        font-black
        mb-2
      ">
        {value}
      </h2>

      <p className="
        text-green-400
        font-semibold
      ">
        {change}
      </p>

    </div>

  );

}
// LEGACY
// ORPHAN

function StatCard({

  title,
  value,
  color

}) {

  return (

    <div

      className="

        bg-white
        rounded-2xl
        p-6
        border
        shadow-sm

      "

    >

      <div

        className={`

          w-4
          h-4
          rounded-full
          ${color}

        `}

      />

      <p

        className="

          text-sm
          text-gray-400
          mt-5

        "

      >

        {title}

      </p>

      <h1

        className="

          text-3xl
          font-semibold
          text-gray-800
          mt-2

        "

      >

        {value}

      </h1>

    </div>

  );

}

export default StatCard;
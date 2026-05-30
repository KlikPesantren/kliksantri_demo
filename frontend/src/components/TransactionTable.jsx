function TransactionTable({

  transactions

}) {

  return (

    <table

      className="

        w-full
        bg-white
        rounded-2xl
        overflow-hidden
        shadow-sm
        border

      "

    >

      <thead className="bg-gray-50">

        <tr>

          <th className="text-left p-4 text-gray-500 text-sm">

            ID

          </th>

          <th className="text-left p-4 text-gray-500 text-sm">

            TRX ID

          </th>

          <th className="text-left p-4 text-gray-500 text-sm">

            Santri

          </th>

          <th className="text-left p-4 text-gray-500 text-sm">

            Jenis

          </th>

          <th className="text-left p-4 text-gray-500 text-sm">

            Nominal

          </th>

          <th className="text-left p-4 text-gray-500 text-sm">

            Admin

          </th>

        </tr>

      </thead>

      <tbody>

        {

          transactions.map((trx) => (

            <tr

              key={trx.id}

              className="border-t"

            >

              <td className="p-4">

                {trx.id}

              </td>

              <td className="p-4 text-xs text-gray-500">

                {trx.trx_id || "-"}

              </td>

              <td className="p-4">

                {trx.nama_santri}

              </td>

              <td className="p-4">

                {

                  trx.jenis === "topup"

                    ?

                    "Topup"

                    :

                    "Pembayaran"

                }

              </td>

              <td className="p-4 font-semibold">

                Rp {

                  Number(

                    trx.nominal

                  ).toLocaleString(

                    "id-ID"

                  )

                }

              </td>

              <td className="p-4">

                {

                  trx.admin_input

                  ||

                  "-"

                }

              </td>

            </tr>

          ))

        }

      </tbody>

    </table>

  );

}

export default TransactionTable;
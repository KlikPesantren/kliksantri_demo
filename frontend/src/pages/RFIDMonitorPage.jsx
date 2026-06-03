import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDMonitorPage() {

    const cardStyle = {

        background: "#fff",

        borderRadius: "20px",

        padding: "24px",

        boxShadow:
            "0 4px 20px rgba(0,0,0,.05)",

        borderTop:
            "5px solid #14B8A6"

    };

    const [devices, setDevices] =
        useState([]);

    const getData =
        async () => {

            try {

                const res =
                    await api.get(
                        "/rfid/monitor"
                    );

                setDevices(
                    res.data.data
                );

            }

            catch (err) {

                console.log(err);

            }

        };

    useEffect(() => {

        getData();

        const interval =
            setInterval(
                getData,
                10000
            );

        return () => clearInterval(
            interval
        );

    }, []);

    const online =
        devices.filter(
            d => d.status === "online"
        ).length;

    const offline =
        devices.filter(
            d => d.status !== "online"
        ).length;

    const totalTransaksi =
        devices.reduce(
            (a, b) =>
                a + Number(
                    b.total_transaksi_hari_ini || 0
                ),
            0
        );

    return (

        <div>

            <Sidebar />

            <div
                style={{
                    marginLeft: "280px",
                    padding: "20px"
                }}
            >

                <div
                    style={{
                        background:
                            "linear-gradient(135deg,#0F766E,#14B8A6)",
                        borderRadius: "20px",
                        padding: "30px",
                        marginBottom: "24px",
                        color: "white"
                    }}
                >

                    <h1
                        style={{
                            margin: 0
                        }}
                    >
                        RFID Monitor
                    </h1>

                    <p
                        style={{
                            marginTop: "10px"
                        }}
                    >
                        Monitoring perangkat RFID pesantren
                    </p>

                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(4,1fr)",
                        gap: "20px",
                        marginBottom: "20px"
                    }}
                >

                    <div style={cardStyle}>
                        <h3>Device Online</h3>
                        <h1>{online}</h1>
                    </div>

                    <div style={cardStyle}>
                        <h3>Device Offline</h3>
                        <h1>{offline}</h1>
                    </div>

                    <div style={cardStyle}>
                        <h3>Total Device</h3>
                        <h1>{devices.length}</h1>
                    </div>

                    <div style={cardStyle}>
                        <h3>Transaksi Hari Ini</h3>
                        <h1>{totalTransaksi}</h1>
                    </div>

                </div>

                <div
                    style={{
                        background: "#fff",
                        borderRadius: "20px",
                        padding: "24px",
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,.05)"
                    }}
                >

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >

                        <thead
                            style={{
                                background: "#F8FAFC"
                            }}
                        >

                            <tr>

                                <th
                                    style={{
                                        padding: "14px",
                                        textAlign: "left"
                                    }}
                                >
                                    Device
                                </th>

                                <th
                                    style={{
                                        padding: "14px",
                                        textAlign: "left"
                                    }}
                                >
                                    Merchant
                                </th>

                                <th
                                    style={{
                                        padding: "14px",
                                        textAlign: "left"
                                    }}
                                >
                                    Status
                                </th>

                                <th
                                    style={{
                                        padding: "14px",
                                        textAlign: "left"
                                    }}
                                >
                                    Last Ping
                                </th>

                                <th
                                    style={{
                                        padding: "14px",
                                        textAlign: "left"
                                    }}
                                >
                                    Last Sync
                                </th>

                                <th
                                    style={{
                                        padding: "14px",
                                        textAlign: "left"
                                    }}
                                >
                                    Transaksi
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                devices.map(
                                    (item) => (
                                        <tr
                                            key={item.id}
                                        >

                                            <td
                                                style={{
                                                    padding: "14px",
                                                    borderTop:
                                                        "1px solid #E2E8F0"
                                                }}
                                            >
                                                {item.device_id}
                                            </td>

                                            <td
                                                style={{
                                                    padding: "14px",
                                                    borderTop:
                                                        "1px solid #E2E8F0"
                                                }}
                                            >
                                                {item.nama_merchant}
                                            </td>

                                            <td>

                                                <span
                                                    style={{

                                                        padding:
                                                            "6px 12px",

                                                        borderRadius:
                                                            "999px",

                                                        color: "white",

                                                        background:

                                                            item.status === "online"

                                                                ? "#16A34A"

                                                                : "#DC2626"

                                                    }}
                                                >

                                                    {item.status}

                                                </span>

                                            </td>

                                            <td
                                                style={{
                                                    padding: "14px",
                                                    borderTop:
                                                        "1px solid #E2E8F0"
                                                }}
                                            >
                                                {
                                                    item.last_ping
                                                        ?
                                                        new Date(
                                                            item.last_ping
                                                        )
                                                            .toLocaleString()
                                                        :
                                                        "-"
                                                }
                                            </td>

                                            <td
                                                style={{
                                                    padding: "14px",
                                                    borderTop:
                                                        "1px solid #E2E8F0"
                                                }}
                                            >
                                                {
                                                    item.last_sync
                                                        ?
                                                        new Date(
                                                            item.last_sync
                                                        )
                                                            .toLocaleString()
                                                        :
                                                        "-"
                                                }
                                            </td>

                                            <td
                                                style={{
                                                    padding: "14px",
                                                    borderTop:
                                                        "1px solid #E2E8F0"
                                                }}
                                            >
                                                {
                                                    item.total_transaksi_hari_ini
                                                }
                                            </td>

                                        </tr>

                                    ))

                            }

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}

export default RFIDMonitorPage;
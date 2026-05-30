import {

  useState

} from "react";

import {

  useEffect

} from "react";

import api from "../services/api";

function LoginPage() {

  const [

    username,
    setUsername

  ] = useState("");

  const [

    password,
    setPassword

  ] = useState("");

  useEffect(() => {

  const token =
    localStorage.getItem(
      "token"
    );

  if (token) {

    window.location.href =
      "/dashboard";

  }

}, []);

  const login =
    async () => {

      try {

        const response =
          await api.post(

            "/auth/login",

            {

              username,

              password

            }

          );

        console.log(response.data);

        localStorage.setItem(

          "token",

          response.data.token

        );

        localStorage.setItem(

  "user",

  JSON.stringify(

    response.data.user

  )

);

    window.location.href =
"/dashboard";

      } catch (err) {

        alert(
          "Login gagal"
        );

      }

    };

  return (

    <div
      style={{
        padding: 40
      }}
    >

      <h1>

        Login Admin

      </h1>

      <input

        type="text"

        placeholder="Username"

        value={username}

        onChange={(e) =>
          setUsername(
            e.target.value
          )
        }

      />

      <br />
      <br />

      <input

        type="password"

        placeholder="Password"

        value={password}

        onChange={(e) =>
          setPassword(
            e.target.value
          )
        }

      />

      <br />
      <br />

      <button
        onClick={login}
      >

        Login

      </button>

    </div>

  );

}

export default LoginPage;
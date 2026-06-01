import axios from "axios";

const api = axios.create({

  baseURL:
  "http://10.10.2.54:3000"

});

export default api;
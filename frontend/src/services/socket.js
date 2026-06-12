// LEGACY MODULE
// Hanya dipakai TransaksiPage (orphan)
// Preserve until deletion decision

import { io }

from "socket.io-client";

const socket = io(

  "http://10.68.244.56:3000"

);

export default socket;
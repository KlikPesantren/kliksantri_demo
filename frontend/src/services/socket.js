// LEGACY MODULE
// Hanya dipakai TransaksiPage (orphan)
// Preserve until deletion decision

import { io }

from "socket.io-client";

const socket = io(

  "http://10.10.2.140:3000"

);

export default socket;

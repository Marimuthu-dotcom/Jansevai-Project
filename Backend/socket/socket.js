let io;

exports.setIo = (serverIo) => {
   io = serverIo;
};

exports.getIo = () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
   }

   return io;
}


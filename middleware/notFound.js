const notFound = (req, res) => {

  res.status(404).json({

    success: false,

    error: "Route Not Found"

  });

};

module.exports = notFound;
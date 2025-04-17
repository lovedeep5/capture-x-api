const healthCheck = async (req, res) => {
  res.status(200).json({ message: "OK" });
};

export default healthCheck;

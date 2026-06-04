const validate = (schema) => (req, res, next) => {
  try {
    const data = {
      body: req.body,
      params: req.params,
      query: req.query
    };
    const parsed = schema.parse(data);
    req.body = parsed.body;
    req.params = parsed.params;
    req.query = parsed.query;
    return next();
  } catch (error) {
    const message = error?.errors?.[0]?.message || 'Invalid request payload';
    return res.status(400).json({
      success: false,
      message
    });
  }
};

module.exports = validate;

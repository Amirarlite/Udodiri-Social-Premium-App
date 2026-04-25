exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Udodiri Social Club API is running!',
      input: event,
    }),
  };
};

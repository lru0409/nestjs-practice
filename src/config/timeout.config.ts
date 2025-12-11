export default () => ({
  requestTimeout: Number(process.env.REQUEST_TIMEOUT) || 5000,
});

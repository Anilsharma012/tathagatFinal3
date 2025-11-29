const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:3001",
      changeOrigin: true,
      secure: false,
      logLevel: "debug",
      onProxyReq: function (proxyReq, req, res) {
        console.log(
          "[Proxy] Forwarding request:",
          req.method,
          req.url,
          "-> http://localhost:3001" + req.url,
        );
      },
      onProxyRes: function (proxyRes, req, res) {
        console.log(
          "[Proxy] Response from backend:",
          proxyRes.statusCode,
          req.url,
        );
      },
      onError: function (err, req, res) {
        console.error("[Proxy] Error:", err.message);
      },
    }),
  );

  app.use(
    "/uploads",
    createProxyMiddleware({
      target: "http://localhost:3001",
      changeOrigin: true,
      secure: false,
    }),
  );
};

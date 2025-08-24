'use strict';
const http = require('node:http');
const auth = require("http-auth");
const router = require("./lib/router.js");

// Basic認証設定
const basic = auth.basic({
  realm: "Enter username and password",
  file: "./users.htpasswd" // ユーザー名とパスワードのファイル
});

const server = http.createServer(basic.check((req, res) => {
  // 認証成功時のユーザー名を req.user にセット
  req.user =  req.user || "anonymous"; // ←ここで req.user を posts-handler に渡す
  router.route(req, res);
}))
.on('error', e => {
  console.error('Server Error', e);
})
.on('clientError', e => {
  console.error('Client Error', e);
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));


'use strict';
const pug = require('pug');
const path = require('node:path');
const util = require('./handler-util.js');
const contents = [];

function handle(req, res) {
  switch (req.method) {
    case "GET":
      try {
        const html = pug.renderFile(path.join(__dirname, "../views/post.pug"),{contents});
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      } catch (err) {
        if (!res.headersSent) {  // すでにヘッダー送信済みなら二重送信を防ぐ
          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("サーバーエラー");
        }
        console.error(err);
      }
      break;

    case "POST":
      let body = "";
      req.on("data", chunk => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const params = new URLSearchParams(body);
          const content = params.get("content");
          console.info(`送信されました: ${content}`);
           contents.push(content);
        console.info(`送信された全内容: ${contents}`);
          handleRedirectPosts(req, res);
        } catch (err) {
          if (!res.headersSent) {
            res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("リクエストエラー");
          }
          console.error(err);
        }
      });
      break;

    default:
      /*if (!res.headersSent) {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Method Not Allowed");
      }*/
      util.handleButRequest(req,res);
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, { Location: "/posts" });
  res.end();
}

module.exports = { handle };

'use strict';
const pug = require('pug');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['query'] });
const path = require('node:path');
const util = require('./handler-util.js');

async function handle(req, res) {
  switch (req.method) {
    case "GET":
      try {
        const posts = await prisma.post.findMany({
          orderBy: { id: 'desc' }  // 新しい順に表示
        });
        posts.forEach((post) => {
          post.content = post.content.replaceAll("\n", "<br>");
        });

       const html = pug.renderFile(
         path.join(__dirname, "../views/post.pug"),
         { posts, user: req.user } // ここで user を渡す
         );

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        console.info(`閲覧されました:user: ${
          req.user},`
        `remoteAddress: ${req.socket.remoteAddress},`
        `userAgent: ${req/headers["user-agent"]}`);
      } catch (err) {
        if (!res.headersSent) {
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
      req.on("end", async () => {
        try {
          const params = new URLSearchParams(body);
          const content = params.get("content");

          console.info(`送信されました: ${content}`);

          await prisma.post.create({
            data: {
              content,
               postedBy: req.user 
               // anonymous（匿名投稿）からの変更user情報を使用
            }
          });

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
      util.handleButRequest(req, res);
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, { Location: "/posts" });
  res.end();
}
function handleDelete(req, res) {
  switch (req.method) {
    case "POST":
      let body = "";
      req.on("data", chunk => {
        body += chunk;
  }).on("end", async () => {
   const params = new URLSearchParams(body);
        const id = parseInt(params.get("id"), );
        const post = await prisma.post.findUnique({
          where: { id }
        })
        if(req.user === post.postedBy || req.user === "admin"){
          await prisma.post.delete({
            where: { id }
          });
          console.info(
            `削除されました: user: ${req.user}, ` +
              `remoteAddress: ${req.socket.remoteAddress}, ` +
              `userAgent: ${req.headers['user-agent']} `
          );
          handleRedirectPosts(req, res);
          
        }
  });
  break;
 default:
    util.handleButRequest(req, res);
        break;
}
}

module.exports = { handle,
  handleDelete,
 };

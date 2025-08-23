'use strict';
const pug = require('pug');
const { PrismaClient } = require('@prisma/client');
const Cookies = require('cookies');
const { currentThemeKey } = require("../config");
const path = require('path');
const util = require('./handler-util.js');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/ja');
dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.tz.setDefault('Asia/Tokyo');

const prisma = new PrismaClient({ log: ['query'] });

// --- posts.pug をレンダリングして返す ---
function handlePosts(req, res, posts, currentTheme) {
  const html = pug.renderFile(
    path.join(__dirname, "../views/posts.pug"),
    { currentTheme, posts, user: req.user }
  );
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);

  console.info(`閲覧されました: user: ${req.user}, remoteAddress: ${req.socket.remoteAddress}, userAgent: ${req.headers['user-agent']}`);
}

// --- GET/POST ハンドル ---
async function handle(req, res) {
  try {
    const cookies = new Cookies(req, res);
    const currentTheme = cookies.get(currentThemeKey) || "light";
    const options = { maxAge:30*86400*1000};
    cookies.set(currentThemeKey,currentTheme,options);

    switch (req.method) {
      case "GET":
        {
          const posts = await prisma.post.findMany({
            orderBy: { id: 'asc' }
          });

          posts.forEach(post => {
            post.content = post.content.replaceAll("\n", "<br>");
            post.relativeCreatedAt = dayjs(post.createdAt).tz().fromNow();
            post.absoluteCreatedAt = dayjs(post.createdAt).tz().format('YYYY年MM月DD日 HH時mm分ss秒');
          });

          handlePosts(req, res, posts, currentTheme);
        }
        break;

      case "POST":
        {
          let body = "";
          req.on("data", chunk => { body += chunk; });
          req.on("end", async () => {
            try {
              const params = new URLSearchParams(body);
              const content = params.get("content");

              console.info(`送信されました: ${content}`);

              await prisma.post.create({
                data: {
                  content,
                  postedBy: req.user
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
        }
        break;

      default:
        util.handleButRequest(req, res);
    }
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("サーバーエラー");
    }
    console.error(err);
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, { Location: "/posts" });
  res.end();
}

// --- 投稿削除 ---
async function handleDelete(req, res) {
  switch (req.method) {
    case "POST":
      {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
          try {
            const params = new URLSearchParams(body);
            const id = parseInt(params.get("id"));
            const post = await prisma.post.findUnique({ where: { id } });

            if (!post) {
              res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
              return res.end("投稿が存在しません");
            }

            if (req.user === post.postedBy || req.user === "admin") {
              await prisma.post.delete({ where: { id } });
              console.info(`削除されました: user: ${req.user}, remoteAddress: ${req.socket.remoteAddress}, userAgent: ${req.headers['user-agent']}`);
              handleRedirectPosts(req, res);
            } else {
              res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
              res.end("権限がありません");
            }
          } catch (err) {
            if (!res.headersSent) {
              res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
              res.end("サーバーエラー");
            }
            console.error(err);
          }
        });
      }
      break;

    default:
      util.handleButRequest(req, res);
      break;
  }
}

// --- ライト/ダーク切替 ---
async function handleChangeTheme(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = cookies.get(currentThemeKey) || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark"; // 反転
  cookies.set(currentThemeKey, newTheme, { httpOnly: false });

  res.writeHead(303, { Location: "/posts" });
  res.end();
}

module.exports = {
  handle,
  handleDelete,
  handlePosts,
  handleChangeTheme
};

"use strict"
const pug = require("pug");
const test = require("node:test");
const assert =require("node:assert");

test(チャットメッセージに含まれるHTMLタグがエスケープされる,() => {
  const html =pug.renderFile(
    "./views/posts.pug",
    {
      posts:[
        {
          id:1,
          content: `<script>alert("XSS!");<script>`,
          postedBy: "test_user",
          createdAt: new Date(),
          updateAt: new Date(),
        },
      ],
      user:"test_user",
    },
  )
});

// メッセージの <script> タグがエスケープされていることをチェック
  assert(html.includes('&lt;script&gt;alert(&quot;XSS!&quot;);&lt;/script&gt;'));

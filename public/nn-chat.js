"use strict";
// 一番下を表示
window.addEventListener('load', () => {
  window.scrollTo(0, document.body.scrollHeight);
});

// EnterキーとCtrl(Command)+Enterで送信
const formElement = document.forms["message-form"];
const textareaElement = formElement.elements["content"];
textareaElement.addEventListener("keydown" ,(event) => {
  // 送信キーを押したら
  if (isPressedSubmitKey(event)){
    // キーボード入力をキャンセルして送信
    event.preventDefault();
    formElement.submit();
    console.log("送信キーが押されました");
  }
});
// 送信キーを押しているか判定
function isPressedSubmitKey(event){
  if (event.key !== "Enter") {
    return false;
  }
if (event.ctrlKey) {
    return true;
  }
if (event.metaKey) {
    return true;
  }
  return false;
  // 送信キーを押していない
}


// ツールチップの有効化
const tooltipTriggerElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
tooltipTriggerElements.forEach((tooltipTriggerElement) => {
  new bootstrap.Tooltip(tooltipTriggerElement);
});

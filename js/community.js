
/* 评论与个人资料：仅同浏览器持久化，不依赖服务器。 */
window.LFCommunity = (function(){
 'use strict';
 const PKEY='fzu-lf-v2-profile', CKEY='fzu-lf-v2-comments';
 const defaultProfile={nickname:'福大小友',college:'计算机与大数据学院',bio:'有失物，也有拾回的小确幸。'};
 const copy= x=>JSON.parse(JSON.stringify(x));
 const memory={};
 function read(key,fallback){if(Object.prototype.hasOwnProperty.call(memory,key))return copy(memory[key]);try{const x=JSON.parse(localStorage.getItem(key));return x&&typeof x==='object' ? x:copy(fallback)}catch(e){return copy(fallback)}}
 function write(key,value){memory[key]=copy(value);try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}
 function getProfile(){return {...defaultProfile,...read(PKEY,{})}}
 function validateProfile(input){const p={nickname:String(input.nickname||'').trim(),college:String(input.college||'').trim(),bio:String(input.bio||'').trim()};
  if(!p.nickname||p.nickname.length>18)return {ok:false,message:'昵称请输入1—18个字符'};
  if(!p.college||p.college.length>35)return {ok:false,message:'学院请输入1—35个字符'};
  if(p.bio.length>70)return {ok:false,message:'个人签名不得超过70字'};
  return {ok:true,profile:p}; }
 function saveProfile(input){const c=validateProfile(input); if(!c.ok)return c;return {...c,persisted:write(PKEY,c.profile)} }
 function listComments(item){const seeded=Array.isArray(item.comments)?item.comments:[];const stored=read(CKEY,{});const own=Array.isArray(stored[item.id])?stored[item.id]:[];return [...seeded,...own]}
 function validateComment(input){const content=String(input||'').trim();if(!content)return {ok:false,message:'请先输入留言内容'};if(content.length>220)return {ok:false,message:'留言最多220字'};return {ok:true,content};}
 function addComment(itemId,author,content){const result=validateComment(content);if(!result.ok)return result;
  const saved=read(CKEY,{}); if(!Array.isArray(saved[itemId]))saved[itemId]=[];
  if(saved[itemId].length>=30)return {ok:false,message:'该条信息在当前浏览器的留言数量已达上限'};
  const comment={id:'c-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),author:String(author||'福大小友').slice(0,18),content:result.content,time:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})};
  saved[itemId].push(comment);return {ok:true,comment,persisted:write(CKEY,saved)} }
 return {getProfile,validateProfile,saveProfile,listComments,validateComment,addComment};
})();

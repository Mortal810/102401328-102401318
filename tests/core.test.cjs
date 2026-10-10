const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../js/core.js');
const valid = {
  type: 'lost',name: '黑色折叠伞',category:'雨伞',location:'西三教学楼',
  date:'2026-10-08',time:'16:30',description:'伞柄有白色挂绳',contact:'QQ：12345678'
};
const now = new Date('2026-10-09T20:00:00');
function make(overrides={}) { return {...valid,...overrides}; }
function created(overrides={},id='t1',owner='client-a') {return core.createItem(make(overrides),owner,now,id);}
function makeComm(){
  const state={};
  const storage={getItem(k){return Object.prototype.hasOwnProperty.call(state,k)?state[k]:null},setItem(k,v){state[k]=v}};
  const ctx={window:{},localStorage:storage,Date,JSON,Math,Array,String,Object};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/community.js'),'utf8'),ctx);
  return {api:ctx.window.LFCommunity,state};
}
test('T01 发布：正常寻物可创建',()=>{const a=created();assert.equal(a.ok,true);assert.equal(a.item.type,'lost');assert.equal(a.item.status,'active')});
test('T02 发布：正常招领可创建',()=>{const a=created({type:'found'});assert.equal(a.ok,true);assert.equal(core.statusLabel(a.item),'待认领')});
test('T03 校验：空名称被拒绝',()=>{const a=created({name:'  '});assert.equal(a.ok,false);assert.ok(a.errors.name)});
test('T04 校验：空联系方式被拒绝',()=>{assert.ok(!created({contact:''}).ok)});
test('T05 校验：未知类别被拒绝',()=>{assert.equal(created({category:'钱包'}).errors.category,'请选择物品分类')});
test('T06 校验：未来日期被拒绝',()=>{assert.ok(created({date:'2099-10-09'}).errors.date)});
test('T07 校验：非法日期被拒绝',()=>{assert.ok(created({date:'2026-02-30'}).errors.date)});
test('T08 校验：过长说明被拒绝',()=>{assert.ok(created({description:'甲'.repeat(501)}).errors.description)});
test('T09 数据：创建者与发布者昵称独立保存',()=>{const a=created({publisher:'张同学',publisherDept:'软件工程'});assert.equal(a.item.ownerId,'client-a');assert.equal(a.item.publisher,'张同学')});
test('T10 搜索：物品名称包含词可匹配',()=>{const x=created().item;assert.equal(core.searchItems([x],'折叠伞').length,1)});
test('T11 搜索：地点关键字可匹配',()=>{const x=created().item;assert.equal(core.searchItems([x],'西三').length,1)});
test('T12 搜索：无结果返回空数组',()=>{assert.equal(core.searchItems([created().item],'不可能出现的关键词').length,0)});
test('T13 搜索：可查询发布者昵称',()=>{assert.equal(core.searchItems([created({publisher:'林雨婷'}).item],'雨婷').length,1)});
test('T14 筛选：类别和状态双条件',()=>{const a=created().item;const b={...a,id:'two',status:'finished'};assert.equal(core.filterItems([a,b],{category:'雨伞',activeOnly:true}).length,1)});
test('T15 状态：寻物可标记已找到',()=>{const a=created().item;const r=core.finishItem([a],'t1','client-a');assert.ok(r.ok);assert.equal(core.statusLabel(r.items[0]),'已找到')});
test('T16 状态：招领可标记已归还',()=>{const a=created({type:'found'}).item;const r=core.finishItem([a],'t1','client-a');assert.equal(core.statusLabel(r.items[0]),'已归还')});
test('T17 权限：不允许修改其他发布者的信息',()=>{const a=created().item;const r=core.finishItem([a],'t1','client-b');assert.equal(r.reason,'forbidden')});
test('T18 权限：不允许再次完成已结束的信息',()=>{const a={...created().item,status:'finished'};assert.equal(core.finishItem([a],'t1','client-a').reason,'already_finished')});
test('T19 安全：动态内容正确 HTML 转义',()=>{assert.equal(core.escapeHTML('<script>alert(1)</script>'),'&lt;script&gt;alert(1)&lt;/script&gt;')});
test('T20 资料：可以修改昵称、学院、签名且可重新读取',()=>{const {api}=makeComm();assert.ok(api.saveProfile({nickname:'张同学',college:'计算机与大数据学院',bio:'拾回美好'}).ok);assert.equal(api.getProfile().nickname,'张同学')});
test('T21 资料：空昵称不通过',()=>{const {api}=makeComm();assert.equal(api.validateProfile({nickname:'  ',college:'计算机学院'}).ok,false)});
test('T22 评论：初始评论和新留言可以合并',()=>{const {api}=makeComm();const item={id:'abc',comments:[{author:'A',content:'已有线索'}]};assert.equal(api.listComments(item).length,1);assert.ok(api.addComment('abc','张同学','我也留意过').ok);assert.equal(api.listComments(item).length,2)});
test('T23 评论：空白留言与超长留言均拒绝',()=>{const {api}=makeComm();assert.equal(api.validateComment('   ').ok,false);assert.equal(api.validateComment('字'.repeat(221)).ok,false)});
test('T24 数据集：26条类别多样、地点真实字符串、无网络图片依赖',()=>{const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/sample-data.js'),'utf8'),ctx);const l=ctx.window.LFDemoData;assert.equal(l.length,26);assert.ok(l.some(x=>x.location.includes('晋江楼学习中心')));assert.ok(l.some(x=>x.location.includes('丁香园食堂')));assert.ok(new Set(l.map(x=>x.category)).size>=8);assert.ok(l.every(x=>!/^http/.test(x.photo||'')))});

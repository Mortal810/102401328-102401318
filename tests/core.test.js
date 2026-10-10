/** Node 20+ 内置 node:test。无需 npm install，npm test 即可运行。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../js/core.js');
const NOW = new Date('2026-10-09T10:00:00');
const draft = { type:'lost', name:'黑色折叠伞', category:'雨伞', location:'东三教学楼', date:'2026-10-08', time:'15:00', description:'黑色雨伞', contact:'QQ: 123456' };
const valid = changes => ({ ...draft, ...changes });
const make = (change, owner='owner-1') => core.createItem(valid(change), owner, NOW, 'test-001');

test('T01 白盒：名称为空进入 name 验证分支', () => { const r=core.validateDraft(valid({name:''}),NOW); assert.equal(r.valid,false); assert.ok(r.errors.name); });
test('T02 白盒：联系方式为空进入 contact 验证分支', () => { const r=core.validateDraft(valid({contact:'  '}),NOW); assert.ok(r.errors.contact); });
test('T03 白盒：无效类型进入 type 验证分支', () => { const r=core.validateDraft(valid({type:'xxx'}),NOW); assert.ok(r.errors.type); });
test('T04 边界：发生时间在未来被拒绝', () => { const r=core.validateDraft(valid({date:'2026-10-10'}),NOW); assert.ok(r.errors.date); });
test('T05 边界：非法日历日期被拒绝', () => { const r=core.validateDraft(valid({date:'2026-02-30'}),NOW); assert.ok(r.errors.date); });
test('T06 正常：寻物发布后处于 active', () => { const r=make({}); assert.equal(r.ok,true); assert.equal(r.item.type,'lost'); assert.equal(r.item.status,'active'); });
test('T07 正常：招领发布后处于 active', () => { const r=make({type:'found'}); assert.equal(r.ok,true); assert.equal(r.item.type,'found'); });
test('T08 关键词命中物品名称', () => { const items=[make({}).item, make({name:'白色耳机'}).item]; assert.equal(core.searchItems(items,'耳机').length,1); });
test('T09 关键词命中地点', () => { assert.equal(core.searchItems([make({}).item],'东三').length,1); });
test('T10 无结果返回空数组', () => { assert.deepEqual(core.searchItems([make({}).item],'不存在的物品'),[]); });
test('T11 寻物发布者能够完成', () => { const r=core.finishItem([make({}).item],'test-001','owner-1'); assert.equal(r.ok,true); assert.equal(core.statusLabel(r.items[0]),'已找到'); });
test('T12 招领发布者能够完成', () => { const r=core.finishItem([make({type:'found'}).item],'test-001','owner-1'); assert.equal(r.ok,true); assert.equal(core.statusLabel(r.items[0]),'已归还'); });
test('T13 白盒：非发布者禁止更新', () => { const r=core.finishItem([make({}).item],'test-001','not-owner'); assert.equal(r.ok,false); assert.equal(r.reason,'forbidden'); });
test('T14 白盒：重复完成拒绝更新', () => { const item={...make({}).item,status:'finished'}; const r=core.finishItem([item],'test-001','owner-1'); assert.equal(r.reason,'already_finished'); });
test('T15 不存在 ID 返回未找到', () => { const r=core.finishItem([make({}).item],'does-not-exist','owner-1'); assert.equal(r.reason,'not_found'); });
test('T16 白盒：演示记录不允许修改', () => { const r=core.finishItem([{...make({}).item,isDemo:true}],'test-001','owner-1'); assert.equal(r.reason,'forbidden'); });
test('T17 筛选寻物和进行中，不包含已完成的招领', () => { const a=make({}).item; const b={...make({type:'found'}).item,id:'b',status:'finished'}; assert.deepEqual(core.filterItems([a,b],{type:'lost',activeOnly:true}),[a]); });
test('T18 过滤 HTML 特殊字符，避免注入页面', () => { assert.equal(core.escapeHTML('<img src=x onerror="x">'),'&lt;img src=x onerror=&quot;x&quot;&gt;'); });
test('T19 仅获取当前身份发布的信息', () => { const a=make({}).item; const b={...a,id:'other',ownerId:'owner-2'}; assert.equal(core.getMyItems([a,b], 'owner-1').length,1); });
test('T20 过长描述会触发字数上限', () => { const r=core.validateDraft(valid({description:'a'.repeat(501)}),NOW); assert.ok(r.errors.description); });

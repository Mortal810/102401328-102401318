/* 首次打开可见的课程演示数据：不对应真实人员或真实失物，请勿用于现实联系。 */
window.LFDemoData = [
  { id: 'demo-umbrella', type: 'lost', name: '黑色折叠伞', category: '雨伞', location: '东三教学楼', date: '2026-09-25', time: '16:30', description: '一把黑色三折雨伞，伞柄有白色挂绳。', contact: '演示联系方式（请勿联系）', status: 'active', createdAt: 1790250000000 },
  { id: 'demo-earbuds', type: 'found', name: '蓝牙耳机', category: '电子产品', location: '图书馆二楼', date: '2026-09-26', time: '14:20', description: '图书馆二楼自习座位附近拾到蓝牙耳机，具体外观请联系发布者核对。', contact: '演示联系方式（请勿联系）', status: 'active', createdAt: 1790330000000 },
  { id: 'demo-card', type: 'found', name: '校园卡', category: '校园卡', location: '第一食堂', date: '2026-09-27', time: '11:30', description: '食堂收银台附近发现校园卡，为保护隐私不在页面上公开卡号或身份信息。', contact: '演示联系方式（请勿联系）', status: 'active', createdAt: 1790200000000 },
  { id: 'demo-white-earbuds', type: 'lost', name: '白色无线耳机', category: '电子产品', location: '西三教学楼', date: '2026-09-24', time: '09:30', description: '白色无线耳机，可能遗落在西三教学楼走廊。', contact: '演示联系方式（请勿联系）', status: 'active', createdAt: 1790100000000 },
  { id: 'demo-black-case', type: 'lost', name: '黑色耳机盒', category: '电子产品', location: '操场看台', date: '2026-09-23', time: '18:00', description: '黑色耳机充电盒，外侧有轻微划痕。', contact: '演示联系方式（请勿联系）', status: 'active', createdAt: 1790000000000 },
  { id: 'demo-airpods', type: 'lost', name: 'AirPods保护套', category: '电子产品', location: '第一食堂', date: '2026-09-20', time: '12:15', description: '透明 AirPods 保护套，套有蓝色钥匙扣。', contact: '演示联系方式（请勿联系）', status: 'finished', createdAt: 1789600000000 },
  { id: 'demo-bottle', type: 'found', name: '蓝色保温水杯', category: '水杯', location: '旗山校区体育馆', date: '2026-09-28', time: '17:05', description: '蓝色不锈钢保温杯，放在体育馆服务台附近。', contact: '演示联系方式（请勿联系）', status: 'active', createdAt: 1789500000000 },
  { id: 'demo-book', type: 'found', name: '数据结构教材', category: '书籍', location: '图书馆一楼', date: '2026-09-22', time: '10:00', description: '一本《数据结构》教材，内夹有便利贴。', contact: '演示联系方式（请勿联系）', status: 'finished', createdAt: 1789000000000 }
].map(item => ({ ...item, ownerId: 'demo', isDemo: true, photo: '' }));

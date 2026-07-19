<script lang="ts" setup>
import avatar from '../../assets/resume/avatar.jpg'
import jieShang from '../../assets/resume/jieShang.png'
import jieShang2 from '../../assets/resume/jieShang2.png'
import talePlant from '../../assets/resume/talePlant.png'

const contact = {
  phone: '188840758973',
  phoneNote: '微信同号',
  email: '2217356256@qq.com',
  github: 'https://github.com/liangfriend',
}

/** 与 介绍.md 一致，不精简 */
const summary =
    '我是个擅长音乐编程的前端工程师，也擅长 node 做后端的 electron pc 应用的开发。'

const highlight =
    '对音乐编程充满热情。理解神经网路，能通过人工智能建模实现更复杂的需求。擅长抽离功能为插件，丰富任职公司的核心技术。'

const motivation =
    '我期望一个能最大化发挥我个人技术的价值的公司。国内的音乐教育软件目前不是很成熟，例如ipad上有一个打谱软件，可以通过触屏笔来手绘音符实现打谱。但是安卓端，或者说中国，目前没有这样方便的打谱软件。我希望自己在赚钱的同时，也确确实实实现自己的社会价值。'
const noticeHandover =
    '无'

const skills = [
  {group: '前端', items: 'Vue、Three'},
  {group: '后端', items: 'Express、Electron'},
  {group: '其它', items: '乐理知识、Cnn模型、Transformer模型'},
]

const experiences = [
  {
    period: '2024.8 — 至今',
    company: '金三惠',
    paragraphs: [
      '负责公司所有产品的维护。',
      '公司核心技术的开发维护者，公司内部技术文档创立者、维护者。',
      '核心插件维护者，负责给其它项目开发的同事提供相应的技术支持。',
      '自研网页无延迟播放器处理pad端cpu性能不足问题',
      '自研midi智能生成算法实现软件的智能绘曲功能',
      '维护并扩展内部打谱技术，优化其性能，丰富其功能'
    ],
    note: '2026.7.24离职',
  },
  {
    period: '2023.8 — 2024.4',
    company: '广州宏凯',
    paragraphs: [
      '公司内部医疗平台网站及后台管理网站的维护。',
      '负责公司的 electron 桌面应用板块。主要是开发各种医疗设备的 pc 端对接应用，从 0-1 开发了三款小型桌面应用（篮牙心率戒指，肺检测智能吹嘴，和一个内部设备管理应用）。',
    ],
  },
  {
    period: '2023.2 — 2023.6',
    company: '上海担路科技',
    paragraphs: [
      '通过公司内部低代码平台进行全平台应用全栈开发，完成了小程序「智龙速揽」（仍在运行）。',
    ],
  },
]

const plugins = [
  {
    name: 'music-symbol-detect(音符智能识别接口)',
    paragraphs: ['识别手绘符号为对应音乐符号',
      'cnn模型 + 4500张手绘音符数据',
      'pytorch + fastApi'

    ]
  },
  {
    name: 'deciphony-player(网页音符播放器插件)',
    paragraphs: [
      '基于 web-audio 开发 js 音频播放器，对标 toneJs。在功能广度上，没有 toneJs 对 webAudio 的节点实现的那么全面，',
      '但是性能更高。在 6x cpu 减速情况下，仍流畅运行；20x cpu 减速下出现卡顿，但是仍准时运行。',
      '可以方便的实现曲谱的播放，节拍器，变调等乐理上的播放能力。',
    ],
  },
  {
    name: 'deciphony-renderer(网页曲谱组件)',
    paragraphs: [
      '自研网页曲谱展示技术，目前实现了五线谱、简谱、Tab6（吉他谱）、Tab4（尤克里里 & 贝斯谱）。',
      '通过算法优化，拥有极快的渲染速度。',
      '丰富的功能：简线双谱播放、简线双谱编辑、简线双谱和 musicxml 互相转换、播放高亮评分...',
      '可扩展性：理论上此组件可以实现出市面上曲谱插件的任何功能。'
    ],
  },
  {
    name: 'deciphony-tune-judge(演唱测评插件)',
    paragraphs: [
      '基于 web-audio 的演唱测评插件，接收麦克风流信息和一段谱子的midi数据，通过内置的音高检测功能实时返回演唱评分。',
      '类似全民K歌的功能',
    ],
  },
  {
    name: 'deciphony-engine(视觉小说游戏引擎)',
    paragraphs: [
      '节点拖拽式的可视化编辑器。通过鼠标拖拽实现一个视觉小说游戏',
      '内置存档，场景跳转等游戏创作流程的基本能力。让普通人也能做游戏',
    ],
  },
  {
    name: 'melody(旋律智能生成接口)',
    paragraphs: [
      '基于概率模型，通过样本数据筛选，生成 midi 的可播放序列。',
      '超多参数可选： midi 限制、时值限制、上文信息、音符长度...',
      'node + express',
    ],
  },
]

const projects = [
  {
    name: '解熵',
    tag: '游戏 & 工具',
    fullRow: true,
    paragraphs: [
      '具有游戏 & 工具双性质的软件。',
      '基于自研的 deciphony-player & deciphony-renderer 实现的一个打谱软件。',
      '支持简谱线谱的一键切换。支持曲谱皮肤自定义、单行模式转换等等。',
      '支持 musicxml 格式的输入输出。谱子可以直接进入练习模式，连接 midi 设备进行跟弹，并实时展示评分。',
      '内置识谱小游戏，通过不断练习能提升玩家的钢琴素养.',
    ],
    shots: [jieShang, jieShang2],
  },
  {
    name: '故事星球',
    tag: '游戏平台',
    fullRow: true,
    paragraphs: [
      '基于自研的 deciphony-engine 开发的游戏管理平台，用户可以开发自己的游戏并发布。',
      '分为软件和后台管理两部分，用户可以发布自己的游戏到云端。',
    ],
    shots: [talePlant],
  },
]


</script>

<template>
  <div class="page">
    <article class="resume">
      <header class="top">
        <img :src="avatar" alt="梁友谊" class="avatar"/>
        <div class="identity">
          <h1>梁友谊</h1>
          <p class="summary">{{ summary }}</p>
          <p class="meta-line">
            出生日期 2001.5.11 · 辽宁营口 · 辽宁工业大学 2019.9—2023.6 统招本科
          </p>
        </div>
        <ul class="contact">
          <li><b>手机</b>{{ contact.phone }}（{{ contact.phoneNote }}）</li>
          <li><b>邮箱</b>{{ contact.email }}</li>
          <li>
            <b>GitHub</b>
            <a :href="contact.github" target="_blank" rel="noopener">github.com/liangfriend</a>
          </li>
          <li><b>其它</b>C1 驾照 · 雅思 6.0</li>
          <li><b>期望薪资</b>15-20K</li>
        </ul>
      </header>

      <section class="row-two">
        <div class="panel">
          <h2>个人技能</h2>
          <div v-for="s in skills" :key="s.group" class="skill-row">
            <strong>{{ s.group }}：</strong>{{ s.items }}
          </div>
        </div>
        <div class="panel panel-grow">
          <h2>工作经历</h2>
          <div v-for="e in experiences" :key="e.company" class="exp">
            <div class="exp-head">
              <span class="exp-co">{{ e.company }}</span>
              <time>{{ e.period }}</time>
            </div>
            <p v-for="(para, i) in e.paragraphs" :key="i">{{ para }}</p>
            <p v-if="e.note" class="exp-note"><strong>注：</strong>{{ e.note }}</p>
          </div>
        </div>
      </section>

      <section class="panel panel-full">
        <h2>插件</h2>
        <div class="plugin-grid">
          <div v-for="p in plugins" :key="p.name" class="plugin-card">
            <h3>{{ p.name }}</h3>
            <p v-for="(para, i) in p.paragraphs" :key="i">{{ para }}</p>
          </div>
        </div>
      </section>

      <section class="panel panel-full projects">
        <h2>项目</h2>
        <div class="proj-grid">
          <div
              v-for="proj in projects"
              :key="proj.name"
              class="proj-card"
              :class="{ 'proj-card-full': proj.fullRow }"
          >
            <div class="proj-title">
              <h3>{{ proj.name }}</h3>
              <span class="tag">{{ proj.tag }}</span>
            </div>
            <p v-for="(para, i) in proj.paragraphs" :key="i">{{ para }}</p>
            <div
                class="shots"
                :class="{
                'shots-one': proj.shots.length === 1,
                'shots-tall': proj.name === '故事星球',
              }"
            >
              <img
                  v-for="(src, i) in proj.shots"
                  :key="i"
                  :src="src"
                  :alt="`${proj.name} 截图 ${i + 1}`"
              />
            </div>
          </div>
        </div>
        <div class="other-proj">
          <h3>其它项目</h3>
          <p>{{ otherProjects }}</p>
        </div>
      </section>

      <section class="statement">
        <div class="stmt-block">
          <h2>个人亮点</h2>
          <p>{{ highlight }}</p>
        </div>
        <div class="stmt-block">
          <h2>求职动机</h2>
          <p>{{ motivation }}</p>
        </div>
      </section>

      <footer class="notice">
        <p><strong>请注意：</strong>{{ noticeHandover }}</p>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #e4e9ef;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  box-sizing: border-box;
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #1a2332;
  -webkit-font-smoothing: antialiased;
}

.resume {
  width: 1680px;
  max-width: 100%;
  background: #fff;
  border: 1px solid #c5ced8;
  box-sizing: border-box;
}

.top {
  display: grid;
  grid-template-columns: 110px 1fr auto;
  gap: 20px 28px;
  align-items: center;
  padding: 24px 32px;
  background: #f5f8fc;
  border-bottom: 3px solid #1a365d;
}

.avatar {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border: 1px solid #b8c4d4;
  border-radius: 4px;
}

.identity h1 {
  margin: 0 0 10px;
  font-size: 36px;
  font-weight: 700;
  color: #0d1b2a;
  letter-spacing: 0.06em;
}

.summary {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e3a5f;
  line-height: 1.55;
}

.meta-line {
  margin: 0;
  font-size: 14px;
  color: #4a627a;
}

.contact {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 14px;
  text-align: right;
  line-height: 1.7;
  min-width: 300px;
}

.contact b {
  color: #5a7088;
  font-weight: 600;
  margin-right: 6px;
}

.contact a {
  color: #1a4a7a;
  text-decoration: none;
}

h2 {
  margin: 0 0 14px;
  font-size: 17px;
  font-weight: 700;
  color: #1a365d;
  letter-spacing: 0.06em;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.row-two {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 0;
  border-bottom: 1px solid #e2e8f0;
}

.panel {
  padding: 22px 28px;
  border-right: 1px solid #e2e8f0;
}

.panel:last-child {
  border-right: none;
}

.panel-full {
  border-right: none;
  border-bottom: 1px solid #e2e8f0;
}

.skill-row {
  margin-bottom: 10px;
  font-size: 14px;
  color: #334155;
}

.skill-row strong {
  color: #0d1b2a;
}

.exp + .exp {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed #e2e8f0;
}

.exp-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.exp-co {
  font-size: 17px;
  font-weight: 700;
  color: #0d1b2a;
}

.exp-head time {
  font-size: 14px;
  color: #6b7f96;
  white-space: nowrap;
}

.exp p,
.plugin-card p,
.proj-card p,
.other-proj p {
  margin: 0 0 8px;
  font-size: 14px;
  color: #334155;
  line-height: 1.65;
  text-align: justify;
}

.exp p:last-child {
  margin-bottom: 0;
}

.exp-note {
  margin-top: 10px !important;
  padding: 10px 12px;
  background: #f0f4f8;
  border-left: 3px solid #1a365d;
  font-size: 13px;
  color: #334155;
}

.exp-note strong {
  color: #1a365d;
}

.plugin-card p:last-child,
.proj-card p:last-child {
  margin-bottom: 0;
}

.plugin-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 28px;
}

.plugin-card {
  padding: 14px 16px;
  background: #fafbfc;
  border: 1px solid #e8edf3;
  border-radius: 4px;
}

.plugin-card h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #1e3a5f;
}

.proj-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: start;
}

.proj-card {
  padding: 16px 18px;
  background: #fafbfc;
  border: 1px solid #dde4ec;
  border-radius: 4px;
}

.proj-card-full {
  grid-column: 1 / -1;
}

.proj-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.proj-title h3 {
  margin: 0;
  font-size: 18px;
  color: #0d1b2a;
}

.tag {
  font-size: 12px;
  padding: 3px 10px;
  border: 1px solid #c5d0de;
  color: #5a6d82;
  border-radius: 3px;
}

.shots {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.shots img {
  flex: 1;
  min-width: 0;
  height: 380px;
  object-fit: contain;
  object-position: center center;
  background: #eef2f6;
  border: 1px solid #cfd8e3;
  border-radius: 4px;
}

/* 单图项目：加高，便于看清图内文字（如故事星球） */
.shots-one img {
  width: 100%;
  height: 480px;
}

.shots-tall img {
  height: 560px;
  min-height: 560px;
  max-width: 100%;
}

.other-proj {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px dashed #e2e8f0;
}

.other-proj h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #1a365d;
}

.statement {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #e2e8f0;
}

.stmt-block {
  padding: 22px 28px;
}

.stmt-block + .stmt-block {
  border-left: 1px solid #e2e8f0;
}

.stmt-block p {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  color: #334155;
  text-align: justify;
}

.notice {
  padding: 20px 28px 24px;
  font-size: 14px;
  line-height: 1.65;
  color: #334155;
  background: #f8fafc;
}

.notice p {
  margin: 0;
}

.notice strong {
  color: #1a365d;
}

@media (max-width: 900px) {
  .page {
    padding: 12px;
  }

  .resume {
    width: 100%;
  }

  .top {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 20px 18px;
  }

  .avatar {
    width: 88px;
    height: 88px;
  }

  .identity h1 {
    font-size: 28px;
  }

  .contact {
    min-width: 0;
    text-align: left;
  }

  .row-two {
    grid-template-columns: 1fr;
  }

  .panel {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 18px;
  }

  .panel:last-child {
    border-bottom: none;
  }

  .plugin-grid {
    grid-template-columns: 1fr;
  }

  .statement {
    grid-template-columns: 1fr;
  }

  .stmt-block {
    padding: 18px;
  }

  .stmt-block + .stmt-block {
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }

  .notice {
    padding: 18px;
  }

  .exp-head {
    flex-wrap: wrap;
  }

  .exp-head time {
    white-space: normal;
  }

  .shots {
    flex-direction: column;
  }

  .shots img {
    width: 100%;
    height: auto;
    max-height: 420px;
  }

  .shots-one img,
  .shots-tall img {
    height: auto;
    min-height: 0;
    max-height: 480px;
  }
}
</style>

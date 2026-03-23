# 多 Agent 效率评测基础设施

**创建日期：** 2026-03-22
**最后更新：** 2026-03-22
**状态：** 概念阶段，待开发

---

## 一句话定位

> 让多 Agent 协作从烧钱黑盒，变成可量化、可优化、有参照的工程系统。

**进化版定位：** AI 时代人的能力指标 —— 衡量人使用 AI 的效率

---

## 核心概念（已精炼）

### Translation Gap（翻译鸿沟）

> 每次 LLM 调用的投入 token 中，最终被采纳的有效产出 token 占比。

- 衡量多 Agent 系统中有多少 AI 投入被浪费
- 类比：团队每月 $2000 AI 花费，其中 $1500 可能浪费在无意义的重试上
- TG = 有效产出 tokens / 总投入 tokens

**关键洞察：**
- TG 衡量的是 **人的能力 × 模型的能力 × 人机协作的质量**
- 同一个模型，不同人用，Gap 差很远
- 模型会越来越好，但人的差距永远存在

### Prompt 有效性分析

> 区分 Prompt 来源（human_first / human_edit / framework_auto），分析哪类 Prompt 设计导致低效率

- human_first：人首次写的指令
- human_edit：人中途修改的指令
- framework_auto：框架自动生成的 system prompt

### 效率改进追踪

> 用户可选开启：发送匿名的效率数据，帮助改进产品

**我们能看到：**
- Gap 分数 + 变化（34% → 58%）
- Prompt 类型标签
- 任务类型
- 模型 + Provider

**我们看不到：**
- Prompt 的实际内容
- LLM 的实际输出

### Budget Guardrails

> 多 Agent 系统的硬性预算熔断，防止 token 失控

---

## 产品愿景

**终极愿景：** 成为 AI 时代衡量人机协作能力的标准

```
TG Score = 你的 AI 效率指标

就像 KPI / OKR 一样：
- 招聘：面试时测 TG Score
- 绩效：季度评估看 TG 变化
- 培训：TG 提升了多少
```

---

## 用户如何用它

**第一步：接入（2行代码）**

```python
from agent_efficiency import observe
crew = observe(crew, api_key="xxx")
```

**第二步：正常运行**

```python
crew.kickoff()
# observe 在背后默默记录
```

**第三步：去 Dashboard 看**

```
Translation Gap: 34%
Prompt 类型分布：framework_auto 61%（最低效）
最大问题：你的 system prompt 生成了 3400 tokens，2100 被重试消耗了
```

---

## 设计原则（已精炼）

### 第一原则：不存内容，只存数字

```
我们存的是：
  "这个任务消耗了 5000 tokens，花了 $0.02"

我们不存的是：
  "这个任务的 Prompt 内容是什么"
```

### 第二原则：SDK 本地缓冲，server 挂了不影响用户

```python
def track(self, call):
    self.queue.append(call)  # 先存本地
    
    try:
        send_to_server(self.queue)  # 尝试发送
        self.queue.clear()
    except:
        pass  # 发送失败就留着，下次再试
    
    return call.result  # 不管 server 状态，都不影响 LLM 调用
```

### 第三原则：我们的稳定性不靠技术，靠架构

- 如果 server 挂了 24 小时：用户照常使用 LLM，数据攒着，恢复后一次性同步
- SDK 可以一键卸载，删除 API key

---

## 最小技术架构（MVP）

```
SDK（本地 Python）→ 发送汇总 → Server（只接收数字）→ Dashboard
                                  ↓
                            不存原始 Prompt
```

**不需要：**
- K8s / EKS（过度）
- Kafka / Flink（数据量不够时是负担）
- ClickHouse / pgvector（第一版用不上）
- 微服务拆分（团队就 2-3 人）

**只需要：**
- Python SDK（2-3 个文件）
- FastAPI Server（几个 endpoint）
- PostgreSQL（3 张表）
- Next.js Dashboard

**总代码量：2000-3000 行足够 MVP**

---

## 数据模型（极简）

```sql
User: 用户账号
  - id, email, plan

Workspace: 项目
  - id, user_id, name

LLMSummary: 汇总记录（按天）
  - workspace_id
  - date
  - total_input_tokens
  - total_output_tokens
  - total_cost_usd
  - llm_calls_count
  - prompt_type_human_first
  - prompt_type_human_edit
  - prompt_type_framework_auto
```

---

## 可选数据贡献（用户主动开启）

```python
{
    "event_type": "gap_improvement",
    "prompt_type": "framework_auto",
    "task_type": "code_review",
    "model": "claude-3-5-sonnet",
    "gap_before": 0.34,
    "gap_after": 0.58,
    "improvement_delta": 0.24,
    "tokens_saved": 4200,
    "cost_saved_usd": 0.016
}
```

**无：prompt 内容、output 内容、user_id、workspace_id**

---

## 用户可选的数据贡献开关

```
☑ 发送匿名的效率数据（默认关闭）

我们发送：
  • Gap 分数、Prompt 类型标签、任务类型
  • 模型 + Provider、效率改进幅度

我们不发送：
  • Prompt 内容、LLM 输出内容
```

---

## 代码结构（极简）

```
agent_efficiency/
├── sdk/
│   ├── observe.py      # 核心类
│   ├── queue.py       # 本地缓冲
│   └── sync.py        # 同步逻辑
├── server/
│   ├── app.py         # FastAPI
│   └── models.py      # SQLAlchemy，3张表
├── dashboard/
│   └── pages/
└── tests/
```

---

## 仓库

**GitHub：** https://github.com/Zhifeng-Niu/multi-agent-efficiency
**状态：** Private

---

## 下一步

1. 初始化项目结构
2. 写 SPEC.md（详细规格）
3. 确定 MVP 核心功能
4. 开始开发

---

## 参考

- idea.md（初始立项）
- technical-roadmap.md（详细技术路线图，1106行）

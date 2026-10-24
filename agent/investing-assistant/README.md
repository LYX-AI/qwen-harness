# 第一期：让 CodeAgent 调用自己的计算工具

这个终端教学示例使用 smolagents 和智谱 GLM，将人民币预算、用户提供的汇率与股价转换为整股购买预览。模型生成工具调用代码，Python 工具计算金额，Agent 根据结果给出最终回答。

当前是 Harness 仓库内独立的 Python 模块；UI、实时数据、模拟账户与 Node.js 集成将在后续逐步开发。

## 环境与安装

已验证环境：Windows PowerShell、Python 3.13.5、smolagents 1.26.0、openai 3.37.0。requirements.txt 固定直接依赖版本，不是完整传递依赖锁文件。

在本目录执行：

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

在智谱开放平台创建 API Key，然后在运行程序的同一个终端设置：

```powershell
$secret = Read-Host "输入智谱 API Key" -AsSecureString
$env:GLM_API_KEY = [System.Net.NetworkCredential]::new("", $secret).Password
```

这只设置当前终端的环境变量。程序用 os.getenv 读取 GLM_API_KEY，不会自动加载 .env 文件。不要提交或公开密钥。

```powershell
.\.venv\Scripts\python.exe main.py
```

VS Code 如提示找不到 smolagents，请在 Python: Select Interpreter 中选择本目录的 `.venv/Scripts/python.exe`。

## 文件与执行过程

- `calculations.py`：使用 Decimal 计算美元预算、整股数量、支出与余额。
- `tools.py`：用 @tool、类型标注和 Args 文档描述包装 preview_purchase。
- `main.py`：连接 OpenAIModel、注册工具、创建 CodeAgent 并运行示例。

```text
用户问题
  → CodeAgent 发送系统提示词与工具说明
  → GLM 生成 preview_purchase(...) 调用代码
  → 本地执行器运行工具，记录计算结果
  → GLM 生成 final_answer(...)
  → 框架结束循环并返回答案
```

模型使用 `glm-4.7-flash`，服务地址为 `https://open.bigmodel.cn/api/paas/v4`。OpenAIModel 使用 OpenAI 兼容接口访问智谱；API 可用性、免费政策与限速以供应商当时规则为准。

## 已验证的例子

预算 720 元，汇率 7.2 CNY/USD，每股 30 美元：

```json
{
  "budget_usd": "100",
  "max_shares": 3,
  "total_cost_usd": "90",
  "remaining_budget_usd": "10"
}
```

开发期间的真实运行记录显示，Step 1 调用 preview_purchase 并打印上述结果，Step 2 调用 final_answer 返回“最多可以买3整股，花费90美元，还剩10美元”。模型生成的代码与步骤数可能变化；核对工具执行日志，不能仅凭最终回答判断是否使用了工具。

可先独立验证工具，无需模型密钥：

```powershell
.\.venv\Scripts\python.exe -c "from tools import preview_purchase; print(preview_purchase.inputs); print(preview_purchase(720, 7.2, 30))"
```

## 本期知识点与排错

- 工具的实现、说明与模型生成的调用代码是不同部分。
- CodeAgent 自带系统提示词，要求模型用 Python 代码表达动作；执行结果作为后续步骤的 Observation。
- final_answer 是框架提供的工具。模型生成其调用，框架识别完成信号并结束循环。
- max_steps=3 是正常动作步数上限，达到上限后的收尾可能额外请求模型。
- 首次运行的待执行代码残留 `</code`，导致 SyntaxError。设置 `code_block_tags="markdown"` 后完成了一次成功运行。这是本次有效的格式调整，不代表已经定位所有供应商/模型格式问题的根因。
- print(result) 的返回值为 None，因此 Out: None 不表示计算失败；计算结果显示在 Execution logs 中。

## 范围与后续

本例使用手动输入的汇率与股价，只计算整股，不含手续费、税费、滑点、碎股或真实交易。金额字符串尚未统一到两位小数，Decimal 除法也受精度上下文限制。当前示例不提供投资建议或收益承诺。

CodeAgent 默认执行器在本地运行生成代码，不能据此将其视为生产安全沙箱。现阶段仅注册此计算工具。

下一步先完成第一期教学视频，再增加简单输入界面与结果卡片。后续逐步加入数据工具、模拟账户、错误处理与 Harness 集成。

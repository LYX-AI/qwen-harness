import os
from smolagents import CodeAgent,OpenAIModel
from tools import preview_purchase

api_key = os.getenv("GLM_API_KEY")
if not api_key:
    raise RuntimeError("GLM_API_KEY environment variable is not set.")

model = OpenAIModel(
    model_id="glm-4.7-flash",
    api_base="https://open.bigmodel.cn/api/paas/v4",
    api_key=api_key,
)

agent = CodeAgent(
    tools=[preview_purchase],
    model=model,
    max_steps=3,
    code_block_tags="markdown",
)

result = agent.run(
    "我有720元人民币，1美元兑换7.2元人民币，"
    "某股票每股30美元。请使用工具计算最多买多少整股，"
    "花费多少美元，还剩多少美元。"
)

print("最终结果：", result)
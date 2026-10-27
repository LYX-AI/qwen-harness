import os
from smolagents import CodeAgent, OpenAIModel
from tools import preview_purchase

def create_agent():
    api_key = os.getenv("GLM_API_KEY")
    if not api_key:
        raise RuntimeError("GLM_API_KEY environment variable is not set.")

    model = OpenAIModel(
        model_id="glm-4.7-flash",
        api_base="https://open.bigmodel.cn/api/paas/v4",
        api_key=api_key,
    )

    return CodeAgent(
        tools=[preview_purchase],
        model=model,
        instructions=(
            "当任务要求计算预算可以购买多少整股、花费和剩余金额时，"
            "必须调用 preview_purchase 工具恰好一次。"
            "不得在生成代码中自行重做这项计算。"
            "最终回答必须依据工具返回的结果。"
        ),
        max_steps=3,
        code_block_tags="markdown",
    )


def run_example():
    agent = create_agent()
    result = agent.run(
        "我有720元人民币，1美元兑换7.2元人民币，"
        "某股票每股30美元。请使用工具计算最多买多少整股，"
        "花费多少美元，还剩多少美元。"
    )
    print("最终结果：", result)


if __name__ == "__main__":
    run_example()

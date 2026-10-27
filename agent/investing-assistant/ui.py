"""Browser interface for the purchase preview learning project."""

import logging

import gradio as gr
from calculations import calculate_purchase
from main import create_agent

logger = logging.getLogger(__name__)


def preview_ui(budget_cny, cny_per_usd, price_usd):
    """Return a deterministic purchase preview and an optional Agent explanation."""
    values = (budget_cny, cny_per_usd, price_usd)

    if any(value is None for value in values):
        return {}, "", "请填写预算、汇率和每股价格。"

    if any(value <= 0 for value in values):
        return {}, "", "预算、汇率和每股价格都必须大于 0。"

    result = calculate_purchase(budget_cny, cny_per_usd, price_usd)
    status_output = "购买计算与 Agent 解释完成。"
    try:
        agent = create_agent()
        explanation_output = agent.run(
            f"我有{budget_cny}元人民币，1美元兑换{cny_per_usd}元人民币，"
            f"某股票每股{price_usd}美元。请使用 preview_purchase 工具计算最多买多少整股，"
            "花费多少美元，还剩多少美元。"
        )
    except Exception:
        logger.exception("Agent explanation failed after purchase calculation")
        explanation_output = "Agent 解释暂时不可用。"
        status_output = "购买计算已完成，Agent 解释失败。"

    return result, explanation_output, status_output


with gr.Blocks(title="定投购买预览") as demo:
    gr.Markdown("# 定投购买预览")
    gr.Markdown(
        "输入本月预算和参考价格，预览最多可买多少整股。"
        "本期汇率与股价均由你手动输入，不是实时行情。"
    )

    with gr.Row():
        budget_input = gr.Number(label="预算（人民币）", value=720)
        fx_input = gr.Number(label="汇率（1 美元需要多少人民币）", value=7.2)
        price_input = gr.Number(label="每股价格（美元）", value=30)

    preview_button = gr.Button("生成购买预览", variant="primary")
    status_output = gr.Markdown("填写上方信息后点击按钮。")

    with gr.Row():
        result_output = gr.JSON(label="购买计算结果")
        explanation_output = gr.Textbox(label="Agent 解释", lines=5, interactive=False)

    preview_button.click(
        fn=preview_ui,
        inputs=[budget_input, fx_input, price_input],
        outputs=[result_output, explanation_output, status_output],
    )


if __name__ == "__main__":
    demo.launch(inbrowser=True, share=False)

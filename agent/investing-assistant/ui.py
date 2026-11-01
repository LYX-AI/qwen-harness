"""Browser interface for the purchase preview learning project."""

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import gradio as gr
from calculations import calculate_purchase
from main import create_agent
from fx_rates import get_usd_cny_rate

logger = logging.getLogger(__name__)
BEIJING_TIMEZONE = timezone(timedelta(hours=8))


def beijing_today():
    return datetime.now(BEIJING_TIMEZONE).date()


def fetch_fx_rate_ui(current_rate):
    """Fetch a reference USD/CNY rate while preserving manual input on failure."""
    try:
        fx_rate_data = get_usd_cny_rate()
        if fx_rate_data["date"] != beijing_today().isoformat():
            logger.warning("Fetched FX rate is not from today: %s", fx_rate_data["date"])
            return (
                current_rate,
                f"参考汇率数据日期为 {fx_rate_data['date']}，来源：{fx_rate_data['source']}。"
                "不是北京时间今天的数据，未自动填入。请重试获取或手动填写。",
            )
        return (
            fx_rate_data["rate"],
            f"参考汇率获取成功。数据日期：{fx_rate_data['date']}；来源：{fx_rate_data['source']}",
        )
    except RuntimeError:
        logger.exception("Failed to fetch FX rate")
        return current_rate, "参考汇率获取失败，已保留当前汇率。请重试或手动填写。"
    except ValueError:
        logger.exception("Invalid FX rate data")
        return current_rate, "参考汇率数据异常，已保留当前汇率。请手动填写。"


def mark_manual_fx_ui(current_rate):
    """Mark the exchange rate as manual after the user edits its input field."""
    if current_rate is None:
        return "请手动填写汇率，或点击获取今日参考汇率。"
    return "当前汇率为手动填写；购买预览将使用输入框中的数值。"


def purchase_summary(result):
    """Turn the verified calculation into a short, readable explanation."""
    budget_usd = Decimal(result["budget_usd"])
    total_cost_usd = Decimal(result["total_cost_usd"])
    remaining_usd = Decimal(result["remaining_budget_usd"])
    shares = result["max_shares"]
    if shares == 0:
        return f"当前预算约为 {budget_usd:.2f} 美元，不足以购买 1 整股。"
    return (
        f"当前预算约为 {budget_usd:.2f} 美元，最多可购买 {shares} 整股；"
        f"预计花费 {total_cost_usd:.2f} 美元，剩余 {remaining_usd:.2f} 美元。"
    )


def preview_ui(budget_cny, cny_per_usd, price_usd):
    """Return a purchase preview immediately, without waiting for the Agent."""
    values = (budget_cny, cny_per_usd, price_usd)

    if any(value is None for value in values):
        return {}, "", "请填写预算、汇率和每股价格。", "", "Agent 尚未运行。"

    if any(value <= 0 for value in values):
        return {}, "", "预算、汇率和每股价格都必须大于 0。", "", "Agent 尚未运行。"

    result = calculate_purchase(budget_cny, cny_per_usd, price_usd)
    return result, purchase_summary(result), "购买计算完成。", "", "Agent 尚未运行，可按需生成补充解释。"


def explain_purchase_ui(budget_cny, cny_per_usd, price_usd):
    """Run the optional Agent and keep its output separate from verified numbers."""
    result, fallback, status, _, _ = preview_ui(budget_cny, cny_per_usd, price_usd)
    if not result:
        return "", status

    try:
        agent = create_agent()
        agent_output = agent.run(
            f"我有{budget_cny}元人民币，1美元兑换{cny_per_usd}元人民币，"
            f"某股票每股{price_usd}美元。请使用 preview_purchase 工具计算最多买多少整股，"
            "花费多少美元，还剩多少美元。最后用不超过两句自然中文解释结果，"
            "不要输出字典、JSON 或代码。"
        )
    except Exception:
        logger.exception("Agent explanation failed after purchase calculation")
        return fallback, "Agent 解释失败，模型服务暂时不可用或请求受限；已显示购买说明，请稍后重试。"

    explanation = str(agent_output).strip()
    if not explanation or explanation.startswith(("{", "[", "```", "<code>")):
        logger.warning("Agent returned a non-readable explanation: %s", explanation)
        return fallback, "Agent 未生成可读解释；已显示根据购买计算生成的说明。"
    return explanation, "Agent 补充解释已生成；购买数字以计算结果为准。"


with gr.Blocks(title="定投购买预览") as demo:
    gr.Markdown("# 定投购买预览")
    gr.Markdown(
        "输入本月预算和参考价格，预览最多可买多少整股。"
        "汇率可获取今日参考数据或手动填写；股价由你手动输入。"
        "参考汇率不代表实际成交汇率。"
    )

    with gr.Row():
        budget_input = gr.Number(label="预算（人民币）", value=720)
        fx_input = gr.Number(label="汇率（1 美元需要多少人民币）", value=7.2)
        price_input = gr.Number(label="每股价格（美元）", value=30)

    fx_fetch_button = gr.Button("获取今日参考汇率")
    fx_status_output = gr.Markdown("当前汇率为手动填写；可点击按钮获取今日参考数据。")

    preview_button = gr.Button("生成购买预览", variant="primary")
    status_output = gr.Markdown("填写上方信息后点击按钮。")

    with gr.Row():
        result_output = gr.JSON(label="购买计算结果")
        summary_output = gr.Textbox(label="购买说明", lines=4, interactive=False)

    agent_button = gr.Button("让 Agent 补充解释（可能较慢）")
    agent_status_output = gr.Markdown("Agent 尚未运行。")
    agent_output = gr.Textbox(label="Agent 补充解释", lines=4, interactive=False)

    fx_fetch_button.click(
        fn=fetch_fx_rate_ui,
        inputs=[fx_input],
        outputs=[fx_input, fx_status_output],
    )
    fx_input.input(
        fn=mark_manual_fx_ui,
        inputs=[fx_input],
        outputs=[fx_status_output],
    )
    preview_button.click(
        fn=preview_ui,
        inputs=[budget_input, fx_input, price_input],
        outputs=[result_output, summary_output, status_output, agent_output, agent_status_output],
    )
    agent_button.click(
        fn=explain_purchase_ui,
        inputs=[budget_input, fx_input, price_input],
        outputs=[agent_output, agent_status_output],
    )


if __name__ == "__main__":
    demo.launch(inbrowser=True, share=False)

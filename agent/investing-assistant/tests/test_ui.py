"""Behavior checks for the purchase preview's user-facing boundary."""

import unittest
from datetime import date
from unittest.mock import Mock, patch

import ui


class PreviewUiTests(unittest.TestCase):
    def test_today_reference_rate_updates_input_and_shows_source(self):
        rate = {"rate": 7.2, "date": "2026-11-02", "source": "Frankfurter API"}
        with patch.object(ui, "get_usd_cny_rate", return_value=rate), patch.object(
            ui, "beijing_today", return_value=date(2026, 11, 2)
        ):
            value, message = ui.fetch_fx_rate_ui(7.1)

        self.assertEqual(value, 7.2)
        self.assertIn("2026-11-02", message)
        self.assertIn("Frankfurter API", message)

    def test_stale_reference_rate_keeps_manual_input(self):
        rate = {"rate": 7.2, "date": "2026-10-31", "source": "Frankfurter API"}
        with patch.object(ui, "get_usd_cny_rate", return_value=rate), patch.object(
            ui, "beijing_today", return_value=date(2026, 11, 2)
        ):
            value, message = ui.fetch_fx_rate_ui(7.1)

        self.assertEqual(value, 7.1)
        self.assertIn("未自动填入", message)

    def test_fx_fetch_failure_keeps_manual_input(self):
        with patch.object(ui, "get_usd_cny_rate", side_effect=RuntimeError("offline")), patch.object(
            ui.logger, "exception"
        ):
            value, message = ui.fetch_fx_rate_ui(7.1)

        self.assertEqual(value, 7.1)
        self.assertIn("重试或手动填写", message)

    def test_valid_preview_is_readable_without_waiting_for_agent(self):
        with patch.object(ui, "create_agent") as create_agent:
            result, summary, status, agent_output, agent_status = ui.preview_ui(720, 7.2, 30)

        self.assertEqual(result["max_shares"], 3)
        self.assertEqual(result["total_cost_usd"], "90")
        self.assertEqual(result["remaining_budget_usd"], "10")
        self.assertIn("3 整股", summary)
        self.assertIn("90.00 美元", summary)
        self.assertIn("完成", status)
        self.assertEqual(agent_output, "")
        self.assertIn("尚未运行", agent_status)
        create_agent.assert_not_called()

    def test_invalid_input_does_not_call_agent(self):
        with patch.object(ui, "create_agent") as create_agent:
            for values in ((None, 7.2, 30), (0, 7.2, 30), (-1, 7.2, 30)):
                with self.subTest(values=values):
                    result, summary, status, agent_output, agent_status = ui.preview_ui(*values)
                    self.assertEqual(result, {})
                    self.assertEqual(summary, "")
                    self.assertTrue(status)
                    self.assertEqual(agent_output, "")
                    self.assertIn("尚未运行", agent_status)
            create_agent.assert_not_called()

    def test_insufficient_budget_is_a_valid_zero_share_preview(self):
        result, summary, _, _, _ = ui.preview_ui(50, 7.2, 30)

        self.assertEqual(result["max_shares"], 0)
        self.assertEqual(result["total_cost_usd"], "0")
        self.assertIn("不足以购买 1 整股", summary)

    def test_optional_agent_uses_current_inputs(self):
        agent = Mock()
        agent.run.return_value = "最多可买 3 股，预计花费 90 美元。"
        with patch.object(ui, "create_agent", return_value=agent):
            explanation, status = ui.explain_purchase_ui(720, 7.2, 30)

        self.assertIn("3 股", explanation)
        self.assertIn("已生成", status)
        task = agent.run.call_args.args[0]
        for value in ("720", "7.2", "30", "preview_purchase"):
            self.assertIn(value, task)

    def test_raw_agent_dictionary_falls_back_to_readable_calculation(self):
        agent = Mock()
        agent.run.return_value = "{'budget_usd': '100', 'max_shares': 3}"
        with patch.object(ui, "create_agent", return_value=agent):
            explanation, status = ui.explain_purchase_ui(720, 7.2, 30)

        self.assertIn("3 整股", explanation)
        self.assertIn("未生成可读解释", status)

    def test_agent_failure_uses_readable_calculation_without_exposing_exception(self):
        agent = Mock()
        agent.run.side_effect = RuntimeError("private provider detail")
        with patch.object(ui, "create_agent", return_value=agent), patch.object(
            ui.logger, "exception"
        ) as log_failure:
            explanation, status = ui.explain_purchase_ui(720, 7.2, 30)

        self.assertIn("3 整股", explanation)
        self.assertIn("解释失败", status)
        self.assertNotIn("private provider detail", explanation + status)
        log_failure.assert_called_once()


if __name__ == "__main__":
    unittest.main()

"""Behavior checks for the purchase preview's user-facing boundary."""

import unittest
from unittest.mock import Mock, patch

import ui


class PreviewUiTests(unittest.TestCase):
    def test_valid_input_keeps_calculated_numbers_and_uses_current_inputs(self):
        agent = Mock()
        agent.run.return_value = "最多可以买 3 股。"
        with patch.object(ui, "create_agent", return_value=agent):
            result, explanation, status = ui.preview_ui(720, 7.2, 30)

        self.assertEqual(result["max_shares"], 3)
        self.assertEqual(result["total_cost_usd"], "90")
        self.assertEqual(result["remaining_budget_usd"], "10")
        self.assertEqual(explanation, "最多可以买 3 股。")
        self.assertIn("完成", status)
        task = agent.run.call_args.args[0]
        for value in ("720", "7.2", "30", "preview_purchase"):
            self.assertIn(value, task)

    def test_invalid_input_does_not_call_agent(self):
        with patch.object(ui, "create_agent") as create_agent:
            for values in ((None, 7.2, 30), (0, 7.2, 30), (-1, 7.2, 30)):
                with self.subTest(values=values):
                    result, explanation, status = ui.preview_ui(*values)
                    self.assertEqual(result, {})
                    self.assertEqual(explanation, "")
                    self.assertTrue(status)
            create_agent.assert_not_called()

    def test_insufficient_budget_is_a_valid_zero_share_preview(self):
        agent = Mock()
        agent.run.return_value = "当前预算不足以购买一整股。"
        with patch.object(ui, "create_agent", return_value=agent):
            result, _, _ = ui.preview_ui(50, 7.2, 30)

        self.assertEqual(result["max_shares"], 0)
        self.assertEqual(result["total_cost_usd"], "0")

    def test_agent_failure_preserves_numbers_without_exposing_exception(self):
        agent = Mock()
        agent.run.side_effect = RuntimeError("private provider detail")
        with patch.object(ui, "create_agent", return_value=agent), patch.object(
            ui.logger, "exception"
        ) as log_failure:
            result, explanation, status = ui.preview_ui(720, 7.2, 30)

        self.assertEqual(result["max_shares"], 3)
        self.assertIn("计算已完成", status)
        self.assertIn("解释失败", status)
        self.assertNotIn("private provider detail", explanation + status)
        log_failure.assert_called_once()


if __name__ == "__main__":
    unittest.main()

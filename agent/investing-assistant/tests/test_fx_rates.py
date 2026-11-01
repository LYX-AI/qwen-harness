"""Check the external FX response contract and its failure boundary."""

import io
import json
import unittest
from unittest.mock import patch
from urllib.error import URLError

import fx_rates


class FxRateTests(unittest.TestCase):
    def fetch_response(self, payload):
        response = io.BytesIO(json.dumps(payload).encode("utf-8"))
        with patch.object(fx_rates, "urlopen", return_value=response) as urlopen:
            result = fx_rates.get_usd_cny_rate()
        urlopen.assert_called_once_with(fx_rates.url, timeout=10)
        self.assertTrue(response.closed)
        return result

    def test_valid_rate_keeps_source_and_data_date(self):
        result = self.fetch_response(
            {"base": "USD", "quote": "CNY", "rate": 7.2, "date": "2026-11-02"}
        )
        self.assertEqual(
            result, {"rate": 7.2, "date": "2026-11-02", "source": "Frankfurter API"}
        )

    def test_network_failure_is_recoverable_fetch_error(self):
        with patch.object(fx_rates, "urlopen", side_effect=URLError("offline")):
            with self.assertRaisesRegex(RuntimeError, "参考汇率获取失败"):
                fx_rates.get_usd_cny_rate()

    def test_invalid_rate_never_reaches_purchase_preview(self):
        for rate in (True, 0, -1, float("nan")):
            with self.subTest(rate=rate):
                with self.assertRaises(ValueError):
                    self.fetch_response(
                        {"base": "USD", "quote": "CNY", "rate": rate, "date": "2026-11-02"}
                    )

    def test_wrong_currency_pair_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unexpected response"):
            self.fetch_response(
                {"base": "EUR", "quote": "CNY", "rate": 7.2, "date": "2026-11-02"}
            )

    def test_invalid_date_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Invalid date format"):
            self.fetch_response(
                {"base": "USD", "quote": "CNY", "rate": 7.2, "date": "yesterday"}
            )


if __name__ == "__main__":
    unittest.main()

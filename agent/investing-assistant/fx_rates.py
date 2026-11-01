import json
import math
from datetime import date
from urllib.error import URLError
from urllib.request import urlopen

url = "https://api.frankfurter.dev/v2/rate/USD/CNY"

def get_usd_cny_rate():
    try:
        with urlopen(url, timeout=10) as response:
            data = json.load(response)
    except (URLError, TimeoutError) as exc:
        raise RuntimeError("参考汇率获取失败，请重试或手动填写") from exc
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON from Frankfurter API") from exc

    if not isinstance(data, dict):
        raise ValueError("Invalid response from Frankfurter API")
    if data.get("base") != "USD" or data.get("quote") != "CNY":
        raise ValueError("Unexpected response from Frankfurter API")

    rate = data.get("rate")
    if isinstance(rate, bool) or not isinstance(rate, (int, float)):
        raise ValueError("Invalid rate value from Frankfurter API")
    if not math.isfinite(rate) or rate <= 0:
        raise ValueError("Rate value must be positive and finite")

    date_text = data.get("date")
    if not isinstance(date_text, str):
        raise ValueError("Invalid date value from Frankfurter API")
    try:
        parsed_date = date.fromisoformat(date_text)
    except ValueError as exc:
        raise ValueError("Invalid date format from Frankfurter API") from exc
    if parsed_date.isoformat() != date_text:
        raise ValueError("Date must use YYYY-MM-DD format")

    return {
        "rate": rate,
        "date": date_text,
        "source": "Frankfurter API",
    }

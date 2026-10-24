from smolagents import tool  # type: ignore[import-not-found]
from calculations import calculate_purchase

@tool
def preview_purchase(budget_cny: float, cny_per_usd: float, price_usd: float) -> dict:
    """
    Preview the purchase of shares based on the provided budget in CNY, the exchange rate from CNY to USD, and the price per share in USD.

    Args:
        budget_cny (float): The budget in Chinese Yuan (CNY).
        cny_per_usd (float): CNY required to buy 1 USD; for example, 7.2 means 1 USD = 7.2 CNY.
        price_usd (float): The price per share in USD.

    Returns:
        dict: A dictionary containing the calculated purchase details including budget in USD, maximum shares that can be bought, total cost in USD, and remaining budget in USD.
    """
    return calculate_purchase(budget_cny, cny_per_usd, price_usd)
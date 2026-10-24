from decimal import Decimal
def calculate_purchase(budget_cny,cny_per_usd,price_usd):
    if budget_cny <= 0 or cny_per_usd <= 0 or price_usd <= 0:
        raise ValueError("Budget, CNY per USD, and price in USD must all be greater than zero.")
    budget_usd = Decimal(str(budget_cny)) / Decimal(str(cny_per_usd))
    unit_price_usd = Decimal(str(price_usd))
    max_shares = budget_usd // unit_price_usd
    total_cost_usd = max_shares * unit_price_usd
    remaining_budget_usd = budget_usd - total_cost_usd
    return {
        "budget_usd": format(budget_usd, "f"),
        "max_shares": int(max_shares),
        "total_cost_usd": format(total_cost_usd, "f"),
        "remaining_budget_usd": format(remaining_budget_usd, "f")
    }

from decimal import Decimal
"""
1.传入本金
2.本金-》美元
3.美元/股价=最大可买股数
4.最大可买股数*股价=总花费
5.本金-总花费=剩余本金
"""
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

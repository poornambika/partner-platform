import { prisma } from '../prisma';

export interface FinancialReport {
  grossProductSales: number;
  discounts: number;
  refundsAndCancellations: number;
  netSales: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  ownerRemuneration: number;
  estimatedOperatingProfit: number;
  estimatedTaxProvision: number;
  estimatedNetProfit: number;
  simulatedCommissionLiability: number;
  disclaimer: string;
}

export class FinancialService {
  /**
   * Generates comprehensive owner-only financial dashboard figures.
   * Adheres strictly to the formulas defined in the specification.
   */
  static async calculateFinancialSummary(): Promise<FinancialReport> {
    // 1. Fetch all orders
    const allOrders = await prisma.order.findMany({
      include: {
        items: true,
        refundSimulation: true,
      },
    });

    // Gross product sales = sum of gross amounts of all verified/completed/active orders
    // Non-refunded or full gross volume
    let grossProductSales = 0;
    let discounts = 0;
    let refundsAndCancellations = 0;
    let costOfGoodsSold = 0;

    for (const order of allOrders) {
      if (order.status === 'PAID' || order.status === 'DELIVERED' || order.status === 'SHIPPED') {
        grossProductSales += order.grossAmount;
        discounts += order.discountAmount;
        costOfGoodsSold += order.totalCost;
      } else if (order.status === 'REFUNDED' || order.status === 'CANCELLED') {
        grossProductSales += order.grossAmount;
        discounts += order.discountAmount;
        refundsAndCancellations += order.netAmount;
        // Cost of goods sold for refunded items is restocked, so not consumed
      }
    }

    // Formulas:
    // Net Sales = Gross Product Sales - Discounts - Refunds
    const netSales = Math.max(0, grossProductSales - discounts - refundsAndCancellations);

    // Gross Profit = Net Sales - Cost of Goods Sold
    const grossProfit = netSales - costOfGoodsSold;

    // Operating expenses (Approved expenses)
    const expenses = await prisma.expense.findMany({
      where: { approvalStatus: 'APPROVED' },
    });
    const operatingExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Illustrative Owner Remuneration benchmark
    const ownerRemuneration = 25000.0;

    // Approved Eligible Selling Expenses (e.g. simulated commissions that are approved for demonstration)
    const approvedCommissions = await prisma.commissionLedger.findMany({
      where: { status: 'APPROVED_DEMO' },
    });
    const approvedSellingExpenses = approvedCommissions.reduce((sum, c) => sum + c.calculatedAmount, 0);

    // Estimated Operating Profit = Gross Profit - Operating Expenses - Owner Remuneration - Approved Eligible Selling Expenses
    const estimatedOperatingProfit = grossProfit - operatingExpenses - ownerRemuneration - approvedSellingExpenses;

    // Estimated Tax Provision (Illustrative corporate tax benchmark: 25% on positive operating profit)
    // NOTE: Does not tax losses or double-count simulated non-cash items
    const estimatedTaxProvision = estimatedOperatingProfit > 0 ? Math.round(estimatedOperatingProfit * 0.25 * 100) / 100 : 0.0;

    // Estimated Net Profit = Estimated Operating Profit - Estimated Tax Provision
    const estimatedNetProfit = estimatedOperatingProfit - estimatedTaxProvision;

    // Simulated commission liability (All active simulated and pending commissions awaiting demonstration approval)
    const simulatedLedgers = await prisma.commissionLedger.findMany({
      where: { status: { in: ['SIMULATED', 'PENDING_REVIEW', 'APPROVED_DEMO'] } },
    });
    const simulatedCommissionLiability = simulatedLedgers.reduce((sum, c) => sum + c.calculatedAmount, 0);

    return {
      grossProductSales: Math.round(grossProductSales * 100) / 100,
      discounts: Math.round(discounts * 100) / 100,
      refundsAndCancellations: Math.round(refundsAndCancellations * 100) / 100,
      netSales: Math.round(netSales * 100) / 100,
      costOfGoodsSold: Math.round(costOfGoodsSold * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      operatingExpenses: Math.round(operatingExpenses * 100) / 100,
      ownerRemuneration: Math.round(ownerRemuneration * 100) / 100,
      estimatedOperatingProfit: Math.round(estimatedOperatingProfit * 100) / 100,
      estimatedTaxProvision: Math.round(estimatedTaxProvision * 100) / 100,
      estimatedNetProfit: Math.round(estimatedNetProfit * 100) / 100,
      simulatedCommissionLiability: Math.round(simulatedCommissionLiability * 100) / 100,
      disclaimer:
        'DEMO ESTIMATES ONLY: All financial metrics, margins, and tax figures are generated for prototype simulation. Not intended as statutory accounting statements or real tax computations.',
    };
  }
}

export type Role = 'OWNER' | 'PARTNER' | 'USER';

export interface PartnerProfile {
  id: string;
  userId: string;
  referralCode: string;
  branchName: string;
  commissionRate: number;
  totalSales: number;
  totalSimulatedCommission: number;
  joinDate: string;
}

export interface PurchaseReminder {
  id: string;
  userId: string;
  lastPurchaseDate?: string | null;
  nextReminderDate: string;
  cycleIntervalMonths: number;
  reminderStatus: 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE';
  daysRemaining?: number;
  notes?: string;
  policyNote?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  phone?: string;
  address?: string;
  partnerProfile?: PartnerProfile;
  assignedPartner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    partnerProfile?: PartnerProfile;
  };
  purchaseReminder?: PurchaseReminder;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  totalCount: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  partnerId?: string | null;
  attributedPartner?: {
    id: string;
    name: string;
    email: string;
    partnerProfile?: PartnerProfile;
  } | null;
  orderDate: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  totalCost: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  couponCode?: string | null;
  shippingAddress: string;
  invoiceNumber: string;
  items: OrderItem[];
  paymentSimulation?: {
    id: string;
    transactionRef: string;
    amount: number;
    method: string;
    status: string;
    failureReason?: string;
  };
  refundSimulation?: {
    id: string;
    refundRef: string;
    amount: number;
    reason: string;
    status: string;
    processedAt: string;
  };
  commissionLedgers?: CommissionLedger[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  maxRedemptions: number;
  currentRedemptions: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  redemptions?: Array<{
    id: string;
    userId: string;
    discountApplied: number;
    redeemedAt: string;
  }>;
}

export interface CommissionLedger {
  id: string;
  orderId: string;
  beneficiaryId: string;
  eligibleSalesAmount: number;
  illustrativeRate: number;
  calculatedAmount: number;
  status: 'SIMULATED' | 'PENDING_REVIEW' | 'APPROVED_DEMO' | 'REVERSED';
  createdAt: string;
  reversalRef?: string | null;
  notes?: string | null;
  order?: {
    id: string;
    netAmount: number;
    user: { id: string; name: string };
  };
}

export interface Expense {
  id: string;
  category: 'Logistics' | 'Warehouse' | 'IT & Software' | 'Marketing' | 'Compliance' | 'Office';
  amount: number;
  expenseDate: string;
  description: string;
  referenceNumber: string;
  documentPlaceholder?: string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface FinancialTransferRecord {
  id: string;
  sendingEntity: string;
  receivingEntity: string;
  amount: number;
  businessPurpose: string;
  invoiceReference: string;
  approvalStatus: 'APPROVED' | 'PENDING';
  transferDate: string;
}

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

export interface HierarchyNode {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  phone?: string;
  parentId: string | null;
  referralCode?: string;
  branchName?: string;
  totalSales?: number;
  simulatedCommission?: number;
  reminderStatus?: string;
  children: HierarchyNode[];
}

export interface DemoAccountsList {
  total: number;
  owner: User;
  partners: User[];
  users: User[];
}

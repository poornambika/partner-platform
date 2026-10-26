import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning previous demo data ---');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.financialTransferRecord.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.commissionLedger.deleteMany();
  await prisma.commissionPolicy.deleteMany();
  await prisma.purchaseReminder.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.refundSimulation.deleteMany();
  await prisma.paymentSimulation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.referralRelationship.deleteMany();
  await prisma.partnerProfile.deleteMany();
  await prisma.user.deleteMany();

  const demoPasswordHash = await bcrypt.hash('Demo@12345', 10);

  console.log('--- 1. Seeding Owner Account (1) ---');
  const owner = await prisma.user.create({
    data: {
      id: 'OWN001',
      name: 'Demo Owner',
      email: 'owner@demoplatform.local',
      passwordHash: demoPasswordHash,
      role: 'OWNER',
      status: 'ACTIVE',
      phone: '+91 98765 00001',
      address: 'Corporate Headquarters, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    },
  });

  console.log('--- 2. Seeding 10 Main Partners ---');
  const partnerNames = [
    { id: 'PAR001', name: 'Aarav Patel', branch: 'West Zone Hub (Mumbai)', email: 'aarav.patel@partner.local', phone: '+91 98765 10001' },
    { id: 'PAR002', name: 'Priya Sharma', branch: 'North Zone Hub (Delhi NCR)', email: 'priya.sharma@partner.local', phone: '+91 98765 10002' },
    { id: 'PAR003', name: 'Rohan Mehta', branch: 'West Zone Hub (Ahmedabad)', email: 'rohan.mehta@partner.local', phone: '+91 98765 10003' },
    { id: 'PAR004', name: 'Ananya Iyer', branch: 'South Zone Hub (Bengaluru)', email: 'ananya.iyer@partner.local', phone: '+91 98765 10004' },
    { id: 'PAR005', name: 'Vikram Singh', branch: 'North Zone Hub (Jaipur)', email: 'vikram.singh@partner.local', phone: '+91 98765 10005' },
    { id: 'PAR006', name: 'Neha Gupta', branch: 'East Zone Hub (Kolkata)', email: 'neha.gupta@partner.local', phone: '+91 98765 10006' },
    { id: 'PAR007', name: 'Kavita Reddy', branch: 'South Zone Hub (Hyderabad)', email: 'kavita.reddy@partner.local', phone: '+91 98765 10007' },
    { id: 'PAR008', name: 'Rajesh Nair', branch: 'South Zone Hub (Kochi)', email: 'rajesh.nair@partner.local', phone: '+91 98765 10008' },
    { id: 'PAR009', name: 'Sunita Verma', branch: 'Central Zone Hub (Bhopal)', email: 'sunita.verma@partner.local', phone: '+91 98765 10009' },
    { id: 'PAR010', name: 'Amit Joshi', branch: 'North Zone Hub (Chandigarh)', email: 'amit.joshi@partner.local', phone: '+91 98765 10010' },
  ];

  const partners = [];
  for (const p of partnerNames) {
    const partnerUser = await prisma.user.create({
      data: {
        id: p.id,
        name: p.name,
        email: p.email,
        passwordHash: demoPasswordHash,
        role: 'PARTNER',
        status: 'ACTIVE',
        phone: p.phone,
        address: `${p.branch}, India`,
        partnerProfile: {
          create: {
            referralCode: `REF-${p.id}`,
            branchName: p.branch,
            commissionRate: 6.0,
            totalSales: 0,
            totalSimulatedCommission: 0,
            joinDate: new Date(2025, 10, 15 + parseInt(p.id.replace('PAR', ''))),
          },
        },
      },
    });
    partners.push(partnerUser);
  }

  console.log('--- 3. Seeding 30 Regular Users (3 per Partner) ---');
  const userNames = [
    // PAR001: USR001, USR002, USR003
    'Devendra Rao', 'Meera Kulkarni', 'Siddharth Jain',
    // PAR002: USR004, USR005, USR006
    'Pooja Malhotra', 'Gaurav Khanna', 'Ritika Sen',
    // PAR003: USR007, USR008, USR009
    'Alok Bhatt', 'Trisha Desai', 'Kunal Trivedi',
    // PAR004: USR010, USR011, USR012
    'Karthik Sundaram', 'Deepa Swaminathan', 'Manoj Venkatesh',
    // PAR005: USR013, USR014, USR015
    'Harish Rathore', 'Simran Bhasin', 'Manish Chauhan',
    // PAR006: USR016, USR017, USR018
    'Sourav Mukherjee', 'Payal Ghosh', 'Debashish Roy',
    // PAR007: USR019, USR020, USR021
    'Sravani Rao', 'Pradeep Varma', 'Anusha Goud',
    // PAR008: USR022, USR023, USR024
    'Arjun Menon', 'Laxmi Pillai', 'Gokul Krishnan',
    // PAR009: USR025, USR026, USR027
    'Varun Tiwari', 'Shalini Dubey', 'Naveen Shukla',
    // PAR010: USR028, USR029, USR030
    'Jaspreet Kaur', 'Tarun Sandhu', 'Simranjeet Gill',
  ];

  const regularUsers = [];
  for (let i = 0; i < 30; i++) {
    const num = i + 1;
    const userId = `USR${num.toString().padStart(3, '0')}`;
    const partnerIndex = Math.floor(i / 3);
    const assignedPartner = partners[partnerIndex];
    const name = userNames[i];
    const email = `${name.toLowerCase().replace(/[^a-z]/g, '.')}@user.local`;

    // 4-month purchase cycle calculations:
    // Some users purchased 1 month ago, some 3.5 months ago (DUE_SOON)
    const monthsAgo = (i % 4) + 0.5;
    const lastPurchaseDate = new Date();
    lastPurchaseDate.setMonth(lastPurchaseDate.getMonth() - Math.floor(monthsAgo));
    lastPurchaseDate.setDate(lastPurchaseDate.getDate() - Math.floor((monthsAgo % 1) * 30));

    const nextReminderDate = new Date(lastPurchaseDate);
    nextReminderDate.setMonth(nextReminderDate.getMonth() + 4);

    const now = new Date();
    const diffDays = Math.ceil((nextReminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const reminderStatus = diffDays < 15 ? 'DUE_SOON' : 'UP_TO_DATE';

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: name,
        email: email,
        passwordHash: demoPasswordHash,
        role: 'USER',
        status: 'ACTIVE',
        phone: `+91 98111 ${num.toString().padStart(5, '0')}`,
        address: `Residential Flat ${100 + num}, Green Park Society, City Area, India`,
        referralRelationship: {
          create: {
            partnerId: assignedPartner.id,
            notes: `Assigned branch member for ${assignedPartner.name} (${assignedPartner.id})`,
          },
        },
        purchaseReminder: {
          create: {
            lastPurchaseDate: lastPurchaseDate,
            nextReminderDate: nextReminderDate,
            cycleIntervalMonths: 4,
            reminderStatus: reminderStatus,
            notes: 'Standard 4-month direct customer policy (Demonstration)',
          },
        },
      },
    });
    regularUsers.push(user);
  }

  console.log('--- 4. Seeding Products (8) ---');
  const productsData = [
    {
      id: 'PRD001',
      name: 'Organic Herbal Shampoo (300ml)',
      slug: 'organic-herbal-shampoo-300ml',
      category: 'Personal Care',
      description: 'Enriched with Bhringraj, Shikakai, and Amla extracts for natural scalp health and root strengthening.',
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 450.0,
      costPrice: 210.0,
      stockQuantity: 250,
    },
    {
      id: 'PRD002',
      name: 'Vitamin C Radiance Face Serum (50ml)',
      slug: 'vitamin-c-radiance-face-serum-50ml',
      category: 'Personal Care',
      description: 'Brightening daily antioxidant facial serum with 15% active Ethyl Ascorbic Acid and Hyaluronic acid.',
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 799.0,
      costPrice: 340.0,
      stockQuantity: 180,
    },
    {
      id: 'PRD003',
      name: 'Eco-Friendly Multi-Surface Cleanser (1L)',
      slug: 'eco-friendly-multi-surface-cleanser-1l',
      category: 'Household',
      description: 'Plant-derived non-toxic cleaning solution safe for polished wood, marble, kitchen slabs, and ceramic tiles.',
      imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 350.0,
      costPrice: 150.0,
      stockQuantity: 320,
    },
    {
      id: 'PRD004',
      name: 'Biodegradable Laundry Pods (40pk)',
      slug: 'biodegradable-laundry-pods-40pk',
      category: 'Household',
      description: 'Concentrated 4-in-1 enzyme action pods that dissolve instantly in hot and cold wash cycles without microplastics.',
      imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 620.0,
      costPrice: 290.0,
      stockQuantity: 210,
    },
    {
      id: 'PRD005',
      name: 'Artisanal Green Tea & Jasmine (100g)',
      slug: 'artisanal-green-tea-jasmine-100g',
      category: 'Packaged Goods',
      description: 'Single-estate whole-leaf loose green tea delicately scented with fresh night-blooming jasmine flowers.',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 380.0,
      costPrice: 160.0,
      stockQuantity: 400,
    },
    {
      id: 'PRD006',
      name: 'Raw Himalayan Forest Honey (500g)',
      slug: 'raw-himalayan-forest-honey-500g',
      category: 'Packaged Goods',
      description: 'Unpasteurized and unfiltered multifloral wild forest honey harvested sustainably from high altitude valleys.',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 550.0,
      costPrice: 260.0,
      stockQuantity: 290,
    },
    {
      id: 'PRD007',
      name: 'Ashwagandha & Moringa Capsules (60ct)',
      slug: 'ashwagandha-moringa-capsules-60ct',
      category: 'Wellness',
      description: 'Standardized adaptogenic herbal supplement formulation supporting natural stress recovery and physical vitality.',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 650.0,
      costPrice: 280.0,
      stockQuantity: 350,
    },
    {
      id: 'PRD008',
      name: 'Cold-Pressed Virgin Coconut Oil (500ml)',
      slug: 'cold-pressed-virgin-coconut-oil-500ml',
      category: 'Wellness',
      description: '100% pure centrifugation-extracted raw coconut oil ideal for holistic dietary use and skin moisture.',
      imageUrl: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=500&auto=format&fit=crop&q=60',
      sellingPrice: 420.0,
      costPrice: 190.0,
      stockQuantity: 275,
    },
  ];

  const seededProducts = [];
  for (const prod of productsData) {
    const p = await prisma.product.create({
      data: {
        ...prod,
        inventoryMovements: {
          create: {
            changeQuantity: prod.stockQuantity,
            reason: 'INITIAL_STOCK',
            referenceId: 'SEED_BATCH_2026',
          },
        },
      },
    });
    seededProducts.push(p);
  }

  console.log('--- 5. Seeding Coupons ---');
  await prisma.coupon.createMany({
    data: [
      {
        id: 'CPN-01',
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10.0,
        minOrderValue: 500.0,
        maxDiscount: 200.0,
        maxRedemptions: 200,
        currentRedemptions: 8,
        startDate: new Date(2026, 0, 1),
        expiryDate: new Date(2027, 0, 1),
        isActive: true,
      },
      {
        id: 'CPN-02',
        code: 'PARTNER5',
        discountType: 'PERCENTAGE',
        discountValue: 5.0,
        minOrderValue: 300.0,
        maxDiscount: 150.0,
        maxRedemptions: 500,
        currentRedemptions: 12,
        startDate: new Date(2026, 0, 1),
        expiryDate: new Date(2027, 0, 1),
        isActive: true,
      },
      {
        id: 'CPN-03',
        code: 'FESTIVE15',
        discountType: 'PERCENTAGE',
        discountValue: 15.0,
        minOrderValue: 1000.0,
        maxDiscount: 500.0,
        maxRedemptions: 100,
        currentRedemptions: 4,
        startDate: new Date(2026, 0, 1),
        expiryDate: new Date(2026, 11, 31),
        isActive: true,
      },
      {
        id: 'CPN-04',
        code: 'FLAT100',
        discountType: 'FIXED',
        discountValue: 100.0,
        minOrderValue: 800.0,
        maxDiscount: 100.0,
        maxRedemptions: 50,
        currentRedemptions: 2,
        startDate: new Date(2026, 0, 1),
        expiryDate: new Date(2026, 11, 31),
        isActive: true,
      },
    ],
  });

  console.log('--- 6. Seeding Commission Policy ---');
  await prisma.commissionPolicy.create({
    data: {
      id: 'DEFAULT',
      salesCommissionRate: 6.0,
      recruitmentBonusEnabled: false,
      recruitmentBonusAmount: 30.0,
      legalDisclaimer:
        'Illustrative simulation pending legal and regulatory compliance review. Headcount or recruitment-based incentives are strictly UNAPPROVED and disabled in compliance with consumer protection standards.',
    },
  });

  console.log('--- 7. Seeding Realistic Orders & Commission Ledgers ---');
  // Create realistic orders across the users and their attributed partners
  const sampleOrdersPlan = [
    { userIdx: 0, partnerId: 'PAR001', prodIndices: [0, 1], coupon: 'WELCOME10', dateDaysAgo: 5, status: 'PAID' },
    { userIdx: 1, partnerId: 'PAR001', prodIndices: [2, 3], coupon: null, dateDaysAgo: 12, status: 'PAID' },
    { userIdx: 2, partnerId: 'PAR001', prodIndices: [4, 5, 6], coupon: 'PARTNER5', dateDaysAgo: 20, status: 'PAID' },
    { userIdx: 3, partnerId: 'PAR002', prodIndices: [1, 6], coupon: 'WELCOME10', dateDaysAgo: 8, status: 'PAID' },
    { userIdx: 4, partnerId: 'PAR002', prodIndices: [0, 2, 7], coupon: null, dateDaysAgo: 16, status: 'PAID' },
    { userIdx: 6, partnerId: 'PAR003', prodIndices: [3, 4], coupon: 'PARTNER5', dateDaysAgo: 14, status: 'PAID' },
    { userIdx: 7, partnerId: 'PAR003', prodIndices: [5, 7], coupon: null, dateDaysAgo: 22, status: 'PAID' },
    { userIdx: 9, partnerId: 'PAR004', prodIndices: [0, 1, 2], coupon: 'FESTIVE15', dateDaysAgo: 4, status: 'PAID' },
    { userIdx: 10, partnerId: 'PAR004', prodIndices: [6], coupon: null, dateDaysAgo: 18, status: 'PAID' },
    { userIdx: 12, partnerId: 'PAR005', prodIndices: [2, 4], coupon: 'WELCOME10', dateDaysAgo: 9, status: 'PAID' },
    { userIdx: 15, partnerId: 'PAR006', prodIndices: [1, 5, 7], coupon: 'PARTNER5', dateDaysAgo: 11, status: 'PAID' },
    { userIdx: 18, partnerId: 'PAR007', prodIndices: [0, 3], coupon: null, dateDaysAgo: 7, status: 'PAID' },
    { userIdx: 21, partnerId: 'PAR008', prodIndices: [4, 6], coupon: 'WELCOME10', dateDaysAgo: 15, status: 'PAID' },
    { userIdx: 24, partnerId: 'PAR009', prodIndices: [2, 5], coupon: null, dateDaysAgo: 19, status: 'PAID' },
    { userIdx: 27, partnerId: 'PAR010', prodIndices: [1, 3], coupon: 'PARTNER5', dateDaysAgo: 6, status: 'PAID' },
    // A pending order
    { userIdx: 5, partnerId: 'PAR002', prodIndices: [0, 7], coupon: null, dateDaysAgo: 1, status: 'PENDING' },
    // A refunded/cancelled order with reversed commission
    { userIdx: 8, partnerId: 'PAR003', prodIndices: [1, 2], coupon: null, dateDaysAgo: 25, status: 'REFUNDED' },
  ];

  let orderCounter = 1001;
  const partnerSalesMap: Record<string, { sales: number; commission: number }> = {};
  for (const p of partners) {
    partnerSalesMap[p.id] = { sales: 0, commission: 0 };
  }

  for (const plan of sampleOrdersPlan) {
    const user = regularUsers[plan.userIdx];
    const orderId = `ORD-${orderCounter}`;
    const invoiceNum = `INV-2026-${orderCounter}`;
    orderCounter++;

    let grossAmount = 0;
    let totalCost = 0;
    const itemsData = [];

    for (const pIdx of plan.prodIndices) {
      const p = seededProducts[pIdx];
      const qty = 1 + (pIdx % 2);
      const subtotal = p.sellingPrice * qty;
      const cost = p.costPrice * qty;
      grossAmount += subtotal;
      totalCost += cost;
      itemsData.push({
        productId: p.id,
        quantity: qty,
        unitPrice: p.sellingPrice,
        unitCost: p.costPrice,
        subtotal: subtotal,
      });
    }

    let discountAmount = 0;
    if (plan.coupon === 'WELCOME10') discountAmount = Math.min(grossAmount * 0.1, 200);
    else if (plan.coupon === 'PARTNER5') discountAmount = Math.min(grossAmount * 0.05, 150);
    else if (plan.coupon === 'FESTIVE15') discountAmount = Math.min(grossAmount * 0.15, 500);

    const netAmount = Math.max(0, grossAmount - discountAmount);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - plan.dateDaysAgo);

    const isPaid = plan.status === 'PAID';
    const isRefunded = plan.status === 'REFUNDED';
    const isPending = plan.status === 'PENDING';

    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId: user.id,
        partnerId: plan.partnerId,
        orderDate: orderDate,
        grossAmount: Math.round(grossAmount * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        status: plan.status,
        paymentStatus: isPaid || isRefunded ? 'SUCCESS' : 'PENDING',
        paymentMethod: 'MOCK_UPI',
        couponCode: plan.coupon,
        shippingAddress: user.address || 'Standard Registered Address',
        invoiceNumber: invoiceNum,
        items: {
          create: itemsData,
        },
        paymentSimulation: {
          create: {
            transactionRef: `TXN-DEMO-${orderId}`,
            amount: Math.round(netAmount * 100) / 100,
            method: 'MOCK_UPI',
            status: isPaid || isRefunded ? 'SUCCESS' : 'PENDING',
          },
        },
        ...(isRefunded
          ? {
              refundSimulation: {
                create: {
                  refundRef: `REF-DEMO-${orderId}`,
                  amount: Math.round(netAmount * 100) / 100,
                  reason: 'Customer requested cancellation prior to dispatch',
                  status: 'PROCESSED',
                },
              },
            }
          : {}),
      },
    });

    // Commission Ledger entry for partner
    if (plan.partnerId) {
      const eligibleSales = Math.round(netAmount * 100) / 100;
      const calculatedComm = Math.round(eligibleSales * 0.06 * 100) / 100;

      let ledgerStatus = 'SIMULATED';
      let reversalRef: string | null = null;
      if (isPaid) {
        ledgerStatus = plan.dateDaysAgo > 10 ? 'APPROVED_DEMO' : 'PENDING_REVIEW';
        partnerSalesMap[plan.partnerId].sales += eligibleSales;
        partnerSalesMap[plan.partnerId].commission += calculatedComm;
      } else if (isRefunded) {
        ledgerStatus = 'REVERSED';
        reversalRef = `REV-${orderId}`;
      }

      await prisma.commissionLedger.create({
        data: {
          id: `COM-${orderId.replace('ORD-', '')}`,
          orderId: order.id,
          beneficiaryId: plan.partnerId,
          eligibleSalesAmount: eligibleSales,
          illustrativeRate: 6.0,
          calculatedAmount: calculatedComm,
          status: ledgerStatus,
          reversalRef: reversalRef,
          notes: `Simulated 6% commission on eligible product sales for ${orderId}`,
          createdAt: orderDate,
        },
      });
    }
  }

  // Update PartnerProfile totals
  for (const partnerId of Object.keys(partnerSalesMap)) {
    const data = partnerSalesMap[partnerId];
    await prisma.partnerProfile.update({
      where: { userId: partnerId },
      data: {
        totalSales: Math.round(data.sales * 100) / 100,
        totalSimulatedCommission: Math.round(data.commission * 100) / 100,
      },
    });
  }

  console.log('--- 8. Seeding Operating Expenses ---');
  await prisma.expense.createMany({
    data: [
      {
        id: 'EXP-001',
        category: 'Logistics',
        amount: 45000.0,
        expenseDate: new Date(2026, 8, 1),
        description: 'Monthly Regional Warehouse Lease & Hub Consolidation (Mumbai)',
        referenceNumber: 'VEND-LEAS-8812',
        documentPlaceholder: 'lease_agreement_mumbai_hub_2026.pdf',
        approvalStatus: 'APPROVED',
      },
      {
        id: 'EXP-002',
        category: 'IT & Software',
        amount: 12500.0,
        expenseDate: new Date(2026, 8, 5),
        description: 'Cloud Infrastructure, Database Hosting & SSL Services',
        referenceNumber: 'INV-CLOUD-9014',
        documentPlaceholder: 'aws_invoice_sep_2026.pdf',
        approvalStatus: 'APPROVED',
      },
      {
        id: 'EXP-003',
        category: 'Compliance',
        amount: 20000.0,
        expenseDate: new Date(2026, 8, 10),
        description: 'Direct Selling Legal Review & Consumer Protection Retainer',
        referenceNumber: 'LEG-ADV-1029',
        documentPlaceholder: 'legal_compliance_retainer_receipt.pdf',
        approvalStatus: 'APPROVED',
      },
      {
        id: 'EXP-004',
        category: 'Warehouse',
        amount: 18000.0,
        expenseDate: new Date(2026, 8, 15),
        description: 'Recyclable Packaging Materials & Tamper-Proof Boxes Bulk Order',
        referenceNumber: 'PACK-SUP-4491',
        documentPlaceholder: 'packaging_po_september.pdf',
        approvalStatus: 'APPROVED',
      },
      {
        id: 'EXP-005',
        category: 'Marketing',
        amount: 15000.0,
        expenseDate: new Date(2026, 8, 20),
        description: 'Product Educational Catalogs & Digital Training Manuals Creation',
        referenceNumber: 'MKT-ASSET-3021',
        documentPlaceholder: 'creative_agency_bill_55.pdf',
        approvalStatus: 'APPROVED',
      },
      {
        id: 'EXP-006',
        category: 'Office',
        amount: 10000.0,
        expenseDate: new Date(2026, 8, 25),
        description: 'Administrative Services, Telecom & High-Speed Optical Fiber Lines',
        referenceNumber: 'ADMIN-TEL-1102',
        documentPlaceholder: 'telecom_fiber_utility_slip.pdf',
        approvalStatus: 'APPROVED',
      },
    ],
  });

  console.log('--- 9. Seeding Mock Inter-Company Transfers ---');
  await prisma.financialTransferRecord.createMany({
    data: [
      {
        id: 'TXR-001',
        sendingEntity: 'Apex Retail Ventures Pvt Ltd (Parent)',
        receivingEntity: 'Apex West Zone Logistics Hub (Subsidiary)',
        amount: 35000.0,
        businessPurpose: 'Working capital allocation for regional inventory handling',
        invoiceReference: 'INTER-CORP-2026-01',
        approvalStatus: 'APPROVED',
        transferDate: new Date(2026, 8, 12),
      },
      {
        id: 'TXR-002',
        sendingEntity: 'Apex Retail Ventures Pvt Ltd (Parent)',
        receivingEntity: 'Apex Digital Solutions Tech LLP',
        amount: 18000.0,
        businessPurpose: 'Software maintenance and enterprise security services license',
        invoiceReference: 'INTER-CORP-2026-02',
        approvalStatus: 'APPROVED',
        transferDate: new Date(2026, 8, 18),
      },
      {
        id: 'TXR-003',
        sendingEntity: 'Apex North Zone Distribution Center',
        receivingEntity: 'Apex Retail Ventures Pvt Ltd (Parent)',
        amount: 28000.0,
        businessPurpose: 'Surplus revenue remitted from branch retail counter sales',
        invoiceReference: 'INTER-CORP-2026-03',
        approvalStatus: 'APPROVED',
        transferDate: new Date(2026, 8, 28),
      },
    ],
  });

  console.log('--- 10. Seeding Sample Audit Logs & Notifications ---');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: 'OWN001',
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'PLATFORM',
        entityId: 'SYS',
        details: 'Initial system seeding with 1 Owner, 10 Partners, and 30 Users complete.',
        ipAddress: '127.0.0.1',
      },
      {
        userId: 'OWN001',
        action: 'POLICY_VERIFICATION',
        entityType: 'COMMISSION_POLICY',
        entityId: 'DEFAULT',
        details: 'Confirmed recruitment payouts remain DISABLED pending legal review. 6% product sales rule active.',
        ipAddress: '127.0.0.1',
      },
      {
        userId: 'PAR001',
        action: 'PARTNER_LOGIN',
        entityType: 'AUTH',
        entityId: 'PAR001',
        details: 'Partner authenticated from verified branch terminal.',
        ipAddress: '192.168.1.101',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: 'OWN001',
        title: 'Platform Initialized Successfully',
        message: '41 demo accounts (1 Owner, 10 Partners, 30 Users) ready for evaluation.',
        type: 'SUCCESS',
      },
      {
        userId: 'OWN001',
        title: 'Compliance Audit Reminder',
        message: 'Recruitment bonus rule is currently DISABLED as per Direct Selling compliance.',
        type: 'INFO',
      },
      {
        userId: 'PAR001',
        title: 'New Customer Order Attributed',
        message: 'Order ORD-1001 verified. Simulated commission statement updated.',
        type: 'SUCCESS',
      },
      {
        userId: 'USR001',
        title: 'Order ORD-1001 Confirmed',
        message: 'Your demo order has been confirmed. Download invoice from your orders page.',
        type: 'SUCCESS',
      },
    ],
  });

  console.log('========================================================');
  console.log('Seeding completed successfully!');
  console.log('Total accounts created: 41');
  console.log('  - Owner: 1 (OWN001)');
  console.log('  - Partners: 10 (PAR001 - PAR010)');
  console.log('  - Regular Users: 30 (USR001 - USR030, exactly 3 per partner)');
  console.log('========================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

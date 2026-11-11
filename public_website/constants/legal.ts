import { LegalDocument } from '../types';

export const LEGAL_DOCS: Record<string, LegalDocument> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'This Privacy Policy describes how Craviti Technologies Private Limited ("Craviti", "we", "us", or "our") collects, uses, shares, and protects the personal information of restaurant merchants, operating staff, and dining patrons who interact with our contactless ordering platform.',
    sections: [
      {
        id: 'information-we-collect',
        title: '1. Information We Collect',
        content: `
We collect information directly from you when you register a restaurant account, visit our public website, or scan a table QR code to place a dining order.

**A. Merchant Information:**
- Business Details: Restaurant trade name, registered corporate name, GSTIN, FSSAI license number, registered business address, and operational phone numbers.
- Banking & Payout Data: Bank account number, IFSC code, branch address, canceled cheque copy, passbook image, and PAN card for payout verification and settlement compliance.
- Account Credentials: Authorized email addresses, encrypted passwords, and RBAC staff credentials.

**B. Dining Patron (Customer) Information:**
- Order Details: Selected menu items, table number identifier, dietary modifications, order timestamps, and invoice amounts.
- Contact Details: Optional customer name, phone number, and email address provided for receipt delivery and loyalty points.
- Payment Metadata: Transaction reference identifiers, payment method (UPI, Card, Net Banking, Cash), and gateway authorization tokens.
        `,
      },
      {
        id: 'payment-information',
        title: '2. Payment Information & Security',
        content: `
Craviti collects and processes only the information strictly required for dining order execution, payment reconciliation, and accounting compliance.

**Information Collected for Payment Processing:**
- Customer Name
- Phone Number
- Email Address (optional for digital receipt delivery)
- Order Details & Itemized Breakdown
- Restaurant ID & Merchant Name
- Table Number Identifier
- Transaction Amount & Currency
- Selected Payment Method (e.g., UPI, Credit/Debit Card, Net Banking, Wallets, Cash)
- Payment Gateway Transaction Reference / ID
- Payment Status (Initiated, Captured, Failed, Refunded)
- Tax Invoice Number & Timestamp

**Strict Zero Credential Storage Policy:**
Craviti strictly operates as an ordering facilitation and orchestration layer. **Craviti does NOT store:**
- Credit or Debit Card Numbers (PAN)
- Card Verification Value (CVV / CVC)
- UPI PIN Numbers
- Net Banking Passwords
- One-Time Passwords (OTPs)
- Sensitive Payment & Banking Credentials

All financial transactions, card details, and payment authorizations are handled directly and securely by Razorpay Software Private Limited ("Razorpay"), one of India's trusted payment gateways, in compliance with Reserve Bank of India (RBI) regulations and PCI-DSS Level 1 security standards.
        `,
      },
      {
        id: 'how-we-use-information',
        title: '3. How We Use Your Information',
        content: `
Craviti uses collected data to execute and optimize our core restaurant operating services:
- Transmitting guest orders instantaneously to kitchen stations and billing counters via real-time WebSockets.
- Processing payment authorizations and facilitating automated domestic merchant bank settlements through certified gateways.
- Generating deterministic digital tax invoices and PDF receipts for customers.
- Providing operational analytics, revenue summaries, and peak hour heatmaps for restaurant owners.
- Preventing fraud, duplicate payment claims, and unauthorized chargebacks.
- Complying with statutory requirements under the Information Technology Act, 2000 and GST regulations.
        `,
      },
      {
        id: 'data-sharing-and-disclosure',
        title: '4. Data Sharing & Third-Party Processors',
        content: `
We never sell, rent, or monetize your personal or dining data to third-party advertisers. We disclose data solely to trusted infrastructure partners bound by strict confidentiality:
- **Payment Gateway:** Razorpay Software Private Limited for payment tokenization, gateway authentication, and banking settlement execution.
- **Cloud Infrastructure:** MongoDB Atlas and AWS Data Centers located within Indian jurisdiction for database persistence.
- **Communication Infrastructure:** Certified SMS/WhatsApp providers for digital receipt delivery and notification routing.
- **Legal & Regulatory Authorities:** When mandatory by law, court order, or governmental tax audit.
        `,
      },
      {
        id: 'data-security-retention',
        title: '5. Data Security & Retention',
        content: `
All data in transit is encrypted using TLS 1.3 with SHA-256 HMAC authentication. Data at rest is encrypted using AES-256 standard. We retain merchant operational data for the duration of the active subscription plus 7 years to fulfill statutory taxation record obligations. Customer guest data is retained for 36 months before automated anonymization.
        `,
      },
      {
        id: 'your-privacy-rights',
        title: '6. Your Privacy Rights',
        content: `
Under applicable data protection frameworks, including the Digital Personal Data Protection Act (DPDPA), you have the right to inspect, correct, export, or request deletion of your personal records. To exercise any privacy right, contact our Data Protection Officer at privacy@craviti.com.
        `,
      },
    ],
  },
  'terms-and-conditions': {
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'These Terms and Conditions constitute a legally binding agreement between you and Craviti Technologies Private Limited governing your use of the Craviti software platform, digital menus, and associated services.',
    sections: [
      {
        id: 'acceptance-of-terms',
        title: '1. Acceptance of Terms',
        content: `
By creating an account, accessing our administrative portal, or deploying Craviti QR codes within your establishment, you agree to be bound by these Terms. If you are entering into this agreement on behalf of a restaurant company, you warrant that you have full legal authority to bind that entity.
        `,
      },
      {
        id: 'platform-license-scope',
        title: '2. Platform License & Permitted Use',
        content: `
Craviti grants you a non-exclusive, non-transferable, revocable license to access our cloud-based restaurant operating platform solely for managing table ordering, kitchen operations, billing, and analytics in accordance with your chosen subscription tier. You may not reverse engineer, decompile, scrape, or resell the platform software.
        `,
      },
      {
        id: 'merchant-obligations',
        title: '3. Merchant Responsibilities',
        content: `
Merchants agree to:
- Maintain accurate, current menu item prices, allergen warnings, and availability statuses.
- Fulfill orders placed by patrons in a sanitary, timely manner compliant with all applicable FSSAI standards.
- Safeguard administrative and staff login credentials to prevent unauthorized account access.
- Ensure that bank details submitted for payout verification represent an active, legally compliant commercial account.
        `,
      },
      {
        id: 'payment-processing',
        title: '4. Payment Processing & Gateway Operations',
        content: `
Customer payments for dining orders placed through the Craviti web interface are processed securely using Razorpay, an authorized payment aggregator licensed by the Reserve Bank of India (RBI).

**Key Terms Governing Payments:**
- **Role of Craviti:** Craviti facilitates digital menu browsing, item selection, order transmission to kitchen terminals, and payment orchestration with the payment gateway. Craviti is not a bank, banking agent, or licensed payment aggregator.
- **Gateway Operations:** Payment authorization, capture, settlement, banking routing, chargeback administration, and dispute resolution are managed directly by Razorpay and partner clearing networks.
- **Settlement Schedules:** Payout and settlement schedules are governed by Razorpay and applicable banking clearing systems. Craviti does not control banking clearing windows and does not guarantee exact settlement timings or specific hour windows.
- **Payment Security:** All customer card and banking credentials are handled exclusively by Razorpay under PCI-DSS Level 1 compliance. Craviti never stores sensitive card numbers, CVVs, UPI PINs, or banking passwords.
        `,
      },
      {
        id: 'subscription-fees-billing',
        title: '5. Subscriptions & Billing',
        content: `
Platform access fees are billed in advance on a recurring monthly or annual basis. Fees are non-refundable except as explicitly provided in our Refund Policy. Craviti reserves the right to suspend or restrict access to restaurants with accounts overdue beyond 14 business days.
        `,
      },
      {
        id: 'limitation-of-liability',
        title: '6. Limitation of Liability',
        content: `
In no event shall Craviti, its directors, employees, or partners be liable for indirect, punitive, or consequential damages, including loss of restaurant profits, inventory spoilage, banking delays, or business interruption, exceeding the total platform subscription fees paid by you in the 3 months preceding the claim.
        `,
      },
    ],
  },
  'refund-policy': {
    title: 'Refund Policy',
    slug: 'refund-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'This Refund Policy outlines the conditions under which Craviti issues refunds for software subscriptions, physical QR placards, and customer dining orders.',
    sections: [
      {
        id: 'subscription-refunds',
        title: '1. Software Subscription Refunds',
        content: `
- **14-Day Free Trial:** No charges are incurred during the 14-day trial period.
- **Annual Subscriptions:** If you cancel an annual plan within 30 days of initial purchase, you are eligible for a full refund minus a 10% administrative provisioning charge. Cancellations after 30 days are credited pro-rata for unused full calendar months.
- **Monthly Subscriptions:** Monthly recurring fees are non-refundable for the active billing cycle once paid, but cancel future recurring renewals immediately.
        `,
      },
      {
        id: 'hardware-placards',
        title: '2. Physical QR Stands & Placards',
        content: `
Custom engraved or printed QR table stands damaged in transit are replaced completely free of charge upon photographic proof provided within 48 hours of courier delivery. Due to custom branding and table serialization, physical placards are non-returnable once printed without defect.
        `,
      },
      {
        id: 'diner-disputes',
        title: '3. Diner Payment & Food Disputes',
        content: `
Disputes concerning food preparation quality, order fulfillment, preparation delays, or incorrect dishes served are the sole operational responsibility of the respective restaurant establishment. Craviti provides technical tools for restaurant managers to review and approve direct refunds to diners through the Restaurant Management Portal.
        `,
      },
      {
        id: 'customer-refund-processing',
        title: '4. Guest Refund Processing via Razorpay',
        content: `
For orders placed by dining guests through the Craviti digital ordering interface:
- **Restaurant Approval:** Refunds are initiated exclusively after review and verification by the restaurant merchant or authorized store manager.
- **Secure Processing:** Approved refunds are initiated securely through Razorpay directly back to the original payment source (UPI account, credit/debit card, or net banking facility) used during order placement.
- **Processing Timelines:** The time required for refunded funds to reflect in the customer's account depends upon:
  1. The customer's issuing bank and internal clearance policies
  2. The specific payment method utilized (e.g., UPI settlements typically reflect faster than card or net banking rails)
  3. Razorpay gateway reconciliation and banking settlement batch cycles
- **Banking Disclaimers:** Craviti facilitates the technical refund transmission to Razorpay. Craviti does not hold customer funds and cannot expedite or control final interbank processing turnaround once the refund is successfully dispatched by the payment gateway.
        `,
      },
      {
        id: 'refund-processing-timeline',
        title: '5. Standard Refund Timelines',
        content: `
Approved software subscription refunds and merchant-approved diner gateway refunds generally take between 5 to 7 business days to reflect on the customer's bank statement, depending on the issuing bank or card network clearance protocols.
        `,
      },
    ],
  },
  'merchant-agreement': {
    title: 'Merchant Service Agreement',
    slug: 'merchant-agreement',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'The definitive agreement between Craviti and hospitality merchants governing commercial terms, payout verification, platform SLAs, and operational obligations.',
    sections: [
      {
        id: 'commercial-terms',
        title: '1. Commercial Relationship',
        content: `
Craviti provides software-as-a-service infrastructure to empower independent restaurant operators. Craviti is not a restaurant, food delivery aggregator, or food manufacturer.
        `,
      },
      {
        id: 'merchant-payment-settlement',
        title: '2. Merchant Payment & Settlement',
        content: `
To enable online customer payments and receive automated bank settlements, partner restaurants may be required to provide:
- Permanent Account Number (PAN) of the entity or proprietor
- Goods and Services Tax Identification Number (GSTIN), where applicable
- Food Safety and Standards Authority of India (FSSAI) license registration
- Commercial Bank Account Number & IFSC Code
- Canceled Cheque or Bank Passbook copy for account validation
- Know Your Customer (KYC) documentation for authorized signatories
- Verified operational contact details and registered establishment address

**Purpose of Collection:**
These details are utilized strictly for merchant onboarding, compliance checks, statutory taxation requirements, and executing direct bank settlements via Razorpay.

**Settlement Terms & Timelines:**
Where applicable, customer payments captured through the digital menu are settled into the merchant's verified bank account via Razorpay.
- Settlement timelines are managed directly by Razorpay.
- For most domestic merchants, the standard settlement schedule is generally T+2 working days after successful payment capture.
- Actual settlement timing may vary depending on:
  • Merchant verification and KYC documentation status
  • Banking holidays, weekend clearing cycles, and bank operating hours
  • Reserve Bank of India (RBI) regulations and settlement directives
  • Periodic risk assessments, fraud reviews, and compliance evaluations
  • Razorpay applicable settlement schedule and merchant category terms

Craviti facilitates order management and payment orchestration. Craviti does not hold merchant funds in escrow or guarantee fixed payout windows.
        `,
      },
      {
        id: 'sla-uptime',
        title: '3. Service Level Agreement (SLA)',
        content: `
We commit to a 99.99% monthly platform uptime target for our core guest ordering and kitchen display services, excluding scheduled maintenance announced 48 hours in advance.
        `,
      },
    ],
  },
  'merchant-terms': {
    title: 'Merchant Terms & Service Agreement',
    slug: 'merchant-terms',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Official terms governing restaurant merchant partnerships, payment processing, KYC verification, and automated bank settlements powered by Razorpay.',
    sections: [
      {
        id: 'commercial-terms',
        title: '1. Commercial Relationship',
        content: `
Craviti provides cloud software infrastructure for contactless ordering, kitchen display systems, and revenue reporting. Craviti acts as a technology enabler and does not manufacture food or operate food delivery fleets.
        `,
      },
      {
        id: 'merchant-payment-settlement',
        title: '2. Merchant Payment & Settlement',
        content: `
To enable online customer payments and receive automated bank settlements, partner restaurants may be required to provide:
- Permanent Account Number (PAN) of the entity or proprietor
- Goods and Services Tax Identification Number (GSTIN), where applicable
- Food Safety and Standards Authority of India (FSSAI) license registration
- Commercial Bank Account Number & IFSC Code
- Canceled Cheque or Bank Passbook copy for account validation
- Know Your Customer (KYC) documentation for authorized signatories
- Verified operational contact details and registered establishment address

**Purpose of Collection:**
These details are utilized strictly for merchant onboarding, compliance checks, statutory taxation requirements, and executing direct bank settlements via Razorpay.

**Settlement Terms & Timelines:**
Where applicable, customer payments captured through the digital menu are settled into the merchant's verified bank account via Razorpay.
- Settlement timelines are managed directly by Razorpay.
- For most domestic merchants, the standard settlement schedule is generally T+2 working days after successful payment capture.
- Actual settlement timing may vary depending on:
  • Merchant verification and KYC documentation status
  • Banking holidays, weekend clearing cycles, and bank operating hours
  • Reserve Bank of India (RBI) regulations and settlement directives
  • Periodic risk assessments, fraud reviews, and compliance evaluations
  • Razorpay applicable settlement schedule and merchant category terms

Craviti facilitates order management and payment orchestration. Craviti does not hold merchant funds in escrow or guarantee fixed payout windows.
        `,
      },
      {
        id: 'sla-uptime',
        title: '3. Service Level Agreement (SLA)',
        content: `
We commit to a 99.99% monthly platform uptime target for our core guest ordering and kitchen display services, excluding scheduled maintenance announced 48 hours in advance.
        `,
      },
    ],
  },
  'payment-policy': {
    title: 'Payment & Settlement Policy',
    slug: 'payment-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Comprehensive policy detailing payment methods, security encryption, zero credential storage, Razorpay gateway integration, and merchant bank settlement schedules on the Craviti platform.',
    sections: [
      {
        id: 'overview-gateway',
        title: '1. Overview & Authorized Payment Gateway',
        content: `
Craviti securely processes customer payments using Razorpay Software Private Limited ("Razorpay"), one of India's trusted, RBI-authorized payment aggregators.

Craviti provides the contactless menu and ordering orchestration interface that allows guests to place dining orders directly from their mobile browsers. All payment initiation, cryptographic authorization, fund capture, and bank payout operations are conducted in partnership with Razorpay under strict Indian banking and compliance standards.
        `,
      },
      {
        id: 'payment-methods',
        title: '2. Supported Payment Methods',
        content: `
Craviti supports a broad range of convenient, contactless digital payment methods powered by Razorpay:
- **Unified Payments Interface (UPI):** Google Pay, PhonePe, Paytm, BHIM, and all compliant UPI 2.0 applications.
- **Credit Cards:** Visa, Mastercard, RuPay, and American Express.
- **Debit Cards:** All domestic commercial and public sector bank debit cards.
- **Internet Banking:** Over 50+ Indian commercial banking institutions.
- **Digital Wallets & Prepaid Instruments:** Supported digital wallets and payment instruments enabled on the Razorpay gateway.
- **Cash / Counter Payment:** Available where supported by the specific restaurant merchant for offline dining reconciliation.
        `,
      },
      {
        id: 'payment-security',
        title: '3. Payment Security & Zero Credential Storage',
        content: `
Security is central to the Craviti platform. All communications between customer devices, restaurant terminals, and our servers utilize 256-bit TLS 1.3 encryption with HMAC-SHA256 verification.

**Zero Sensitive Credential Storage Policy:**
Craviti acts strictly as the digital ordering facilitation layer. **Craviti never stores:**
- Credit or Debit Card Numbers (PAN)
- Card Verification Value (CVV / CVC)
- UPI PIN Numbers
- Internet Banking Passwords
- One-Time Passwords (OTPs)
- Sensitive Financial or Banking Credentials

All sensitive payment credentials are transmitted directly and securely to Razorpay using industry-standard tokenization in full compliance with PCI-DSS Level 1 specifications and Reserve Bank of India (RBI) data security mandates.
        `,
      },
      {
        id: 'settlement-policy',
        title: '4. Merchant Settlement Policy & Timelines',
        content: `
Customer payments captured through the Craviti digital ordering interface are settled directly into the restaurant merchant's verified domestic bank account via Razorpay.

**Key Settlement Guidelines:**
- **Gateway Management:** Settlement timelines and payout schedules are managed directly by Razorpay.
- **Standard Domestic Settlement:** For most domestic merchants, the standard settlement schedule is generally **T+2 working days** after successful payment capture.
- **Settlement Timelines Notice:** Settlement timelines depend on Razorpay's applicable settlement schedule. Craviti does NOT promise or guarantee exact payout hours, daily cutoffs, or fixed turnaround guarantees (such as daily payouts or 48-hour guaranteed transfers).

**Factors Influencing Settlement Timelines:**
Actual settlement timing may vary based on:
1. **Merchant Verification:** Completion of merchant KYC, active bank account validation, and compliance checks.
2. **Banking Holidays & Weekends:** Non-working banking days, RBI clearing holidays, and bank operational schedules.
3. **Regulatory Requirements:** Compliance with Reserve Bank of India (RBI) settlement directives and merchant guidelines.
4. **Risk & Fraud Reviews:** Periodic risk assessments, abnormal transaction spikes, or fraud review holds.
5. **Razorpay Policies:** Specific settlement schedules assigned by Razorpay according to merchant risk profile and category.
        `,
      },
      {
        id: 'invoicing-disputes',
        title: '5. Invoicing, Taxes & Chargebacks',
        content: `
- **Tax Invoices & Receipts:** Upon successful payment capture, Craviti generates a timestamped digital invoice containing itemized menu selections, applicable GST breakdown (CGST/SGST/IGST), restaurant details, and transaction reference numbers.
- **Chargebacks & Disputes:** Any chargeback requests or payment disputes filed with card-issuing banks or UPI providers are handled through Razorpay's standard dispute resolution procedures. Merchants are notified via the Craviti Admin & Restaurant portals to supply supporting order fulfillment records.
        `,
      },
      {
        id: 'faq',
        title: '6. Frequently Asked Questions (FAQ)',
        content: `
**Q: How are payments processed?**
Payments are processed securely through Razorpay, an RBI-authorized payment aggregator. Guests scan the table QR code, browse dishes, and initiate payment on mobile. Payment authorization triggers an automated cryptographic confirmation back to Craviti, instantaneously alerting the kitchen and billing counters.

**Q: Does Craviti store my card details?**
No. Craviti never stores sensitive card or banking credentials. We do not store card numbers, CVVs, UPI PINs, net banking passwords, or OTPs. All payment transactions and credential processing are encrypted end-to-end and handled securely by Razorpay.

**Q: When does the restaurant receive payment?**
Captured customer payments settle directly into the restaurant's verified domestic bank account via Razorpay. For most domestic merchants, the standard settlement schedule is generally T+2 working days after successful payment capture, subject to banking holidays, KYC status, and Razorpay settlement policies.

**Q: Which payment methods are supported?**
We support all major Indian digital payment modes including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit Cards, Debit Cards, Net Banking across 50+ banks, and certified digital wallets.

**Q: How are refunds processed?**
Refunds are initiated following review and approval by the restaurant establishment. Once approved, the refund is processed securely through Razorpay directly back to the customer's original payment source. Refund completion timing depends on the customer's bank, payment method, and interbank clearing cycles.
        `,
      },
    ],
  },
  'cancellation-policy': {
    title: 'Cancellation Policy',
    slug: 'cancellation-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Details on how to cancel your Craviti restaurant subscription, export your historical records, and deactivate your account cleanly without hidden penalties.',
    sections: [
      {
        id: 'how-to-cancel',
        title: '1. How to Cancel Your Subscription',
        content: `
You can cancel your subscription at any time directly through the Restaurant Settings portal under the "Subscriptions & Billing" tab, or by emailing billing@craviti.com with your restaurant identifier. No phone calls or retention interrogation required.
        `,
      },
      {
        id: 'access-upon-cancellation',
        title: '2. Access Following Cancellation',
        content: `
Upon initiating cancellation, your restaurant remains fully operational until the end of your current paid billing period. Diners can continue to scan QR codes and place orders until that cycle concludes.
        `,
      },
      {
        id: 'data-export-retention',
        title: '3. Data Export & Account Retention',
        content: `
We provide a 30-day grace period following subscription expiration during which you can download complete historical sales reports, menu catalogs, and tax receipts via our Export Center. After 90 days of inactivity, account data is scheduled for secure purging.
        `,
      },
    ],
  },
  'shipping-policy': {
    title: 'Shipping & Delivery Policy',
    slug: 'shipping-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Information on how digital software subscriptions, table QR code placards, and physical onboarding collateral are fulfilled, dispatched, and delivered by Craviti.',
    sections: [
      {
        id: 'digital-services-fulfillment',
        title: '1. Electronic Software Delivery',
        content: `
Craviti is primarily a Software-as-a-Service (SaaS) cloud platform. Access to all purchased digital products, including the Restaurant Dashboard, Digital QR Ordering menus, Kitchen Display Systems, and Business Analytics, is provisioned immediately upon account activation or successful online subscription verification. No physical shipping is required to utilize core software services.
        `,
      },
      {
        id: 'physical-qr-stands-shipping',
        title: '2. Physical QR Table Stands & Placards',
        content: `
For hospitality partners requesting physical custom-engraved acrylic or metallic QR table placards, orders are processed and customized within 2 to 3 business days of menu finalization. Shipments are dispatched through reputable domestic courier and express cargo partners (e.g., Blue Dart, Delhivery, DTDC).
        `,
      },
      {
        id: 'delivery-timelines',
        title: '3. Estimated Delivery Timelines',
        content: `
- **Tier 1 & Metro Cities:** 3 to 5 business days from dispatch.
- **Tier 2 & Tier 3 Cities:** 5 to 7 business days from dispatch.
- **Remote / Special Regions (e.g., North-East, Island territories):** 7 to 10 business days from dispatch.
Estimated timelines may be subject to operational courier delays, public holidays, or adverse weather conditions.
        `,
      },
      {
        id: 'order-tracking',
        title: '4. Shipment Tracking',
        content: `
Once physical merchandise or placards are handed over to the courier partner, an automated dispatch notification containing the courier tracking airway bill (AWB) number and live tracking link will be sent to the merchant's registered email address and phone number.
        `,
      },
      {
        id: 'damaged-shipments',
        title: '5. Transit Damages & Replacements',
        content: `
In the rare event that custom table placards or physical collateral arrive damaged, chipped, or defective during courier transit, please report the issue with photographic proof to contactcraviti@gmail.com within 48 hours of delivery receipt. Craviti will re-manufacture and dispatch replacement units at zero additional charge.
        `,
      },
    ],
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Explanation of how Craviti uses essential, analytical, and functional cookies to ensure smooth, responsive dining experiences.',
    sections: [
      {
        id: 'what-are-cookies',
        title: '1. What Are Cookies and Local Storage',
        content: `
Cookies and browser LocalStorage are small data files stored on your device that enable our web application to recognize your session, remember table assignments, and preserve active shopping cart items during dining sessions.
        `,
      },
      {
        id: 'types-of-cookies-we-use',
        title: '2. Categories of Cookies We Use',
        content: `
- **Strictly Essential Cookies:** Necessary for order processing, table session security, CSRF protection, and payment routing. These cannot be disabled.
- **Functional Cookies:** Remember your volume preferences for kitchen acoustic chimes, active language selection, and theme settings.
- **Performance & Diagnostic Cookies:** Aggregate telemetry on page load speeds and API latencies to help our engineering team resolve bottlenecks.
        `,
      },
      {
        id: 'managing-cookies',
        title: '3. Managing Your Cookie Preferences',
        content: `
You can manage or disable non-essential cookies through your browser settings. Please note that disabling local storage may prevent guest shopping cart persistence between mobile browser tab refreshes.
        `,
      },
    ],
  },
  'data-processing-agreement': {
    title: 'Data Processing Agreement (DPA)',
    slug: 'data-processing-agreement',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Our Data Processing Agreement regulates the processing of personal data by Craviti on behalf of restaurant merchants in compliance with global data privacy regulations.',
    sections: [
      {
        id: 'scope-and-roles',
        title: '1. Scope & Relationship of Parties',
        content: `
For the purposes of processing diner personal data (names, contact numbers, table orders), the Restaurant Merchant acts as the Data Controller, and Craviti Technologies Private Limited acts as the Data Processor.
        `,
      },
      {
        id: 'processor-obligations',
        title: '2. Processor Obligations',
        content: `
Craviti agrees to:
- Process customer personal data solely upon documented instructions from the Merchant.
- Implement bank-grade technical and organizational security controls to protect against unauthorized access or breaches.
- Ensure that all personnel authorized to handle merchant data are bound by formal confidentiality obligations.
- Assist the Controller in responding to data subject access, rectification, or erasure requests.
        `,
      },
      {
        id: 'sub-processors',
        title: '3. Sub-Processors',
        content: `
The Controller provides general authorization for Craviti to engage certified sub-processors including Razorpay, AWS India, and Cloudinary for specific processing activities under equivalent data protection terms.
        `,
      },
    ],
  },
  'security-policy': {
    title: 'Security Policy',
    slug: 'security-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Comprehensive overview of Craviti technical architecture, encryption protocols, access controls, and compliance certifications.',
    sections: [
      {
        id: 'encryption-standards',
        title: '1. Encryption & Data Protection',
        content: `
- **In Transit:** All communication between mobile guests, kitchen terminals, admin dashboards, and our API servers is protected by TLS 1.3 with HSTS enabled.
- **At Rest:** Database volumes and digital document repositories utilize AES-256 encryption. Sensitive bank details and webhook secrets are stored in encrypted environment vaults.
        `,
      },
      {
        id: 'tenant-isolation',
        title: '2. Strict Multi-Tenant Isolation',
        content: `
Craviti backend architecture enforces strict tenant isolation on every database query. Restaurant IDs are validated through cryptographically signed JWT tokens, preventing cross-tenant data leakage or horizontal privilege escalation.
        `,
      },
      {
        id: 'vulnerability-management',
        title: '3. Vulnerability Disclosure & Audits',
        content: `
We conduct regular third-party penetration testing, static code analysis, and automated dependency vulnerability scans. If you identify a potential security vulnerability, please contact our security team at security@craviti.com.
        `,
      },
    ],
  },
  'customer-terms': {
    title: 'Customer Terms of Use',
    slug: 'customer-terms',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Terms governing patrons and diners who scan Craviti QR codes to view menus, place orders, and pay bills at partner restaurants.',
    sections: [
      {
        id: 'table-ordering-rules',
        title: '1. Table Ordering & Contract of Sale',
        content: `
When you submit an order through the Craviti web interface at a partner establishment, you enter into a direct contract of sale with that specific restaurant. The restaurant is solely responsible for food preparation, ingredient sourcing, and physical service.
        `,
      },
      {
        id: 'payments-receipts',
        title: '2. Payment Settlement & Digital Receipts',
        content: `
Online payments are processed securely through certified gateway partner Razorpay. Upon completion of payment, a tamper-proof digital PDF receipt is generated with timestamped itemization and applicable GST details.
        `,
      },
    ],
  },
  'acceptable-use-policy': {
    title: 'Acceptable Use Policy (AUP)',
    slug: 'acceptable-use-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Rules and guidelines defining prohibited activities across the Craviti network and restaurant portals.',
    sections: [
      {
        id: 'prohibited-activities',
        title: '1. Prohibited Activities',
        content: `
Users and merchants may not:
- Upload malicious payloads, scripts, or offensive imagery into restaurant menu catalogs.
- Attempt to flood or launch denial-of-service (DDoS) attacks against kitchen WebSocket channels.
- Intercept, spoof, or manipulate digital QR codes to redirect diner traffic to unauthorized sites.
- Submit fraudulent bank documents or misrepresent corporate identity.
        `,
      },
    ],
  },
  'disclaimer': {
    title: 'Disclaimer',
    slug: 'disclaimer',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Legal disclaimers regarding food allergen representations, network connectivity, and third-party payment gateway operations.',
    sections: [
      {
        id: 'allergen-disclaimer',
        title: '1. Allergen & Ingredient Disclaimers',
        content: `
While Craviti offers digital tagging tools for vegan, vegetarian, gluten-free, nut-free, and halal items, the accuracy of all menu descriptions and ingredient cross-contamination precautions is the sole responsibility of the individual restaurant kitchen.
        `,
      },
    ],
  },
  'gdpr': {
    title: 'GDPR Compliance Statement',
    slug: 'gdpr',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Our adherence to General Data Protection Regulation (GDPR) standards for international guests and dining visitors.',
    sections: [
      {
        id: 'data-subject-rights',
        title: '1. Rights of European Data Subjects',
        content: `
In compliance with Regulation (EU) 2016/679, visitors enjoy rights of access, rectification, erasure ("right to be forgotten"), restriction of processing, and data portability. Contact dpo@craviti.com to submit requests.
        `,
      },
    ],
  },
  'ccpa': {
    title: 'CCPA / CPRA Privacy Notice',
    slug: 'ccpa',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Information for California residents regarding data collection, consumer rights, and our strict "Do Not Sell My Personal Information" pledge.',
    sections: [
      {
        id: 'california-consumer-rights',
        title: '1. California Consumer Rights',
        content: `
Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California residents may request disclosure of categories of personal information collected. Craviti does NOT sell personal data or dining history.
        `,
      },
    ],
  },
};

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FinancialMessageDetector } from '../../src/services/smartExpense/FinancialMessageDetector.js';
import { AmountParser } from '../../src/services/smartExpense/AmountParser.js';
import { MerchantNormalizer } from '../../src/services/smartExpense/MerchantNormalizer.js';
import { ExpenseCategoryEngine } from '../../src/services/smartExpense/ExpenseCategoryEngine.js';
import { TransactionDuplicateDetector } from '../../src/services/smartExpense/TransactionDuplicateDetector.js';
import { TransactionParser } from '../../src/services/smartExpense/TransactionParser.js';

describe('Smart Expense Engine Unit Tests', () => {
  describe('FinancialMessageDetector', () => {
    it('identifies valid financial debit messages', () => {
      const msg = 'Dear SBI User, your A/c ending 4102 debited by Rs 450.00 on 17-Sep-26 by UPI to Swiggy. Ref: 426189012345';
      assert.strictEqual(FinancialMessageDetector.isFinancialMessage(msg), true);
    });

    it('rejects OTP messages', () => {
      const msg = 'Your OTP for transaction of INR 500 at Amazon is 782190. Do not share OTP with anyone.';
      assert.strictEqual(FinancialMessageDetector.isFinancialMessage(msg), false);
    });

    it('rejects marketing and promotional spam', () => {
      const msg = 'Get up to 50% discount on clothing with your HDFC Credit Card. Shop now at https://promo.link';
      assert.strictEqual(FinancialMessageDetector.isFinancialMessage(msg), false);
    });
  });

  describe('AmountParser', () => {
    it('correctly extracts amounts in Rs, INR, and ₹ formats', () => {
      assert.strictEqual(AmountParser.parse('Debited with Rs 1,450.50 at Cafe')?.amount, 1450.5);
      assert.strictEqual(AmountParser.parse('Paid INR 250 to Star Auto')?.amount, 250);
      assert.strictEqual(AmountParser.parse('Sent ₹3,500.00 to Landlord')?.amount, 3500);
    });
  });

  describe('MerchantNormalizer', () => {
    it('cleans messy VPAs and transaction strings', () => {
      assert.strictEqual(MerchantNormalizer.normalize('swiggy.pay@icici').normalized, 'Swiggy');
      assert.strictEqual(MerchantNormalizer.normalize('ZOMATO-ONLINE-DELHI').normalized, 'Zomato');
      assert.strictEqual(MerchantNormalizer.normalize('uber.india@hdfcbank').normalized, 'Uber');
      assert.strictEqual(MerchantNormalizer.normalize('AMAZON RETAIL INDIA PVT').normalized, 'Amazon');
      assert.strictEqual(MerchantNormalizer.normalize('BLINKIT COMMERCE PVT').normalized, 'Blinkit');
    });
  });

  describe('ExpenseCategoryEngine', () => {
    it('infers accurate categories with high confidence', () => {
      const catSwiggy = ExpenseCategoryEngine.suggestCategory('Swiggy', 'UPI payment to Swiggy');
      assert.strictEqual(catSwiggy.category, 'Food & Dining');
      assert.ok(catSwiggy.confidence >= 0.85);

      const catUber = ExpenseCategoryEngine.suggestCategory('Uber', 'Cab fare');
      assert.strictEqual(catUber.category, 'Transport');

      const catBlinkit = ExpenseCategoryEngine.suggestCategory('Blinkit', 'Groceries delivery');
      assert.strictEqual(catBlinkit.category, 'Groceries');

      const catNetflix = ExpenseCategoryEngine.suggestCategory('Netflix', 'Monthly streaming fee');
      assert.strictEqual(catNetflix.category, 'Entertainment');
    });
  });

  describe('TransactionDuplicateDetector', () => {
    it('detects duplicates by reference number', () => {
      const existing = [
        {
          id: 'tx-1',
          transactionReference: 'REF12345678',
          amount: 500,
          merchantNormalized: 'Swiggy',
          transactionDateTime: new Date().toISOString(),
          rawSourceHash: 'hash-abc',
        } as any,
      ];

      const res = TransactionDuplicateDetector.isDuplicate(
        { transactionReference: 'REF12345678', amount: 500, merchantNormalized: 'Swiggy' } as any,
        existing
      );
      assert.strictEqual(res.isDuplicate, true);
    });

    it('detects duplicates by amount, merchant, and time proximity', () => {
      const now = new Date();
      const existing = [
        {
          id: 'tx-2',
          amount: 320,
          merchantNormalized: 'Zomato',
          transactionDateTime: now.toISOString(),
          rawSourceHash: 'hash-1',
        } as any,
      ];

      const duplicateWithin1Min = {
        amount: 320,
        merchantNormalized: 'Zomato',
        transactionDateTime: new Date(now.getTime() + 30000).toISOString(),
        rawSourceHash: 'hash-2',
      } as any;

      const res = TransactionDuplicateDetector.isDuplicate(duplicateWithin1Min, existing);
      assert.strictEqual(res.isDuplicate, true);
    });
  });

  describe('TransactionParser', () => {
    it('parses typical Indian bank SMS formats', () => {
      const sbiSms = 'Dear SBI User, your A/c ending 4102 debited by Rs 450.00 on 17-Sep-26 by UPI to Swiggy. Ref: 426189012345';
      const parsed = TransactionParser.parse(sbiSms, 'SMS');

      assert.ok(parsed);
      assert.strictEqual(parsed?.amount, 450);
      assert.strictEqual(parsed?.merchantNormalized, 'Swiggy');
      assert.strictEqual(parsed?.accountLast4, '4102');
      assert.strictEqual(parsed?.categorySuggested, 'Food & Dining');
      assert.strictEqual(parsed?.transactionReference, '426189012345');
    });

    it('parses Airtel Payments Bank debited SMS format', () => {
      const airtelSms = 'Rs. 20.00 debited from Airtel Payments Bank a/c Txn ID 196731152570 Bal:9547.53 Call 180023400 for help';
      const parsed = TransactionParser.parse(airtelSms);

      assert.ok(parsed, 'Should parse Airtel SMS');
      assert.strictEqual(parsed?.amount, 20);
      assert.strictEqual(parsed?.direction, 'DEBIT');
      assert.strictEqual(parsed?.transactionReference, '196731152570');
    });
  });
});

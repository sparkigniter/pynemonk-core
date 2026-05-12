-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Accounting Module — Standard School Seeder
-- Purpose: Populates a standard Chart of Accounts for ALL tenants.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    r_tenant RECORD;
    v_type_asset INT := (SELECT id FROM accounting.account_type WHERE name = 'Asset');
    v_type_liability INT := (SELECT id FROM accounting.account_type WHERE name = 'Liability');
    v_type_equity INT := (SELECT id FROM accounting.account_type WHERE name = 'Equity');
    v_type_revenue INT := (SELECT id FROM accounting.account_type WHERE name = 'Revenue');
    v_type_expense INT := (SELECT id FROM accounting.account_type WHERE name = 'Expense');
    
    v_parent_assets INT;
    v_parent_bank INT;
    v_parent_liabilities INT;
    v_parent_equity INT;
    v_parent_revenue INT;
    v_parent_expenses INT;

    v_coa_bank_id INT;
    v_coa_cash_id INT;
    v_coa_ar_id INT;
    v_coa_ap_id INT;
    v_coa_salary_payable_id INT;
    v_coa_tuition_id INT;
    v_coa_admission_id INT;
    v_coa_revenue_gen_id INT;
    v_coa_salary_expense_id INT;
    v_coa_retained_earnings_id INT;
BEGIN
    FOR r_tenant IN (SELECT id, slug FROM auth.tenant) LOOP
        RAISE NOTICE 'Seeding accounting data for tenant: % (%)', r_tenant.slug, r_tenant.id;

        -- 1. Asset Groups & Accounts
        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group)
        VALUES (r_tenant.id, '1000', 'Current Assets', v_type_asset, TRUE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_parent_assets;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '1100', 'Cash & Bank', v_type_asset, v_parent_assets, TRUE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_parent_bank;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '1110', 'Main Operating Bank', v_type_asset, v_parent_bank, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_bank_id;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '1130', 'Petty Cash', v_type_asset, v_parent_bank, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_cash_id;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '1200', 'Accounts Receivable (Fees)', v_type_asset, v_parent_assets, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_ar_id;

        -- 2. Liability Groups & Accounts
        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group)
        VALUES (r_tenant.id, '2000', 'Current Liabilities', v_type_liability, TRUE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_parent_liabilities;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '2100', 'Accounts Payable', v_type_liability, v_parent_liabilities, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_ap_id;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '2200', 'Salary Payable', v_type_liability, v_parent_liabilities, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_salary_payable_id;

        -- 3. Equity Groups & Accounts
        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group)
        VALUES (r_tenant.id, '3000', 'Equity & Capital', v_type_equity, TRUE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_parent_equity;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '3100', 'Retained Earnings', v_type_equity, v_parent_equity, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_retained_earnings_id;

        -- 4. Revenue Groups & Accounts
        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group)
        VALUES (r_tenant.id, '4000', 'School Revenue', v_type_revenue, TRUE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_parent_revenue;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '4100', 'Tuition Fees', v_type_revenue, v_parent_revenue, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_tuition_id;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '4200', 'Admission Fees', v_type_revenue, v_parent_revenue, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_admission_id;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '4300', 'General Revenue / Sales', v_type_revenue, v_parent_revenue, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_revenue_gen_id;

        -- 5. Expense Groups & Accounts
        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group)
        VALUES (r_tenant.id, '5000', 'Operational Expenses', v_type_expense, TRUE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_parent_expenses;

        INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group)
        VALUES (r_tenant.id, '5100', 'Teacher Salaries', v_type_expense, v_parent_expenses, FALSE)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_coa_salary_expense_id;

        -- 6. System Mappings
        INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id)
        VALUES 
            (r_tenant.id, 'ASSET_CASH', v_coa_cash_id),
            (r_tenant.id, 'ASSET_BANK', v_coa_bank_id),
            (r_tenant.id, 'ASSET_RECEIVABLE', v_coa_ar_id),
            (r_tenant.id, 'REV_ADMISSION', v_coa_admission_id),
            (r_tenant.id, 'REV_TUITION', v_coa_tuition_id),
            (r_tenant.id, 'REV_GENERAL', v_coa_revenue_gen_id),
            (r_tenant.id, 'EXP_SALARY', v_coa_salary_expense_id),
            (r_tenant.id, 'LIAB_PAYABLE', v_coa_ap_id),
            (r_tenant.id, 'LIAB_SALARY_PAYABLE', v_coa_salary_payable_id),
            (r_tenant.id, 'EQUITY_RETAINED_EARNINGS', v_coa_retained_earnings_id)
        ON CONFLICT (tenant_id, mapping_key) DO UPDATE SET account_id = EXCLUDED.account_id;

        -- 7. Register Bank Accounts
        INSERT INTO accounting.bank_account (tenant_id, name, bank_name, account_no, gl_account_id, opening_balance)
        VALUES (r_tenant.id, 'School Main Account', 'National Education Bank', '9988776655', v_coa_bank_id, 250000.00)
        ON CONFLICT DO NOTHING;

        -- Only add realistic samples for demo-like tenants
        IF r_tenant.slug IN ('demo', 'school-1') THEN
            DECLARE
                v_vendor_id INT;
                v_academic_year_id INT := (SELECT id FROM school.academic_year WHERE tenant_id = r_tenant.id LIMIT 1);
                v_student_id INT := (SELECT id FROM school.student WHERE tenant_id = r_tenant.id LIMIT 1);
                v_installment_id INT;
            BEGIN
                IF v_academic_year_id IS NULL THEN v_academic_year_id := (SELECT id FROM school.academic_year LIMIT 1); END IF;
                IF v_student_id IS NULL THEN v_student_id := (SELECT id FROM school.student LIMIT 1); END IF;

                INSERT INTO accounting.vendor (tenant_id, name, contact_person, email, phone)
                VALUES (r_tenant.id, 'Global Book House', 'John Doe', 'sales@globalbooks.com', '555-0101')
                ON CONFLICT DO NOTHING;

                v_vendor_id := (SELECT id FROM accounting.vendor WHERE name = 'Global Book House' AND tenant_id = r_tenant.id LIMIT 1);

                INSERT INTO accounting.vendor_bill (tenant_id, vendor_id, bill_no, bill_date, due_date, total_amount, paid_amount, status)
                VALUES (r_tenant.id, v_vendor_id, 'BILL-9001', CURRENT_DATE - 10, CURRENT_DATE + 20, 12500.00, 0, 'open')
                ON CONFLICT DO NOTHING;

                INSERT INTO accounting.fee_installment (tenant_id, academic_year_id, name, due_date)
                VALUES (r_tenant.id, v_academic_year_id, 'Term 1 2025', CURRENT_DATE + 30)
                ON CONFLICT DO NOTHING;

                v_installment_id := (SELECT id FROM accounting.fee_installment WHERE tenant_id = r_tenant.id LIMIT 1);

                IF v_student_id IS NOT NULL AND v_installment_id IS NOT NULL THEN
                    INSERT INTO accounting.fee_invoice (tenant_id, invoice_no, student_id, academic_year_id, installment_id, total_amount, net_amount, paid_amount, due_amount, status, due_date)
                    VALUES (r_tenant.id, 'INV-2025-001', v_student_id, v_academic_year_id, v_installment_id, 4500.00, 4500.00, 0, 4500.00, 'unpaid', CURRENT_DATE + 30)
                    ON CONFLICT DO NOTHING;
                END IF;

                -- Sample Bank Transactions
                DECLARE
                    v_actual_bank_id INT := (SELECT id FROM accounting.bank_account WHERE tenant_id = r_tenant.id AND gl_account_id = v_coa_bank_id LIMIT 1);
                BEGIN
                    IF v_actual_bank_id IS NOT NULL THEN
                        INSERT INTO accounting.bank_transaction (tenant_id, bank_account_id, transaction_date, description, amount, type, reference_no)
                        VALUES 
                            (r_tenant.id, v_actual_bank_id, CURRENT_DATE - 1, 'External Deposit: FEE-TERM1-992', 4500.00, 'credit', 'TXN-001'),
                            (r_tenant.id, v_actual_bank_id, CURRENT_DATE - 2, 'Vendor Payment: Apex Utility Corp', 1200.00, 'debit', 'TXN-002'),
                            (r_tenant.id, v_actual_bank_id, CURRENT_DATE - 3, 'ATM Withdrawal: Petty Cash Refresh', 500.00, 'debit', 'TXN-003')
                        ON CONFLICT DO NOTHING;
                    END IF;
                END;

                -- Sample Journal Entries
                DECLARE
                    v_journal_id INT;
                BEGIN
                    INSERT INTO accounting.journal_entry (tenant_id, entry_date, description, reference_no)
                    VALUES (r_tenant.id, CURRENT_DATE - 2, 'Monthly Tuition Fee Collection', 'FEE-BATCH-1')
                    RETURNING id INTO v_journal_id;

                    INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit)
                    VALUES (r_tenant.id, v_journal_id, v_coa_bank_id, 142500.00, 0), (r_tenant.id, v_journal_id, v_coa_tuition_id, 0, 142500.00);
                END;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE 'Accounting data seeded successfully for all tenants.';
END $$;

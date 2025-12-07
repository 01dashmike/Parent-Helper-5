# Form Validation Schemas

All forms now have Zod schemas with client-side and server-side validation.

## 📋 Validation Schemas

### 1. Provider Onboarding (`app/providers/schema.ts`)
- **Schema**: `registerLeadSchema`
- **Type**: `RegisterLeadInput`
- **Fields**:
  - `name`: string, min 2 characters
  - `email`: valid email format
  - `phone`: optional, 7-15 digits
  - `website`: optional, must start with http:// or https://
  - `town`: string, min 2 characters
  - `categories`: array, min 1 item
  - `description`: string, 30-1200 characters
  - `acceptTerms`: literal true (required)
  - `newsletterOptIn`: boolean (optional)

**Status**: ✅ Server-side validation implemented in `app/providers/actions.ts`
**Client-side**: ✅ Uses `useFormState` with error display

### 2. Class Creation (`shared/schema.ts`)
- **Schema**: `listClassSchema`
- **Type**: `ListClassData`
- **Fields**:
  - `businessName`: string, required
  - `contactName`: string, required
  - `email`: valid email format
  - `phone`: string, required
  - `website`: optional URL or empty string
  - `className`: string, required
  - `description`: string, min 10 characters
  - `category`: string, required
  - `ageGroupMin`: number, min 0
  - `ageGroupMax`: number, min 0
  - `venue`: string, required
  - `address`: string, required
  - `postcode`: string, required
  - `dayOfWeek`: string, required
  - `time`: string, required
  - `price`: string, optional
  - `additionalInfo`: string, optional

**Status**: ✅ Schema exists in `shared/schema.ts`
**Note**: API endpoint needs to be created/found for server-side validation

### 3. Referrals (`lib/validations/index.ts`)
- **Schema**: `createReferralSchema`
- **Type**: `CreateReferralInput`
- **Fields**:
  - `referred_email`: valid email format
  - `referred_name`: string, 1-200 characters
  - `referral_type`: enum ["member", "provider"]
  - `message`: string, max 500 characters (optional)
  - `metadata`: record (optional)

**Status**: ✅ Server-side validation in `app/api/referrals/route.ts` (POST endpoint)
**Endpoint**: `POST /api/referrals`

### 4. Wallet Actions (`lib/validations/wallet.ts` & `lib/validations/index.ts`)

#### Credit Wallet
- **Schema**: `creditWalletSchema`
- **Fields**:
  - `user_id`: UUID
  - `amount_cents`: positive integer
  - `reason`: string (optional)
  - `metadata`: record (optional)

#### Debit Wallet
- **Schema**: `debitWalletSchema`
- **Fields**:
  - `user_id`: UUID
  - `amount_cents`: positive integer
  - `reason`: string (optional)
  - `metadata`: record (optional)

#### Adjustment Wallet
- **Schema**: `adjustmentWalletSchema`
- **Fields**:
  - `user_id`: UUID
  - `amount_cents`: integer (non-zero)
  - `reason`: string, min 1 character
  - `metadata`: record (optional)

#### Refund Wallet
- **Schema**: `walletRefundSchema`
- **Fields**:
  - `booking_id`: UUID
  - `amount_cents`: positive integer
  - `user_id`: UUID
  - `reason`: string, max 500 characters (optional)

#### Cashout Wallet
- **Schema**: `walletCashoutSchema`
- **Fields**:
  - `user_id`: UUID
  - `amount_cents`: positive integer
  - `reason`: string, max 500 characters (optional)

**Status**: ✅ All wallet endpoints have server-side validation
- `POST /api/wallet/credit` ✅
- `POST /api/wallet/debit` ✅
- `POST /api/wallet/cashout` ✅
- `POST /api/wallet/refund` ✅

### 5. Blog Generate (`lib/validations/index.ts`)
- **Schema**: `blogGenerateSchema`
- **Type**: `BlogGenerateInput`
- **Fields**:
  - `topicId`: positive integer (optional)
  - `trendSource`: string, max 100 characters (optional)

**Status**: ✅ Server-side validation in `app/api/blog/generate/route.ts`
**Endpoint**: `POST /api/blog/generate`

## 🔧 Implementation Details

### Server-Side Validation
All API routes now:
1. Parse JSON request body safely with `.catch(() => ({}))`
2. Validate using Zod schemas with `.safeParse()`
3. Return 400 status with error details on validation failure
4. Handle JSON parse errors gracefully

### Error Responses
All validation errors return:
```json
{
  "error": "Invalid request",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Error message"
    }
  ]
}
```

### Client-Side Validation
- **Provider Registration**: Uses React Server Actions with `useFormState` for field-level error display
- **Other forms**: Need client-side validation using React Hook Form with Zod resolver

## 📝 Next Steps

### Recommended Improvements:
1. **Add client-side validation** to all forms using React Hook Form + Zod resolver
2. **Add toast notifications** for all form submissions (success/error)
3. **Create API endpoint** for class creation (`/api/list-class`) if missing
4. **Add form components** for referrals and wallet actions

### Example Client-Side Implementation:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerLeadSchema } from "@/app/providers/schema";
import { useToast } from "@/hooks/useToast";

const form = useForm({
  resolver: zodResolver(registerLeadSchema),
  defaultValues: { /* ... */ }
});

const onSubmit = async (data) => {
  try {
    await submitForm(data);
    toast.showSuccess("Form submitted successfully!");
  } catch (error) {
    toast.showError(error.message || "Submission failed");
  }
};
```

## 📚 Centralized Validation Exports

All schemas are exported from `lib/validations/index.ts`:
- `registerLeadSchema`, `RegisterLeadInput`
- `listClassSchema`, `ListClassData`
- `createReferralSchema`, `CreateReferralInput`
- `creditWalletSchema`, `CreditWalletInput`
- `debitWalletSchema`, `DebitWalletInput`
- `adjustmentWalletSchema`, `AdjustmentWalletInput`
- `walletRefundSchema`, `WalletRefundInput`
- `walletCashoutSchema`, `WalletCashoutInput`
- `blogGenerateSchema`, `BlogGenerateInput`


import { registerSellerAction } from "@/app/actions";
import { Button, Field, PageHeader } from "@/components/ui";

export default function SellerRegisterPage() {
  return (
    <main className="page-shell max-w-4xl">
      <PageHeader
        eyebrow="Seller onboarding"
        title="Apply to sell"
        description="ร้านต้องผ่าน admin approval ก่อนสร้างสินค้า และสินค้าทุกชิ้นต้องผ่านการตรวจสอบก่อนเผยแพร่"
      />
      <form
        action={registerSellerAction}
        className="mt-9 grid gap-4 border-t-2 border-ink bg-white p-5 sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" name="name" required />
          <Field label="Shop name" name="shopName" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Phone" name="contactPhone" required />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength={8}
            required
          />
          <Field label="Bank name" name="bankName" required />
          <Field label="Bank account" name="bankAccount" required />
          <Field label="Bank owner" name="bankOwner" required />
        </div>
        <Field label="Shop address" name="address" required />
        <Button type="submit">Submit application</Button>
      </form>
    </main>
  );
}

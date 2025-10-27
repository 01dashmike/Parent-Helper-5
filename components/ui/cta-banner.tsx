import { Button } from "./button";

export function CtaBanner() {
  return (
    <section className="bg-gradient-to-br from-teal via-teal-dark to-coral text-white rounded-3xl p-10 text-center shadow-lg">
      <h2 className="text-3xl font-bold mb-3">Join the Parent Helper community</h2>
      <p className="text-teal-50 mb-6 max-w-xl mx-auto">
        Connect with local families, discover classes, and get exclusive offers directly to your inbox.
      </p>
      <Button size="lg" className="bg-white text-teal hover:bg-teal-100">
        Sign up for free →
      </Button>
    </section>
  );
}

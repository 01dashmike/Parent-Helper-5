import type { Metadata } from "next";
import { MotionH1 } from "@/components/motion/MotionH1";
import MotionSection from "@/components/motion/MotionSection";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Parent Helper",
  description:
    "Get in touch with Parent Helper. We're here to help with questions about bookings, classes, provider inquiries, and more.",
};

export default function ContactPage() {
  return (
    <>
      <MotionSection className="bg-cream py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <MotionH1 className="text-4xl md:text-5xl font-bold text-teal-dark mb-4">
              Get In Touch
            </MotionH1>
            <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
              Have a question or need help? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="bg-white rounded-card shadow-md p-6 md:p-8">
            <ContactForm />
          </div>
        </div>
      </MotionSection>
    </>
  );
}

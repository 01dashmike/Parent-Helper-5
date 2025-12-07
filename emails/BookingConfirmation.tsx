import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type BookingConfirmationEmailProps = {
  booking: {
    id: number;
    parentFirstName: string;
    parentLastName: string;
    children: Array<{ name: string; age: number }>;
  };
  session: {
    startTime: string;
    endTime: string;
  };
  class: {
    name: string;
    venue: string;
    address: string;
    town: string;
  };
  bookingType: string;
  priceTotal: number;
};

export default function BookingConfirmationEmail({
  booking,
  session,
  class: classData,
  bookingType,
  priceTotal,
}: BookingConfirmationEmailProps) {
  const startDate = new Date(session.startTime);
  const endDate = new Date(session.endTime);

  return (
    <Html>
      <Head />
      <Preview>Your booking for {classData.name} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking Confirmed!</Heading>
          <Text style={text}>
            Hi {booking.parentFirstName},
          </Text>
          <Text style={text}>
            Your booking for <strong>{classData.name}</strong> has been confirmed.
          </Text>

          <Section style={section}>
            <Heading style={h2}>Booking Details</Heading>
            <Text style={text}>
              <strong>Date:</strong> {startDate.toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={text}>
              <strong>Time:</strong> {startDate.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })} - {endDate.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <Text style={text}>
              <strong>Location:</strong> {classData.venue}
              <br />
              {classData.address}, {classData.town}
            </Text>
          </Section>

          <Section style={section}>
            <Heading style={h2}>Children Attending</Heading>
            {booking.children.map((child, i) => (
              <Text key={i} style={text}>
                • {child.name} (age {child.age})
              </Text>
            ))}
          </Section>

          {bookingType !== "free_rsvp" && priceTotal > 0 && (
            <Section style={section}>
              <Text style={text}>
                <strong>Total Paid:</strong> £{priceTotal.toFixed(2)}
              </Text>
            </Section>
          )}

          {bookingType === "free_rsvp" && (
            <Section style={section}>
              <Text style={text}>
                This is a free RSVP. No payment required.
              </Text>
            </Section>
          )}

          <Section style={section}>
            <Text style={text}>
              We look forward to seeing you at the class!
            </Text>
            <Text style={text}>
              If you have any questions, please contact the provider directly.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by Parent Helper. If you have any questions about your booking,
              please contact the class provider.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const h2 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "20px 0 10px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 10px",
};

const section = {
  padding: "20px 0",
  borderTop: "1px solid #e6ebf1",
};

const footer = {
  borderTop: "1px solid #e6ebf1",
  marginTop: "40px",
  paddingTop: "20px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};






import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type BookingReminderEmailProps = {
  booking: {
    parentFirstName: string;
    children: Array<{ name: string }>;
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
};

export default function BookingReminderEmail({
  booking,
  session,
  class: classData,
}: BookingReminderEmailProps) {
  const startDate = new Date(session.startTime);

  return (
    <Html>
      <Head />
      <Preview>Reminder: Your {classData.name} class is tomorrow!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Class Reminder</Heading>
          <Text style={text}>
            Hi {booking.parentFirstName},
          </Text>
          <Text style={text}>
            This is a friendly reminder that your booking for <strong>{classData.name}</strong> is
            tomorrow!
          </Text>

          <Section style={section}>
            <Heading style={h2}>Class Details</Heading>
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
              })}
            </Text>
            <Text style={text}>
              <strong>Location:</strong> {classData.venue}
              <br />
              {classData.address}, {classData.town}
            </Text>
          </Section>

          <Section style={section}>
            <Text style={text}>
              <strong>Children attending:</strong> {booking.children.map((c) => c.name).join(", ")}
            </Text>
          </Section>

          <Section style={section}>
            <Text style={text}>
              We look forward to seeing you tomorrow!
            </Text>
            <Text style={text}>
              If you need to cancel or have any questions, please contact the provider as soon as possible.
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









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
  Button,
} from "@react-email/components";
import * as React from "react";

type BookingReviewRequestEmailProps = {
  booking: {
    parentFirstName: string;
  };
  class: {
    name: string;
    id: number;
  };
  reviewUrl: string;
};

export default function BookingReviewRequestEmail({
  booking,
  class: classData,
  reviewUrl,
}: BookingReviewRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>How was your {classData.name} class?</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>How was your class?</Heading>
          <Text style={text}>
            Hi {booking.parentFirstName},
          </Text>
          <Text style={text}>
            We hope you and your little one enjoyed <strong>{classData.name}</strong>!
          </Text>
          <Text style={text}>
            Your feedback helps other parents find great classes and helps providers improve their
            offerings.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={reviewUrl}>
              Leave a Review
            </Button>
          </Section>

          <Section style={section}>
            <Text style={text}>
              Thank you for being part of the Parent Helper community!
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

const buttonContainer = {
  padding: "27px 0 27px",
};

const button = {
  backgroundColor: "#5F8D4E",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};






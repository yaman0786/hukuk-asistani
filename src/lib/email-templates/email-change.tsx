import * as React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailChangeEmailProps {
  siteName: string;
  oldEmail: string;
  email: string;
  newEmail: string;
  confirmationUrl: string;
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>{siteName} e‑posta değişikliği onayı</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{siteName}</Text>
        </Section>
        <Heading style={h1}>E‑posta değişikliğinizi onaylayın</Heading>
        <Text style={text}>
          {siteName} hesabınızın e‑posta adresini{" "}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{" "}
          adresinden{" "}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>{" "}
          adresine değiştirmek istediniz.
        </Text>
        <Text style={text}>Bu değişikliği onaylamak için düğmeye tıklayın:</Text>
        <Button style={button} href={confirmationUrl}>
          Değişikliği Onayla
        </Button>
        <Text style={footer}>
          Bu değişikliği siz talep etmediyseniz derhal hesabınızın güvenliğini sağlayın.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EmailChangeEmail;

const main = { backgroundColor: "#ffffff", fontFamily: 'Georgia, "Times New Roman", serif' };
const container = { padding: "32px 28px", maxWidth: "560px" };
const brandBar = { borderBottom: "1px solid #e5e7eb", paddingBottom: "16px", marginBottom: "24px" };
const brandText = {
  fontSize: "13px",
  fontWeight: "bold" as const,
  color: "#1e293b",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: 0,
};
const h1 = { fontSize: "24px", fontWeight: "bold" as const, color: "#1e293b", margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 20px" };
const link = { color: "#1e293b", textDecoration: "underline" };
const button = {
  backgroundColor: "#1e293b",
  color: "#ffffff",
  fontSize: "15px",
  borderRadius: "6px",
  padding: "14px 28px",
  textDecoration: "none",
  fontWeight: "bold" as const,
};
const footer = { fontSize: "13px", color: "#64748b", margin: "32px 0 0" };

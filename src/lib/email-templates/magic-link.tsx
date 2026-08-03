import * as React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>{siteName} giriş bağlantınız</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{siteName}</Text>
        </Section>
        <Heading style={h1}>Giriş bağlantınız</Heading>
        <Text style={text}>
          {siteName} hesabınıza giriş yapmak için aşağıdaki düğmeye tıklayın. Bağlantı kısa süre
          içinde geçerliliğini yitirecektir.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Giriş Yap
        </Button>
        <Text style={footer}>
          Bu bağlantıyı siz talep etmediyseniz e‑postayı yok sayabilirsiniz.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

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

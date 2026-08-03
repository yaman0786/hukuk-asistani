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

interface RecoveryEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>{siteName} şifre sıfırlama</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{siteName}</Text>
        </Section>
        <Heading style={h1}>Şifrenizi sıfırlayın</Heading>
        <Text style={text}>
          {siteName} hesabınız için şifre sıfırlama talebi aldık. Yeni bir şifre belirlemek için
          aşağıdaki düğmeye tıklayın.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Şifreyi Sıfırla
        </Button>
        <Text style={footer}>
          Bu talebi siz yapmadıysanız, bu e‑postayı yok sayabilirsiniz. Şifreniz
          değiştirilmeyecektir.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default RecoveryEmail;

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

import * as React from "react";

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

interface ReauthenticationEmailProps {
  token: string;
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>Doğrulama kodunuz</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>Türkiye Hukuk Master AI</Text>
        </Section>
        <Heading style={h1}>Kimliğinizi doğrulayın</Heading>
        <Text style={text}>Aşağıdaki kodu kullanarak kimliğinizi doğrulayın:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Bu kod kısa süre içinde geçersiz olacaktır. Bu isteği siz yapmadıysanız e‑postayı yok
          sayabilirsiniz.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ReauthenticationEmail;

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
const codeStyle = {
  fontFamily: "Courier, monospace",
  fontSize: "28px",
  fontWeight: "bold" as const,
  letterSpacing: "0.2em",
  color: "#1e293b",
  margin: "0 0 30px",
  padding: "16px 20px",
  background: "#f1f5f9",
  borderRadius: "6px",
  display: "inline-block",
};
const footer = { fontSize: "13px", color: "#64748b", margin: "32px 0 0" };

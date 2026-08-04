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

interface SignupEmailProps {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>{siteName} hesabınızı doğrulayın</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{siteName}</Text>
        </Section>
        <Heading style={h1}>E‑postanızı doğrulayın</Heading>
        <Text style={text}>
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>{" "}
          hesabınıza kaydolduğunuz için teşekkürler.
        </Text>
        <Text style={text}>
          Lütfen aşağıdaki düğmeye tıklayarak{" "}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>{" "}
          adresini doğrulayın:
        </Text>
        <Button style={button} href={confirmationUrl}>
          E‑postayı Doğrula
        </Button>
        <Text style={footer}>Bu kaydı siz yapmadıysanız bu e‑postayı yok sayabilirsiniz.</Text>
        <Text style={disclaimer}>
          Hukuk Asistanı, bilgilendirme amaçlı bir hukuki asistandır ve avukatlık hizmeti
          yerine geçmez.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SignupEmail;

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
const disclaimer = {
  fontSize: "11px",
  color: "#94a3b8",
  fontStyle: "italic" as const,
  marginTop: "20px",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "16px",
};

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const senderEmail = body.senderEmail?.trim();
    const senderPassword = body.senderPassword?.trim();
    const recipients = body.recipients;
    const subject = body.subject?.trim();
    const emailBody = body.emailBody?.trim();

    if (
      !senderEmail ||
      !senderPassword ||
      !recipients ||
      !subject ||
      !emailBody
    ) {
      return NextResponse.json(
        {
          error: "All email fields are required.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        {
          error: "At least one recipient is required.",
        },
        { status: 400 }
      );
    }

    // Gmail SMTP connection
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
    });

    // Verify credentials before attempting to send
    await transporter.verify();

    const formattedHtml = convertTextToHtml(emailBody);

    await transporter.sendMail({
      from: senderEmail,
      to: recipients,
      subject,
      text: emailBody,
      html: formattedHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully.",
    });
  } catch (error: any) {
    console.error("Send email error:", error);

    let message = "Failed to send email.";

    if (error?.code === "EAUTH") {
      message =
        "Gmail authentication failed. Check the email address and Gmail App Password.";
    } else if (error?.code === "ECONNECTION") {
      message = "Could not connect to Gmail SMTP.";
    } else if (error?.message) {
      message = error.message;
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

function convertTextToHtml(text: string): string {
  const escaped = escapeHtml(text);

  const lines = escaped.split("\n");

  let html = "";
  let insideList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      if (!insideList) {
        html += "<ul>";
        insideList = true;
      }

      html += `<li>${trimmed.substring(2)}</li>`;
    } else {
      if (insideList) {
        html += "</ul>";
        insideList = false;
      }

      if (trimmed === "") {
        html += "<br>";
      } else {
        html += `<p>${trimmed}</p>`;
      }
    }
  }

  if (insideList) {
    html += "</ul>";
  }

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
${html}
</body>
</html>
`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
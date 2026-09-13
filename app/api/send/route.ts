import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const senderEmail = String(formData.get("senderEmail") || "").trim();
    const senderPassword = String(
      formData.get("senderPassword") || ""
    ).trim();

    const subject = String(formData.get("subject") || "").trim();
    const emailBody = String(formData.get("emailBody") || "").trim();

    const recipientsRaw = String(
      formData.get("recipients") || ""
    ).trim();

    const attachment = formData.get("attachment");

    if (
      !senderEmail ||
      !senderPassword ||
      !subject ||
      !emailBody ||
      !recipientsRaw
    ) {
      return NextResponse.json(
        {
          error: "Sender, recipients, subject and email body are required.",
        },
        { status: 400 }
      );
    }

    const recipients = recipientsRaw
      .split(/[,\n;]/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          error: "At least one recipient is required.",
        },
        { status: 400 }
      );
    }

    let attachmentData:
      | {
          filename: string;
          content: Buffer;
          contentType?: string;
        }
      | undefined;

    // Process CV attachment if one was selected
    if (attachment instanceof File) {
      if (attachment.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: "CV file is too large. Maximum allowed size is 4 MB.",
          },
          { status: 400 }
        );
      }

      if (attachment.size === 0) {
        return NextResponse.json(
          {
            error: "The selected CV file is empty.",
          },
          { status: 400 }
        );
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      const allowedExtensions = [".pdf", ".doc", ".docx"];

      const filename = attachment.name.toLowerCase();

      const hasValidExtension = allowedExtensions.some((extension) =>
        filename.endsWith(extension)
      );

      const hasValidMimeType = allowedTypes.includes(attachment.type);

      if (!hasValidExtension || !hasValidMimeType) {
        return NextResponse.json(
          {
            error: "Please upload a PDF, DOC, or DOCX file.",
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await attachment.arrayBuffer());

      attachmentData = {
        filename: attachment.name,
        content: buffer,
        contentType: attachment.type,
      };
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
    });

    await transporter.verify();

    const mailOptions: nodemailer.SendMailOptions = {
      from: senderEmail,
      to: recipients,
      subject,
      text: emailBody,
      html: convertTextToHtml(emailBody),
    };

    if (attachmentData) {
      mailOptions.attachments = [attachmentData];
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: attachmentData
        ? "Email sent successfully with attachment."
        : "Email sent successfully.",
      attachment: attachmentData?.filename || null,
    });
  } catch (error: any) {
    console.error("Send email error:", error);

    let message = "Failed to send email.";

    if (error?.code === "EAUTH") {
      message =
        "Gmail authentication failed. Check your email address and Gmail App Password.";
    } else if (error?.code === "ECONNECTION") {
      message = "Could not connect to Gmail SMTP.";
    } else if (error?.code === "EMESSAGE") {
      message = "Gmail rejected the email or attachment.";
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

<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #222;">
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
"use client";

import { useState } from "react";

export default function Home() {
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPassword, setSenderPassword] = useState("");
  const [recipientText, setRecipientText] = useState("");

  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");

  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function generateEmail() {
    setGenerating(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          resumeText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate email.");
      }

      setSubject(data.subject);
      setEmailBody(data.body);
      setMessage("Email generated successfully.");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function sendEmail() {
    setSending(true);
    setMessage("");
    setError("");

    try {
      const recipients = recipientText
        .split(/[,\n;]/)
        .map((email) => email.trim())
        .filter(Boolean);

      if (recipients.length === 0) {
        throw new Error("Enter at least one recipient.");
      }

      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderEmail,
          senderPassword,
          recipients,
          subject,
          emailBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email.");
      }

      setMessage("Email sent successfully.");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            Job Mailer AI
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Generate tailored application emails and send them directly from
            your Gmail account.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Sender details */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-5 text-lg font-medium">Email account</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Sender email
                </label>

                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Gmail App Password
                </label>

                <input
                  type="password"
                  value={senderPassword}
                  onChange={(e) => setSenderPassword(e.target.value)}
                  placeholder="Enter your Gmail App Password"
                  autoComplete="off"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-400"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              Your Gmail password is only used for the current send request and
              is not stored by this application.
            </p>
          </section>

          {/* Recipient */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-5 text-lg font-medium">Recipients</h2>

            <label className="mb-2 block text-sm text-zinc-400">
              Recipient email(s)
            </label>

            <textarea
              value={recipientText}
              onChange={(e) => setRecipientText(e.target.value)}
              placeholder="recruiter@example.com&#10;hr@example.com"
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-400"
            />

            <p className="mt-2 text-xs text-zinc-500">
              Separate multiple addresses with commas, semicolons, or new
              lines.
            </p>
          </section>

          {/* Job + Resume */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-5 text-lg font-medium">Job Description</h2>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                rows={18}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 outline-none transition focus:border-zinc-400"
              />
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-5 text-lg font-medium">Resume</h2>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={18}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 outline-none transition focus:border-zinc-400"
              />
            </section>
          </div>

          {/* Generate button */}
          <button
            onClick={generateEmail}
            disabled={
              generating ||
              !jobDescription.trim() ||
              !resumeText.trim()
            }
            className="rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? "Generating..." : "Generate Email"}
          </button>

          {/* Generated email */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-medium">Generated Email</h2>

              <span className="text-xs text-zinc-500">
                Editable
              </span>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm text-zinc-400">
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Body
              </label>

              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Your generated email will appear here..."
                rows={18}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-7 outline-none transition focus:border-zinc-400"
              />
            </div>
          </section>

          {/* Send */}
          <button
            onClick={sendEmail}
            disabled={
              sending ||
              !senderEmail.trim() ||
              !senderPassword.trim() ||
              !subject.trim() ||
              !emailBody.trim()
            }
            className="rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>

          {/* Status */}
          {message && (
            <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <p className="pb-10 text-center text-xs text-zinc-600">
            Gmail credentials are never stored by this application.
          </p>
        </div>
      </div>
    </main>
  );
}
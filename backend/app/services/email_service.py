"""
Email Service — SMTP email delivery for HireSense
Supports: password reset, welcome email, interview completion report
Uses Python's built-in smtplib — no extra packages needed
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from app.core.config import settings


# ─── Send raw email ──────────────────────────────────────────
def send_email(
    to_email: str, subject: str, html_body: str, text_body: str = ""
) -> bool:
    """Send an email via SMTP. Returns True on success, False on failure."""
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        # Dev mode — print to console instead of sending
        print(f"\n{'='*60}")
        print(f"📧 EMAIL (dev mode — SMTP not configured)")
        print(f"   To:      {to_email}")
        print(f"   Subject: {subject}")
        print(f"   Body:    {text_body or 'See HTML body'}")
        print(f"{'='*60}\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()

        if settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(
                settings.SMTP_HOST, settings.SMTP_PORT, context=context
            ) as server:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                if settings.SMTP_USE_TLS:
                    server.starttls(context=context)
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        return True

    except Exception as e:
        print(f"❌ Email send failed to {to_email}: {str(e)}")
        return False


# ─── Email Templates ─────────────────────────────────────────
def _base_template(content: str, preview_text: str = "") -> str:
    """Wrap content in the HireSense branded email template."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>HireSense</title>
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ background:#0a0a0f; font-family:'Segoe UI',Arial,sans-serif; color:#e2e8f0; }}
    .wrapper {{ max-width:560px; margin:0 auto; padding:32px 16px; }}
    .card {{ background:#1a1a26; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden; }}
    .header {{ background:#12121a; padding:24px 32px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; gap:12px; }}
    .logo-box {{ width:36px; height:36px; background:#c8f135; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }}
    .logo-text {{ font-size:11px; font-weight:800; color:#0a0a0f; }}
    .app-name {{ font-size:18px; font-weight:800; color:#fff; letter-spacing:-0.5px; }}
    .app-sub {{ font-size:11px; color:#64748b; margin-top:1px; }}
    .body {{ padding:32px; }}
    .title {{ font-size:22px; font-weight:700; color:#fff; margin-bottom:8px; letter-spacing:-0.3px; }}
    .subtitle {{ font-size:14px; color:#94a3b8; margin-bottom:24px; line-height:1.6; }}
    .btn {{ display:inline-block; background:#c8f135; color:#0a0a0f; font-weight:700; font-size:14px; padding:14px 28px; border-radius:12px; text-decoration:none; margin:8px 0; }}
    .token-box {{ background:#12121a; border:1px solid rgba(200,241,53,0.2); border-radius:10px; padding:16px 20px; margin:16px 0; font-family:monospace; font-size:14px; color:#c8f135; letter-spacing:1px; word-break:break-all; }}
    .divider {{ border:none; border-top:1px solid rgba(255,255,255,0.06); margin:24px 0; }}
    .note {{ font-size:12px; color:#64748b; line-height:1.6; }}
    .note strong {{ color:#94a3b8; }}
    .footer {{ padding:20px 32px; background:#12121a; border-top:1px solid rgba(255,255,255,0.06); text-align:center; }}
    .footer p {{ font-size:11px; color:#475569; line-height:1.6; }}
    .footer a {{ color:#64748b; text-decoration:none; }}
    .highlight {{ color:#c8f135; }}
    .warning-box {{ background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); border-radius:10px; padding:14px 18px; margin:16px 0; font-size:13px; color:#fbbf24; }}
    .stat-row {{ display:flex; gap:12px; margin:16px 0; }}
    .stat {{ flex:1; background:#12121a; border-radius:10px; padding:12px; text-align:center; }}
    .stat-val {{ font-size:22px; font-weight:700; color:#c8f135; }}
    .stat-lbl {{ font-size:11px; color:#64748b; margin-top:2px; }}
  </style>
</head>
<body>
  {'<div style="display:none;max-height:0;overflow:hidden;">' + preview_text + '</div>' if preview_text else ''}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-box"><span class="logo-text">AI</span></div>
        <div>
          <div class="app-name">HireSense</div>
          <div class="app-sub">Smart Interview Preparation Platform</div>
        </div>
      </div>
      <div class="body">
        {content}
      </div>
      <div class="footer">
        <p>© {datetime.now().year} HireSense · Smart Interview Preparation</p>
        <p style="margin-top:4px"><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
      </div>
    </div>
  </div>
</body>
</html>"""


# ─── Password Reset Email ─────────────────────────────────────
def send_password_reset_email(to_email: str, full_name: str, reset_token: str) -> bool:
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    content = f"""
    <div class="title">Reset your password</div>
    <div class="subtitle">Hi {full_name}, we received a request to reset your HireSense password.</div>

    <a href="{reset_link}" class="btn">Reset Password →</a>

    <div class="divider"></div>

    <p style="font-size:13px;color:#94a3b8;margin-bottom:8px;">Or copy and paste this token manually:</p>
    <div class="token-box">{reset_token}</div>

    <div class="warning-box">
      ⏱️ This link expires in <strong>30 minutes</strong>.
      If you didn't request a password reset, you can safely ignore this email.
    </div>

    <hr class="divider"/>
    <div class="note">
      If the button doesn't work, paste this URL into your browser:<br/>
      <strong style="word-break:break-all;font-size:11px;">{reset_link}</strong>
    </div>
    """

    text_body = f"""Hi {full_name},

Reset your HireSense password using this token:

{reset_token}

Or visit: {reset_link}

This token expires in 30 minutes.

If you didn't request this, ignore this email.

— HireSense Team"""

    return send_email(
        to_email=to_email,
        subject="Reset your HireSense password",
        html_body=_base_template(
            content, "Reset your HireSense password — token inside"
        ),
        text_body=text_body,
    )


# ─── Welcome Email ────────────────────────────────────────────
def send_welcome_email(to_email: str, full_name: str) -> bool:
    features = [
        ("🎤", "AI Interviewer", "Role-specific questions generated from your resume"),
        ("🎙️", "Voice Analysis", "Speech rate, confidence, filler word detection"),
        ("📄", "Resume Review", "ATS scoring and keyword gap analysis"),
        ("📊", "Performance Analytics", "Track your progress with charts and trends"),
        ("📥", "PDF Reports", "Export detailed reports after each session"),
    ]

    features_html = "".join(f"""
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:16px;">{icon}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <strong style="color:#fff;font-size:13px;">{title}</strong>
            <div style="font-size:12px;color:#64748b;margin-top:2px;">{desc}</div>
          </td>
        </tr>
        """ for icon, title, desc in features)

    content = f"""
    <div class="title">Welcome to HireSense! 🎉</div>
    <div class="subtitle">
      Hi {full_name}, your account is ready. Start practicing interviews
      with AI-powered question generation and real-time voice analysis.
    </div>

    <a href="{settings.FRONTEND_URL}/interview/new" class="btn">
      Start Your First Interview →
    </a>

    <hr class="divider"/>

    <p style="font-size:13px;font-weight:600;color:#fff;margin-bottom:12px;">
      What you can do with HireSense:
    </p>

    <table style="width:100%;border-collapse:collapse;">
      {features_html}
    </table>

    <hr class="divider"/>

    <div class="note">
      Need help? Reply to this email or visit our docs at
      <a href="{settings.FRONTEND_URL}" style="color:#c8f135;">
        {settings.FRONTEND_URL}
      </a>
    </div>
    """

    text_body = f"""Welcome to HireSense, {full_name}!

Your account is ready. Start practicing at: {settings.FRONTEND_URL}

Features:
- AI-generated interview questions
- Voice analysis and scoring
- Resume ATS review
- Performance analytics
- PDF report export

— HireSense Team"""

    return send_email(
        to_email=to_email,
        subject="Welcome to HireSense — Let's ace your next interview! 🚀",
        html_body=_base_template(
            content,
            f"Welcome {full_name}! Your HireSense account is ready.",
        ),
        text_body=text_body,
    )


# ─── Interview Completion Email ───────────────────────────────
def send_interview_completion_email(
    to_email: str,
    full_name: str,
    session_title: str,
    overall_score: float,
    technical_score: Optional[float],
    communication_score: Optional[float],
    confidence_score: Optional[float],
    session_id: int,
) -> bool:
    score_color = (
        "#c8f135"
        if overall_score >= 75
        else "#fbbf24" if overall_score >= 50 else "#f87171"
    )
    results_link = f"{settings.FRONTEND_URL}/interview/{session_id}/results"

    stats = [
        ("Technical", technical_score),
        ("Communication", communication_score),
        ("Confidence", confidence_score),
    ]
    stats_html = "".join(
        [
            f'<div class="stat"><div class="stat-val" style="color:{"#c8f135" if (v or 0) >= 75 else "#fbbf24" if (v or 0) >= 50 else "#f87171"}">{int(v or 0)}</div><div class="stat-lbl">{l}</div></div>'
            for l, v in stats
            if v is not None
        ]
    )

    content = f"""
    <div class="title">Interview Complete! 🎯</div>
    <div class="subtitle">
      Hi {full_name}, here's your performance summary for
      <strong style="color:#fff;">"{session_title}"</strong>.
    </div>

    <div style="text-align:center;padding:24px 0;">
      <div style="font-size:56px;font-weight:800;color:{score_color};line-height:1;">{int(overall_score)}</div>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">Overall Score / 100</div>
    </div>

    <div class="stat-row">{stats_html}</div>

    <a href="{results_link}" class="btn">View Full Report →</a>

    <hr class="divider"/>
    <div class="note">
      Your detailed report includes per-question AI feedback, keyword analysis,
      voice metrics, and personalized recommendations.
    </div>
    """

    text_body = f"""Hi {full_name},

Your interview "{session_title}" is complete!

Overall Score: {int(overall_score)}/100
Technical:     {int(technical_score or 0)}/100
Communication: {int(communication_score or 0)}/100
Confidence:    {int(confidence_score or 0)}/100

View full report: {results_link}

— HireSense Team"""

    return send_email(
        to_email=to_email,
        subject=f"HireSense Report — {session_title} — Score: {int(overall_score)}/100",
        html_body=_base_template(
            content, f"Your interview score: {int(overall_score)}/100"
        ),
        text_body=text_body,
    )

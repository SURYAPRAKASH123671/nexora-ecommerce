package ecommerce_backend.auth;

import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class EmailVerificationEmailBuilder {

	public String build(String customerName, String verificationUrl) {
		String safeName = HtmlUtils.htmlEscape(customerName);
		String safeUrl = HtmlUtils.htmlEscape(verificationUrl);
		return """
				<div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
				  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:28px 0;">
				    <tr>
				      <td align="center">
				        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;width:100%%;background:#ffffff;border:1px solid #e5e7eb;">
				          <tr>
				            <td style="background:#0b1120;padding:24px 28px;color:#ffffff;">
				              <div style="font-size:28px;font-weight:bold;color:#4f83ff;">Nexora</div>
				              <div style="font-size:13px;color:#cbd5e1;margin-top:6px;">Secure account verification</div>
				            </td>
				          </tr>
				          <tr>
				            <td style="padding:30px 28px;">
				              <div style="display:inline-block;background:#e9f8ef;color:#147a45;font-size:12px;font-weight:bold;padding:7px 11px;border-radius:4px;text-transform:uppercase;">Action required</div>
				              <h1 style="font-size:24px;margin:18px 0 10px;color:#172033;">Verify your email address</h1>
				              <p style="font-size:15px;line-height:1.6;margin:0 0 18px;">Hi %s, welcome to Nexora. Confirm this email address to secure your account and start receiving order updates.</p>
				              <a href="%s" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 18px;border-radius:6px;">Verify Email</a>
				              <p style="font-size:12px;line-height:1.6;color:#64748b;margin:22px 0 0;">This link expires in 24 hours. If you did not create a Nexora account, you can safely ignore this email.</p>
				            </td>
				          </tr>
				          <tr>
				            <td style="background:#f8fafc;padding:18px 28px;font-size:12px;color:#64748b;border-top:1px solid #e5e7eb;">Nexora Account Security</td>
				          </tr>
				        </table>
				      </td>
				    </tr>
				  </table>
				</div>
				""".formatted(safeName, safeUrl);
	}
}

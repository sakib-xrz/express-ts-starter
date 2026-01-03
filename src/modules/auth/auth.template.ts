interface PasswordResetEmailTemplateProps {
  userName: string;
  resetUrl: string;
}

const passwordResetEmailTemplate = ({
  resetUrl,
  userName,
}: PasswordResetEmailTemplateProps) => {
  return `
    <h2>Password Reset Request</h2>
    <p>Hello ${userName},</p>
    <p>You requested to reset your password. Click the link below to reset your password:</p>
    <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>Or copy and paste this URL into your browser:</p>
    <p>${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
};

const AuthTemplate = {
  passwordResetEmailTemplate,
};

export default AuthTemplate;

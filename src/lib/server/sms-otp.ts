import "server-only";

/**
 * SMS OTP is specified for the first publish. Delivery needs a provider key.
 * Without SMS_OTP_ENABLED=1 and SMS_OTP_API_KEY the gate stays open and the
 * form says so. Telegram Gateway (existing login OTP) is a separate channel.
 */
export function smsOtpConfig() {
  const enabled = process.env.SMS_OTP_ENABLED?.trim() === "1";
  const key = process.env.SMS_OTP_API_KEY?.trim() || "";
  const provider = process.env.SMS_OTP_PROVIDER?.trim() || "";
  return { enabled: enabled && Boolean(key), provider: provider || "unconfigured", hasKey: Boolean(key) };
}

export function smsOtpPublicStatus() {
  const cfg = smsOtpConfig();
  if (cfg.enabled) {
    return { sms: true as const, message: "Birinchi joylashdan oldin SMS kod so‘raladi." };
  }
  return {
    sms: false as const,
    message: "SMS tasdiqlash hali ulanmagan: provayder kaliti yo‘q. Joylash bloklanmaydi. Telegram orqali tasdiqlangan raqamlar alohida ishlaydi.",
  };
}
